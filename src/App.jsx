import { AuthProvider, useAuth } from "./lib/AuthContext";
import Login from "./pages/Login";
import DashboardTitolare from "./pages/DashboardTitolare";
import DashboardDipendente from "./pages/DashboardDipendente";
import "./App.css";

function Contenuto() {
  const { user, profilo, caricamento, isTitolare } = useAuth();

  if (caricamento) return <div className="caricamento">Caricamento…</div>;
  if (!user) return <Login />;
  if (!profilo) {
    return (
      <div className="caricamento">
        Account non ancora configurato. Contatta il titolare per l'associazione al profilo dipendente.
      </div>
    );
  }
  return isTitolare ? <DashboardTitolare /> : <DashboardDipendente />;
}

export default function App() {
  return (
    <AuthProvider>
      <Contenuto />
    </AuthProvider>
  );
}
