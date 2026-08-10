import { useState } from "react";
import { creaDipendente, aggiornaDipendente } from "../lib/turniService";

const COLORI = ["#5B7FDE", "#DE8C5B", "#5BDE9E", "#C15BDE", "#DE5B7F", "#B5DE5B"];

export default function GestioneDipendenti({ dipendenti }) {
  const [nuovoNome, setNuovoNome] = useState("");

  async function handleAggiungi(e) {
    e.preventDefault();
    if (!nuovoNome.trim()) return;
    const colore = COLORI[dipendenti.length % COLORI.length];
    await creaDipendente({ nome: nuovoNome.trim(), ruolo: "dipendente", colore, skills: [] });
    setNuovoNome("");
  }

  function aggiungiSkill(dip, skill) {
    if (!skill.trim()) return;
    const skills = Array.from(new Set([...(dip.skills || []), skill.trim()]));
    aggiornaDipendente(dip.id, { skills });
  }

  function rimuoviSkill(dip, skill) {
    aggiornaDipendente(dip.id, { skills: (dip.skills || []).filter((s) => s !== skill) });
  }

  return (
    <div className="pannello">
      <h3>Dipendenti</h3>
      <form className="form-inline" onSubmit={handleAggiungi}>
        <input
          type="text"
          placeholder="Nome dipendente"
          value={nuovoNome}
          onChange={(e) => setNuovoNome(e.target.value)}
        />
        <button type="submit">Aggiungi</button>
      </form>

      {dipendenti.map((dip) => (
        <div key={dip.id} className="riga-dipendente">
          <div className="pallino" style={{ background: dip.colore }} />
          <strong>{dip.nome}</strong>
          <div className="skills-lista">
            {(dip.skills || []).map((s) => (
              <span key={s} className="skill-tag rimovibile" onClick={() => rimuoviSkill(dip, s)}>
                {s} ×
              </span>
            ))}
            <input
              type="text"
              placeholder="+ skill"
              className="skill-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aggiungiSkill(dip, e.target.value);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
