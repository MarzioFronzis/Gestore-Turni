import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { messaging, db } from "./firebase";

// Chiedi il permesso e salva il token FCM sul profilo dell'utente in `utenti/{uid}`.
// Da chiamare dopo il login (es. in un useEffect nella dashboard).
export async function attivaNotifichePush(uid) {
  if (!messaging) {
    console.warn("Le notifiche push non sono supportate in questo browser.");
    return false;
  }
  const permesso = await Notification.requestPermission();
  if (permesso !== "granted") return false;

  const token = await getToken(messaging, {
    vapidKey: "INSERISCI_VAPID_KEY", // Console Firebase → Cloud Messaging → Web Push certificates
  });
  if (token) {
    await updateDoc(doc(db, "utenti", uid), { fcmToken: token });
  }

  // Notifiche ricevute mentre l'app è aperta in primo piano
  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    if (title) new Notification(title, { body });
  });

  return true;
}
