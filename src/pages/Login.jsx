import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrore("Email o password non corretti.");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Turni</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errore && <p className="errore">{errore}</p>}
        <button type="submit" disabled={inCorso}>
          {inCorso ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}
