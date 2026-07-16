import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './servicos/clienteSupabase';

import Home from './componentes/Home';
import ImportadorCarga from './componentes/ImportadorCarga';
import Cadastro from './componentes/Cadastro';
import Login from './componentes/Login';
import HeaderActions from './componentes/HeaderActions';
import GerenciarUsuarios from './componentes/GerenciarUsuarios';
import Dashboard from './componentes/Dashboard';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) buscarPerfil(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) buscarPerfil(session.user.id);
      else setPerfil(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const buscarPerfil = async (userId) => {
    const { data } = await supabase.from('perfis').select('regra').eq('id', userId).single();
    if (data) setPerfil(data);
  };

  const isAdmin = perfil?.regra === 'admin';

  return (
    <Router>
      <div className="app-layout">
        <nav className="main-navbar">
          {/* HeaderActions agora não precisa de onNavigate */}
          <div className="navbar-auth-section">
            <HeaderActions user={user} isAdmin={isAdmin} />
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home user={user} isAdmin={isAdmin} />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/importar" element={user && isAdmin ? <ImportadorCarga /> : <Navigate to="/" />} />
            <Route path="/usuarios" element={user && isAdmin ? <GerenciarUsuarios /> : <Navigate to="/" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;