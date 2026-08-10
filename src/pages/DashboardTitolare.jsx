import { useState } from "react";
import { useFirestoreCollection } from "../hooks/useFirestoreCollection";
import { useAuth } from "../lib/AuthContext";
import GrigliaSettimanale from "../components/GrigliaSettimanale";
import GestioneAssenze from "../components/GestioneAssenze";
import GestioneFestivita from "../components/GestioneFestivita";
import GestioneDipendenti from "../components/GestioneDipendenti";
import GestioneRicorrenze from "../components/GestioneRicorrenze";

const TAB = ["Griglia", "Assenze", "Dipendenti", "Ricorrenze", "Festività"];

export default function DashboardTitolare() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("Griglia");
  const { dati: dipendenti } = useFirestoreCollection("dipendenti", "nome");
  const { dati: turni } = useFirestoreCollection("turni");
  const { dati: assenze } = useFirestoreCollection("assenze");
  const { dati: festivita } = useFirestoreCollection("festivita");
  const { dati: ricorrenze } = useFirestoreCollection("turniRicorrenti");

  const richiesteInAttesa = assenze.filter((a) => a.stato === "richiesta").length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Turni</h1>
        <button onClick={logout}>Esci</button>
      </header>

      <nav className="tabs">
        {TAB.map((t) => (
          <button key={t} className={tab === t ? "attivo" : ""} onClick={() => setTab(t)}>
            {t}
            {t === "Assenze" && richiesteInAttesa > 0 && (
              <span className="badge-num">{richiesteInAttesa}</span>
            )}
          </button>
        ))}
      </nav>

      <main>
        {tab === "Griglia" && (
          <GrigliaSettimanale
            dipendenti={dipendenti.filter((d) => d.attivo !== false)}
            turni={turni}
            festivita={festivita}
            dataRif={new Date()}
          />
        )}
        {tab === "Assenze" && <GestioneAssenze assenze={assenze} dipendenti={dipendenti} />}
        {tab === "Dipendenti" && <GestioneDipendenti dipendenti={dipendenti} />}
        {tab === "Ricorrenze" && (
          <GestioneRicorrenze ricorrenze={ricorrenze} dipendenti={dipendenti} />
        )}
        {tab === "Festività" && <GestioneFestivita festivita={festivita} />}
      </main>
    </div>
  );
}
