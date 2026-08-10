import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------- Utilità date/orari ----------

// Converte "HH:MM" in minuti dalla mezzanotte, per confronti rapidi
const toMinuti = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Due fasce orarie si sovrappongono?
function fasceSiSovrappongono(inizioA, fineA, inizioB, fineB) {
  return toMinuti(inizioA) < toMinuti(fineB) && toMinuti(inizioB) < toMinuti(fineA);
}

// ---------- Controllo sovrapposizioni ----------

// Verifica se un nuovo turno si sovrappone a turni esistenti dello stesso dipendente
// nella stessa data. Ritorna il turno in conflitto, o null se libero.
export async function trovaConflittoTurno({ dipendenteId, data, oraInizio, oraFine, turnoIdEscluso }) {
  const q = query(
    collection(db, "turni"),
    where("dipendenteId", "==", dipendenteId),
    where("data", "==", data)
  );
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    if (docSnap.id === turnoIdEscluso) continue;
    const t = docSnap.data();
    if (fasceSiSovrappongono(oraInizio, oraFine, t.oraInizio, t.oraFine)) {
      return { id: docSnap.id, ...t };
    }
  }
  return null;
}

// Verifica se una data/fascia si sovrappone a un'assenza approvata del dipendente
export async function trovaConflittoAssenza({ dipendenteId, data }) {
  const q = query(
    collection(db, "assenze"),
    where("dipendenteId", "==", dipendenteId),
    where("stato", "==", "approvata")
  );
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    const a = docSnap.data();
    if (data >= a.dataInizio && data <= a.dataFine) {
      return { id: docSnap.id, ...a };
    }
  }
  return null;
}

// Verifica se una data è un giorno di chiusura/festività
export async function isGiornoFestivo(data) {
  const q = query(collection(db, "festivita"), where("data", "==", data));
  const snap = await getDocs(q);
  return !snap.empty;
}

// ---------- CRUD Turni ----------

// Crea un turno, con controllo blocco su sovrapposizione e giorno festivo.
// Lancia un errore con messaggio leggibile se il turno non può essere creato.
export async function creaTurno(turno) {
  if (await isGiornoFestivo(turno.data)) {
    throw new Error("Questo giorno è segnato come chiusura/festività: non è possibile assegnare turni.");
  }
  const conflitto = await trovaConflittoTurno(turno);
  if (conflitto) {
    throw new Error(
      `Sovrapposizione con un turno esistente (${conflitto.oraInizio}-${conflitto.oraFine}) per lo stesso dipendente.`
    );
  }
  const conflittoAssenza = await trovaConflittoAssenza(turno);
  if (conflittoAssenza) {
    throw new Error(`Il dipendente ha un'assenza approvata (${conflittoAssenza.tipo}) in questa data.`);
  }
  return addDoc(collection(db, "turni"), {
    ...turno,
    stato: "confermato",
    creatoIl: Timestamp.now(),
  });
}

export async function aggiornaTurno(turnoId, modifiche) {
  // Se si cambia data/orario, riverifica i conflitti
  if (modifiche.data || modifiche.oraInizio || modifiche.oraFine) {
    const conflitto = await trovaConflittoTurno({ ...modifiche, turnoIdEscluso: turnoId });
    if (conflitto) {
      throw new Error(
        `Sovrapposizione con un turno esistente (${conflitto.oraInizio}-${conflitto.oraFine}).`
      );
    }
  }
  return updateDoc(doc(db, "turni", turnoId), modifiche);
}

export async function eliminaTurno(turnoId) {
  return deleteDoc(doc(db, "turni", turnoId));
}

// ---------- Richieste di cambio turno ----------

export async function richiediCambioTurno({ turnoId, daId, aId }) {
  return addDoc(collection(db, "richiesteCambio"), {
    turnoId,
    daId,
    aId,
    stato: "pending",
    timestamp: Timestamp.now(),
  });
}

// Il collega destinatario accetta: il cambio diventa DEFINITIVO subito
// (nessuna approvazione del titolare richiesta, come da requisito).
export async function accettaCambioTurno(richiesta) {
  const conflitto = await trovaConflittoTurno({
    dipendenteId: richiesta.aId,
    data: richiesta.data,
    oraInizio: richiesta.oraInizio,
    oraFine: richiesta.oraFine,
    turnoIdEscluso: richiesta.turnoId,
  });
  if (conflitto) {
    throw new Error("Il collega ha già un turno in questa fascia oraria: impossibile accettare.");
  }
  await updateDoc(doc(db, "turni", richiesta.turnoId), { dipendenteId: richiesta.aId });
  await updateDoc(doc(db, "richiesteCambio", richiesta.id), { stato: "accettata" });
}

export async function rifiutaCambioTurno(richiestaId) {
  return updateDoc(doc(db, "richiesteCambio", richiestaId), { stato: "rifiutata" });
}

// ---------- Assenze ----------

export async function richiediAssenza(assenza) {
  return addDoc(collection(db, "assenze"), {
    ...assenza,
    stato: "richiesta",
    timestamp: Timestamp.now(),
  });
}

export async function approvaAssenza(assenzaId) {
  return updateDoc(doc(db, "assenze", assenzaId), { stato: "approvata" });
}

export async function rifiutaAssenza(assenzaId, note = "") {
  return updateDoc(doc(db, "assenze", assenzaId), { stato: "rifiutata", note });
}

// ---------- Turni ricorrenti ----------

const GIORNI_ITA = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];

// Genera i turni singoli a partire da un template ricorrente, per un range di date.
// I turni generati sono normali documenti in `turni/`, modificabili singolarmente.
export async function generaTurniDaRicorrenza(ricorrenza, dataInizioRange, dataFineRange) {
  const generati = [];
  const errori = [];
  let cursore = new Date(dataInizioRange);
  const fine = new Date(dataFineRange);

  while (cursore <= fine) {
    const giornoStr = GIORNI_ITA[cursore.getDay()];
    if (ricorrenza.giorniSettimana.includes(giornoStr)) {
      const dataStr = cursore.toISOString().split("T")[0];
      try {
        const ref = await creaTurno({
          dipendenteId: ricorrenza.dipendenteId,
          data: dataStr,
          oraInizio: ricorrenza.oraInizio,
          oraFine: ricorrenza.oraFine,
          skillRichiesta: ricorrenza.skillRichiesta || [],
          note: "Generato da turno ricorrente",
          ricorrenzaId: ricorrenza.id,
        });
        generati.push(ref.id);
      } catch (e) {
        errori.push({ data: dataStr, messaggio: e.message });
      }
    }
    cursore.setDate(cursore.getDate() + 1);
  }
  return { generati, errori };
}

export async function creaTurnoRicorrente(ricorrenza) {
  return addDoc(collection(db, "turniRicorrenti"), ricorrenza);
}

export async function eliminaTurnoRicorrente(id) {
  return deleteDoc(doc(db, "turniRicorrenti", id));
}

// ---------- Festività ----------

export async function aggiungiFestivita(data, descrizione) {
  return addDoc(collection(db, "festivita"), { data, descrizione });
}

export async function eliminaFestivita(id) {
  return deleteDoc(doc(db, "festivita", id));
}

// ---------- Dipendenti ----------

export async function creaDipendente(dipendente) {
  return addDoc(collection(db, "dipendenti"), { ...dipendente, attivo: true });
}

export async function aggiornaDipendente(id, modifiche) {
  return updateDoc(doc(db, "dipendenti", id), modifiche);
}
