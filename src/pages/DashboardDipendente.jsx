import { useState } from "react";
import { useFirestoreCollection } from "../hooks/useFirestoreCollection";
import { useAuth } from "../lib/AuthContext";
import {
  richiediCambioTurno,
  accettaCambioTurno,
  rifiutaCambioTurno,
  richiediAssenza,
} from "../lib/turniService";

export default function DashboardDipendente() {
  const { logout, profilo } = useAuth();
  const mioId = profilo?.dipendenteId;

  const { dati: dipendenti } = useFirestoreCollection("dipendenti", "nome");
  const { dati: turni } = useFirestoreCollection("turni");
  const { dati: richieste } = useFirestoreCollection("richiesteCambio");
  const { dati: assenze } = useFirestoreCollection("assenze");

  const [proponiPer, setProponiPer] = useState(null); // turno object
  const [erroreCambio, setErroreCambio] = useState("");
  const [messaggioAssenza, setMessaggioAssenza] = useState("");

  const nomeDip = (id) => dipendenti.find((d) => d.id === id)?.nome || "—";

  const mieiTurni = turni
    .filter((t) => t.dipendenteId === mioId)
    .sort((a, b) => a.data.localeCompare(b.data));

  const ricevute = richieste.filter((r) => r.aId === mioId && r.stato === "pending");
  const inviate = richieste.filter((r) => r.daId === mioId);

  const mieAssenze = assenze
    .filter((a) => a.dipendenteId === mioId)
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

  // Colleghi compatibili per un dato turno (se il turno richiede skill, filtra)
  function colleghiCompatibili(turno) {
    return dipendenti.filter((d) => {
      if (d.id === mioId) return false;
      if (d.attivo === false) return false;
      if (!turno.skillRichiesta?.length) return true;
      return turno.skillRichiesta.every((s) => (d.skills || []).includes(s));
    });
  }

  async function inviaRichiestaCambio(e) {
    e.preventDefault();
    setErroreCambio("");
    const aId = e.target.collega.value;
    try {
      await richiediCambioTurno({
        turnoId: proponiPer.id,
        daId: mioId,
        aId,
        data: proponiPer.data,
        oraInizio: proponiPer.oraInizio,
        oraFine: proponiPer.oraFine,
      });
      setProponiPer(null);
    } catch (err) {
      setErroreCambio(err.message);
    }
  }

  async function handleAccetta(r) {
    try {
      await accettaCambioTurno(r);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRichiestaAssenza(e) {
    e.preventDefault();
    const form = e.target;
    await richiediAssenza({
      dipendenteId: mioId,
      tipo: form.tipo.value,
      dataInizio: form.dataInizio.value,
      dataFine: form.dataFine.value || form.dataInizio.value,
      oraInizio: form.tipo.value === "permesso" ? form.oraInizio.value : null,
      oraFine: form.tipo.value === "permesso" ? form.oraFine.value : null,
      note: form.note.value,
    });
    setMessaggioAssenza("Richiesta inviata, in attesa di approvazione.");
    form.reset();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>I miei turni</h1>
        <button onClick={logout}>Esci</button>
      </header>

      <main className="dipendente-main">
        {ricevute.length > 0 && (
          <section className="pannello">
            <h3>Richieste di cambio ricevute</h3>
            {ricevute.map((r) => (
              <div key={r.id} className="riga-richiesta">
                <div>
                  <strong>{nomeDip(r.daId)}</strong> ti propone il turno del {r.data} ({r.oraInizio}-{r.oraFine})
                </div>
                <div className="azioni">
                  <button className="ok" onClick={() => handleAccetta(r)}>
                    Accetta
                  </button>
                  <button className="no" onClick={() => rifiutaCambioTurno(r.id)}>
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="pannello">
          <h3>I tuoi prossimi turni</h3>
          {mieiTurni.length === 0 && <p className="vuoto">Nessun turno programmato.</p>}
          {mieiTurni.map((t) => {
            const richiestaAperta = inviate.find((r) => r.turnoId === t.id && r.stato === "pending");
            return (
              <div key={t.id} className="riga-turno">
                <div>
                  <strong>{t.data}</strong> · {t.oraInizio}-{t.oraFine}
                  {t.note && <div className="nota">{t.note}</div>}
                </div>
                {richiestaAperta ? (
                  <span className="stato-pending">Cambio richiesto → {nomeDip(richiestaAperta.aId)}</span>
                ) : (
                  <button onClick={() => setProponiPer(t)}>Richiedi cambio</button>
                )}
              </div>
            );
          })}
        </section>

        <section className="pannello">
          <h3>Richiedi ferie / permesso</h3>
          <form className="form-assenza" onSubmit={handleRichiestaAssenza}>
            <select name="tipo" defaultValue="ferie">
              <option value="ferie">Ferie</option>
              <option value="permesso">Permesso</option>
              <option value="malattia">Malattia</option>
            </select>
            <label>
              Dal
              <input type="date" name="dataInizio" required />
            </label>
            <label>
              Al (lascia vuoto se un solo giorno)
              <input type="date" name="dataFine" />
            </label>
            <label>
              Ora inizio (solo permesso)
              <input type="time" name="oraInizio" />
            </label>
            <label>
              Ora fine (solo permesso)
              <input type="time" name="oraFine" />
            </label>
            <input type="text" name="note" placeholder="Note (opzionale)" />
            <button type="submit">Invia richiesta</button>
          </form>
          {messaggioAssenza && <p className="info">{messaggioAssenza}</p>}

          <h4>Storico richieste</h4>
          {mieAssenze.map((a) => (
            <div key={a.id} className={`riga-storico ${a.stato}`}>
              {a.tipo} — {a.dataInizio}
              {a.dataFine !== a.dataInizio ? ` → ${a.dataFine}` : ""} — {a.stato}
            </div>
          ))}
        </section>
      </main>

      {proponiPer && (
        <div className="overlay" onClick={() => setProponiPer(null)}>
          <form className="modale" onClick={(e) => e.stopPropagation()} onSubmit={inviaRichiestaCambio}>
            <h3>Proponi cambio — {proponiPer.data}</h3>
            <select name="collega" required defaultValue="">
              <option value="" disabled>
                Scegli un collega
              </option>
              {colleghiCompatibili(proponiPer).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            {erroreCambio && <p className="errore">{erroreCambio}</p>}
            <div className="modale-azioni">
              <button type="button" onClick={() => setProponiPer(null)}>
                Annulla
              </button>
              <button type="submit">Invia richiesta</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
