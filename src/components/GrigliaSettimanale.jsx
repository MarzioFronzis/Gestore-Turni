import { Fragment, useMemo, useState } from "react";
import { creaTurno, eliminaTurno } from "../lib/turniService";

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Ritorna le 7 date (lun-dom) della settimana contenente `dataRif`
function settimanaDi(dataRif) {
  const d = new Date(dataRif);
  const giorno = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - giorno);
  return Array.from({ length: 7 }, (_, i) => {
    const g = new Date(d);
    g.setDate(d.getDate() + i);
    return g.toISOString().split("T")[0];
  });
}

export default function GrigliaSettimanale({ dipendenti, turni, festivita, dataRif }) {
  const [settimanaOffset, setSettimanaOffset] = useState(0);
  const [modaleAperto, setModaleAperto] = useState(null); // { dipendenteId, data } | null
  const [erroreModale, setErroreModale] = useState("");

  const riferimento = new Date(dataRif);
  riferimento.setDate(riferimento.getDate() + settimanaOffset * 7);
  const giorniSettimana = useMemo(() => settimanaDi(riferimento), [riferimento.getTime()]);

  const festivitaSet = new Set(festivita.map((f) => f.data));

  const turnoPer = (dipendenteId, data) =>
    turni.filter((t) => t.dipendenteId === dipendenteId && t.data === data);

  async function handleNuovoTurno(e) {
    e.preventDefault();
    const form = e.target;
    setErroreModale("");
    try {
      await creaTurno({
        dipendenteId: modaleAperto.dipendenteId,
        data: modaleAperto.data,
        oraInizio: form.oraInizio.value,
        oraFine: form.oraFine.value,
        note: form.note.value,
        skillRichiesta: form.skill.value
          ? form.skill.value.split(",").map((s) => s.trim())
          : [],
      });
      setModaleAperto(null);
    } catch (err) {
      setErroreModale(err.message);
    }
  }

  return (
    <div className="griglia-wrap">
      <div className="griglia-nav">
        <button onClick={() => setSettimanaOffset((s) => s - 1)}>← Settimana prec.</button>
        <span>
          {giorniSettimana[0]} — {giorniSettimana[6]}
        </span>
        <button onClick={() => setSettimanaOffset((s) => s + 1)}>Settimana succ. →</button>
      </div>

      <div className="griglia" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
        <div className="cella-header" />
        {giorniSettimana.map((data, i) => (
          <div
            key={data}
            className={`cella-header ${festivitaSet.has(data) ? "festivo" : ""}`}
          >
            <div>{GIORNI[i]}</div>
            <div className="data-piccola">{data.slice(8)}/{data.slice(5, 7)}</div>
            {festivitaSet.has(data) && <div className="badge-festivo">chiuso</div>}
          </div>
        ))}

        {dipendenti.map((dip) => (
          <Fragment key={dip.id}>
            <div className="cella-nome" style={{ borderLeft: `4px solid ${dip.colore || "#999"}` }}>
              {dip.nome}
              {dip.skills?.length > 0 && (
                <div className="skills-piccole">{dip.skills.join(" · ")}</div>
              )}
            </div>
            {giorniSettimana.map((data) => {
              const chiuso = festivitaSet.has(data);
              const turniGiorno = turnoPer(dip.id, data);
              return (
                <div
                  key={data}
                  className={`cella-turno ${chiuso ? "chiusa" : ""}`}
                  onClick={() => {
                    if (!chiuso) setModaleAperto({ dipendenteId: dip.id, data });
                  }}
                >
                  {turniGiorno.map((t) => (
                    <div key={t.id} className="turno-pill">
                      <span>{t.oraInizio}–{t.oraFine}</span>
                      {t.skillRichiesta?.length > 0 && (
                        <span className="skill-tag">{t.skillRichiesta.join(", ")}</span>
                      )}
                      <button
                        className="rimuovi"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminaTurno(t.id);
                        }}
                        title="Rimuovi turno"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {!chiuso && turniGiorno.length === 0 && <span className="placeholder">+</span>}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {modaleAperto && (
        <div className="overlay" onClick={() => setModaleAperto(null)}>
          <form className="modale" onClick={(e) => e.stopPropagation()} onSubmit={handleNuovoTurno}>
            <h3>Nuovo turno — {modaleAperto.data}</h3>
            <label>
              Inizio
              <input type="time" name="oraInizio" required defaultValue="09:00" />
            </label>
            <label>
              Fine
              <input type="time" name="oraFine" required defaultValue="13:00" />
            </label>
            <label>
              Skill richiesta (opzionale, separate da virgola)
              <input type="text" name="skill" placeholder="es. cassa, colore" />
            </label>
            <label>
              Note
              <input type="text" name="note" />
            </label>
            {erroreModale && <p className="errore">{erroreModale}</p>}
            <div className="modale-azioni">
              <button type="button" onClick={() => setModaleAperto(null)}>
                Annulla
              </button>
              <button type="submit">Salva turno</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
