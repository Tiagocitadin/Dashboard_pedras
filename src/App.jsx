import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './Servicos/clienteSupabase';

import Home from './componentes/Home';
import ImportadorCarga from './componentes/ImportadorCarga';
import Cadastro from './componentes/Cadastro';
import Login from './componentes/Login';
import HeaderActions from './componentes/HeaderActions';
import GerenciarUsuarios from './componentes/GerenciarUsuarios';
import Dashboard from './componentes/Dashboard';
import TelaRelatorios from './relatorio/TelaRelatorios';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        buscarPerfil(session.user.id);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        buscarPerfil(session.user.id);
      } else {
        setPerfil(null);
      }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const buscarPerfil = async (userId) => {
    const { data } = await supabase.from('perfis').select('regra').eq('id', userId).single();
    if (data) setPerfil(data);
  };

  const isAdmin = perfil?.regra === 'admin';

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
        <p>Carregando sistema...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        <HeaderActions user={user} isAdmin={isAdmin} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home user={user} isAdmin={isAdmin} />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/relatorios" element={user ? <TelaRelatorios /> : <Navigate to="/login" />} />
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