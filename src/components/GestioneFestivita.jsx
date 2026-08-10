import { aggiungiFestivita, eliminaFestivita } from "../lib/turniService";

export default function GestioneFestivita({ festivita }) {
  async function handleAggiungi(e) {
    e.preventDefault();
    const form = e.target;
    await aggiungiFestivita(form.data.value, form.descrizione.value);
    form.reset();
  }

  return (
    <div className="pannello">
      <h3>Calendario chiusure</h3>
      <form className="form-inline" onSubmit={handleAggiungi}>
        <input type="date" name="data" required />
        <input type="text" name="descrizione" placeholder="es. Ferragosto" required />
        <button type="submit">Aggiungi chiusura</button>
      </form>
      <ul className="lista-festivita">
        {festivita
          .sort((a, b) => a.data.localeCompare(b.data))
          .map((f) => (
            <li key={f.id}>
              <span>
                {f.data} — {f.descrizione}
              </span>
              <button onClick={() => eliminaFestivita(f.id)}>Rimuovi</button>
            </li>
          ))}
        {festivita.length === 0 && <p className="vuoto">Nessuna chiusura programmata.</p>}
      </ul>
    </div>
  );
}
