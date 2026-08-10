// Le notifiche push richiedono un invio server-side: un client non può inviare
// una push a un altro utente, può solo RICEVERLA. Queste Cloud Functions
// osservano Firestore e inviano la notifica al destinatario giusto.
//
// Richiede il piano Firebase "Blaze" (pay-as-you-go, con generosa soglia gratuita).
// Deploy: firebase deploy --only functions

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

initializeApp();
const db = getFirestore();

async function inviaPushADipendente(dipendenteId, notification) {
  const utentiSnap = await db.collection("utenti").where("dipendenteId", "==", dipendenteId).get();
  const token = utentiSnap.docs[0]?.data()?.fcmToken;
  if (!token) return;
  await getMessaging().send({ token, notification }).catch((e) => console.error("Invio push fallito:", e));
}

// Nuovo turno assegnato → avvisa il dipendente
exports.notificaNuovoTurno = onDocumentCreated("turni/{turnoId}", async (event) => {
  const turno = event.data.data();
  await inviaPushADipendente(turno.dipendenteId, {
    title: "Nuovo turno assegnato",
    body: `${turno.data} · ${turno.oraInizio}-${turno.oraFine}`,
  });
});

// Richiesta di cambio turno → avvisa il collega destinatario
exports.notificaRichiestaCambio = onDocumentCreated("richiesteCambio/{id}", async (event) => {
  const r = event.data.data();
  await inviaPushADipendente(r.aId, {
    title: "Ti hanno proposto un cambio turno",
    body: `Turno del ${r.data}, ${r.oraInizio}-${r.oraFine}`,
  });
});

// Esito assenza (approvata/rifiutata) → avvisa il dipendente
exports.notificaEsitoAssenza = onDocumentUpdated("assenze/{id}", async (event) => {
  const prima = event.data.before.data();
  const dopo = event.data.after.data();
  if (prima.stato === dopo.stato) return;
  if (!["approvata", "rifiutata"].includes(dopo.stato)) return;
  await inviaPushADipendente(dopo.dipendenteId, {
    title: dopo.stato === "approvata" ? "Assenza approvata" : "Assenza rifiutata",
    body: `${dopo.tipo} del ${dopo.dataInizio}`,
  });
});
