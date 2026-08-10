import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

// Sostituisci con la configurazione del TUO progetto Firebase
// (Console Firebase → Impostazioni progetto → Le tue app → Configurazione SDK)
const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROJECT.firebaseapp.com",
  projectId: "INSERISCI_PROJECT",
  storageBucket: "INSERISCI_PROJECT.appspot.com",
  messagingSenderId: "INSERISCI_SENDER_ID",
  appId: "INSERISCI_APP_ID",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Messaging (push) è supportato solo in contesti sicuri (https) e browser compatibili
export let messaging = null;
isSupported().then((supported) => {
  if (supported) messaging = getMessaging(app);
});
