import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Login } from './pages/Login';

// Super Admin Layout & Pages
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { SuperAdminDashboard } from './pages/superadmin/Dashboard';
import { Salles } from './pages/superadmin/Salles';
import { Admins } from './pages/superadmin/Admins';
import { Licences } from './pages/superadmin/Licences';
import { Stats } from './pages/superadmin/Stats';
import { Logs } from './pages/superadmin/Logs';
import { SuperAdminSettings } from './pages/superadmin/Settings';

// Admin Layout & Pages
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminPostes } from './pages/admin/Postes';
import { AdminEmployes } from './pages/admin/Employes';
import { AdminClients } from './pages/admin/Clients';
import { AdminTarifs } from './pages/admin/Tarifs';
import { AdminRevenus } from './pages/admin/Revenus';
import { AdminSettings } from './pages/admin/Settings';

// Caissier Layout & Pages
import { CaissierLayout } from './layouts/CaissierLayout';
import { CaissierDashboard } from './pages/caissier/Dashboard';
import { CaissierClients } from './pages/caissier/Clients';
import { CaissierEncaissements } from './pages/caissier/Encaissements';

// Portail Joueur
import { JoueurPortal } from './pages/joueur/JoueurPortal';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/joueur" element={<JoueurPortal />} />
          <Route path="/superadmin/login" element={<Navigate to="/login" replace />} />

          {/* Super Admin Private Routes */}
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="salles" element={<Salles />} />
            <Route path="admins" element={<Admins />} />
            <Route path="licences" element={<Licences />} />
            <Route path="stats" element={<Stats />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* Admin Salle Private Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="postes" element={<AdminPostes />} />
            <Route path="employes" element={<AdminEmployes />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="tarifs" element={<AdminTarifs />} />
            <Route path="revenus" element={<AdminRevenus />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Caissier / Employe Private Routes */}
          <Route path="/caissier" element={<CaissierLayout />}>
            <Route index element={<CaissierDashboard />} />
            <Route path="clients" element={<CaissierClients />} />
            <Route path="encaissements" element={<CaissierEncaissements />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
