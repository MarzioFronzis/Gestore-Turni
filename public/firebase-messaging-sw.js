// Service worker per le notifiche push in background.
// Deve stare in /public (root del sito) per essere raggiungibile da /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Stessa configurazione di src/lib/firebase.js — duplicata qui perché il service
// worker gira in un contesto separato e non può importare moduli ES dell'app.
firebase.initializeApp({
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROJECT.firebaseapp.com",
  projectId: "INSERISCI_PROJECT",
  storageBucket: "INSERISCI_PROJECT.appspot.com",
  messagingSenderId: "INSERISCI_SENDER_ID",
  appId: "INSERISCI_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Turni", {
    body: body || "",
    icon: "/icon-192.png",
  });
});
