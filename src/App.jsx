// Contenido para: src/App.js

import React, { useState } from 'react';
import { useAuthContext } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservas from './pages/Reservas';
import Clientes from './pages/Clientes';
import Mesas from './pages/Mesas';
import Analytics from './pages/Analytics';
import Configuracion from './pages/Configuracion';
import Calendario from './pages/Calendario';

function App() {
  const { isReady, isAuthenticated } = useAuthContext();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Muestra un spinner de carga mientras se verifica la sesión del usuario
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Iniciando Son-IA...</h2>
        </div>
      </div>
    );
  }

  // Si no está autenticado, muestra la página de Login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Si está autenticado, muestra la aplicación principal
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'reservas': return <Reservas />;
      case 'clientes': return <Clientes />;
      case 'mesas': return <Mesas />;
      case 'calendario': return <Calendario />;
      case 'analytics': return <Analytics />;
      case 'configuracion': return <Configuracion />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;