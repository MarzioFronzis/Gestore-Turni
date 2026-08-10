import { approvaAssenza, rifiutaAssenza } from "../lib/turniService";

export default function GestioneAssenze({ assenze, dipendenti }) {
  const nomeDip = (id) => dipendenti.find((d) => d.id === id)?.nome || "—";
  const inAttesa = assenze.filter((a) => a.stato === "richiesta");
  const decise = assenze
    .filter((a) => a.stato !== "richiesta")
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
    .slice(0, 10);

  return (
    <div className="pannello">
      <h3>Richieste di assenza</h3>
      {inAttesa.length === 0 && <p className="vuoto">Nessuna richiesta in attesa.</p>}
      {inAttesa.map((a) => (
        <div key={a.id} className="riga-richiesta">
          <div>
            <strong>{nomeDip(a.dipendenteId)}</strong> — {a.tipo}
            <div className="dettaglio">
              {a.dataInizio}
              {a.dataFine !== a.dataInizio ? ` → ${a.dataFine}` : ""}
              {a.oraInizio ? ` · ${a.oraInizio}-${a.oraFine}` : ""}
            </div>
            {a.note && <div className="nota">{a.note}</div>}
          </div>
          <div className="azioni">
            <button className="ok" onClick={() => approvaAssenza(a.id)}>
              Approva
            </button>
            <button className="no" onClick={() => rifiutaAssenza(a.id)}>
              Rifiuta
            </button>
          </div>
        </div>
      ))}

      {decise.length > 0 && (
        <>
          <h4>Storico recente</h4>
          {decise.map((a) => (
            <div key={a.id} className={`riga-storico ${a.stato}`}>
              {nomeDip(a.dipendenteId)} — {a.tipo} ({a.dataInizio}) — {a.stato}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
