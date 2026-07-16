import React, { useState, useEffect } from 'react';
import { supabase } from './servicos/clienteSupabase'; 
import Home from './componentes/Home';
import ImportadorCarga from './componentes/ImportadorCarga'; 
import Cadastro from './componentes/Cadastro'; 
import Login from './componentes/Login'; // 1. IMPORTADO O COMPONENTE DE LOGIN
import HeaderActions from './componentes/HeaderActions'; 
import GerenciarUsuarios from './componentes/GerenciarUsuarios'; // IMPORTADO O GERENCIADOR DE USUÁRIOS
import Dashboard from './componentes/Dashboard'; // Ajuste o caminho se necessário

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) buscarPerfil(session.user.id);
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        buscarPerfil(session.user.id);
        setActiveTab('home'); // Redireciona para a home quando logar com sucesso
      } else {
        setPerfil(null);
        setActiveTab('home'); // Redireciona para home ao deslogar
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const buscarPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('perfis')
      .select('regra')
      .eq('id', userId)
      .single();

    if (!error && data) setPerfil(data);
  };

  const isAdmin = perfil?.regra === 'admin';

  return (
    <div className="app-layout">
      {/* Menu de Navegação */}
      <nav className="main-navbar">
        <div className="navbar-brand" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">📊</div>
          <span className="brand-name">Sistema Produção</span>
        </div>

        <div className="navbar-menu">
          <button
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Início
          </button>
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>

          {/* O BOTÃO NO MENU SÓ APARECE PARA O ADMIN LOGADO */}
          {user && isAdmin && (
            <button
              className={`nav-link ${activeTab === 'importar' ? 'active' : ''}`}
              onClick={() => setActiveTab('importar')}
            >
              Importar Carga
            </button>
          )}

          {/* NOVO: BOTÃO DE USUÁRIOS SÓ PARA ADMIN LOGADO */}
          {user && isAdmin && (
            <button
              className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              Gerenciar Usuários
            </button>
          )}
        </div>

        {/* COMPONENTE ISOLADO DE AUTENTICAÇÃO NO HEADER */}
        <div className="navbar-auth-section">
          <HeaderActions 
            user={user} 
            isAdmin={isAdmin} 
            onNavigate={setActiveTab} 
          />
        </div>
      </nav>

      {/* Renderização Condicional de Telas */}
      <main className="main-content">
        {activeTab === 'home' && (
          <Home user={user} isAdmin={isAdmin} onNavigate={setActiveTab} />
        )}

        {/* ROTA DO DASHBOARD CORRIGIDA E ÚNICA */}
        {activeTab === 'dashboard' && (
          user ? (
            <div className="dashboard-wrapper">
               <Dashboard /> 
            </div>
          ) : (
            <div className="acesso-negado">
              <p>Por favor, faça login para visualizar o Dashboard.</p>
              <button onClick={() => setActiveTab('login')}>Ir para o Login</button>
            </div>
          )
        )}

        {/* Rota Protegida no Front-end */}
        {activeTab === 'importar' && user && isAdmin && (
          <ImportadorCarga />
        )}

        {/* ROTA PROTEGIDA DO GERENCIADOR DE USUÁRIOS */}
        {activeTab === 'usuarios' && user && isAdmin && (
          <GerenciarUsuarios />
        )}

        {activeTab === 'login' && (
          <Login onNavigate={setActiveTab} />
        )}

        {activeTab === 'cadastro' && (
          <Cadastro onNavigate={setActiveTab} />
        )}
      </main>
    </div>
  );
}

export default App;