import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

// Hook generico: ascolta una collection in tempo reale
export function useFirestoreCollection(nomeCollection, campoOrdine = null) {
  const [dati, setDati] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const ref = collection(db, nomeCollection);
    const q = campoOrdine ? query(ref, orderBy(campoOrdine)) : ref;
    const unsub = onSnapshot(q, (snap) => {
      setDati(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCaricamento(false);
    });
    return unsub;
  }, [nomeCollection, campoOrdine]);

  return { dati, caricamento };
}
