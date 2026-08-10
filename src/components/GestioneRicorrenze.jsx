import { useState } from "react";
import {
  creaTurnoRicorrente,
  eliminaTurnoRicorrente,
  generaTurniDaRicorrenza,
} from "../lib/turniService";

const GIORNI = [
  { key: "lun", label: "Lun" },
  { key: "mar", label: "Mar" },
  { key: "mer", label: "Mer" },
  { key: "gio", label: "Gio" },
  { key: "ven", label: "Ven" },
  { key: "sab", label: "Sab" },
  { key: "dom", label: "Dom" },
];

export default function GestioneRicorrenze({ ricorrenze, dipendenti }) {
  const [giorniSel, setGiorniSel] = useState([]);
  const [messaggio, setMessaggio] = useState("");
  const nomeDip = (id) => dipendenti.find((d) => d.id === id)?.nome || "—";

  function toggleGiorno(key) {
    setGiorniSel((prev) => (prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]));
  }

  async function handleCrea(e) {
    e.preventDefault();
    const form = e.target;
    if (giorniSel.length === 0) {
      setMessaggio("Seleziona almeno un giorno della settimana.");
      return;
    }
    await creaTurnoRicorrente({
      dipendenteId: form.dipendente.value,
      giorniSettimana: giorniSel,
      oraInizio: form.oraInizio.value,
      oraFine: form.oraFine.value,
      skillRichiesta: form.skill.value ? form.skill.value.split(",").map((s) => s.trim()) : [],
    });
    setMessaggio("Template creato. Usa 'Genera turni' per applicarlo a un periodo.");
    setGiorniSel([]);
    form.reset();
  }

  async function handleGenera(ric) {
    const dataInizio = prompt("Genera dal (AAAA-MM-GG):");
    if (!dataInizio) return;
    const dataFine = prompt("Fino al (AAAA-MM-GG):");
    if (!dataFine) return;
    const { generati, errori } = await generaTurniDaRicorrenza(ric, dataInizio, dataFine);
    setMessaggio(
      `Generati ${generati.length} turni.` +
        (errori.length ? ` ${errori.length} saltati per conflitto (es. ${errori[0].data}: ${errori[0].messaggio}).` : "")
    );
  }

  return (
    <div className="pannello">
      <h3>Turni ricorrenti</h3>
      <form onSubmit={handleCrea} className="form-ricorrenza">
        <select name="dipendente" required defaultValue="">
          <option value="" disabled>
            Dipendente
          </option>
          {dipendenti.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
        <div className="giorni-selettore">
          {GIORNI.map((g) => (
            <button
              type="button"
              key={g.key}
              className={giorniSel.includes(g.key) ? "attivo" : ""}
              onClick={() => toggleGiorno(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <input type="time" name="oraInizio" required defaultValue="09:00" />
        <input type="time" name="oraFine" required defaultValue="13:00" />
        <input type="text" name="skill" placeholder="Skill richiesta (opz.)" />
        <button type="submit">Crea template</button>
      </form>
      {messaggio && <p className="info">{messaggio}</p>}

      <ul className="lista-ricorrenze">
        {ricorrenze.map((r) => (
          <li key={r.id}>
            <span>
              {nomeDip(r.dipendenteId)} — {r.giorniSettimana.join(", ")} · {r.oraInizio}-{r.oraFine}
            </span>
            <div>
              <button onClick={() => handleGenera(r)}>Genera turni</button>
              <button onClick={() => eliminaTurnoRicorrente(r.id)}>Elimina</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
