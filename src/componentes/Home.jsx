import React, { useState } from 'react';
import { supabase } from '../servicos/clienteSupabase'; // Ajuste o caminho do seu cliente Supabase
import './Home.css';

function Home({ user, isAdmin, onNavigate }) {
  // Estados para o formulário de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Trata a submissão do login no Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(
        error.message === 'Invalid login credentials' 
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.' 
          : error.message
      );
    } else {
      setEmail('');
      setPassword('');
    }
    setLoadingLogin(false);
  };

  // Trata o Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="home-screen">
      {/* Banner de Boas-Vindas */}
      <div className="welcome-banner">
        <h1>Seja bem-vindo ao Painel de Produção</h1>
        <p>Monitore o planejamento de carga máquina, eficiência de injetoras e acompanhe indicadores em tempo real.</p>
      </div>

      <div className="home-grid">
        {/* Painel Esquerdo: Guia de Navegação Dinâmica */}
        <div className="info-card">
          <h3>O que você deseja fazer?</h3>
          <div className="action-guide">
            {/* Sempre visível para todos */}
            <div className="guide-item" onClick={() => onNavigate('dashboard')}>
              <span className="guide-icon">📈</span>
              <div>
                <h4>Visualizar Dashboard</h4>
                <p>Gráficos de eficiência, peças fabricadas, tempos de atividade e análise de paradas.</p>
              </div>
            </div>
            
            {/* SÓ APARECE se o usuário estiver logado E for administrador */}
            {user && isAdmin && (
              <div className="guide-item" onClick={() => onNavigate('importar')}>
                <span className="guide-icon">📥</span>
                <div>
                  <h4>Importar Carga Máquina</h4>
                  <p>Envio em massa de planilhas de programação de injetoras.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Status de Login / Formulário */}
        <div className="auth-card">
          {user ? (
            <div className="profile-logged-card">
              <div className="avatar">👤</div>
              <h3>Sessão Ativa</h3>
              <p className="email-text">{user.email}</p>
              
              <div className="role-box">
                Nível de Acesso: <strong>{isAdmin ? 'Administrador (Completo)' : 'Operador (Apenas Leitura)'}</strong>
              </div>

              {isAdmin ? (
                <button className="btn-action-primary" onClick={() => onNavigate('importar')}>
                  Ir para Importador
                </button>
              ) : (
                <button className="btn-action-primary" onClick={() => onNavigate('dashboard')}>
                  Ir para Dashboard
                </button>
              )}
              
              <button className="btn-logout-secundario" onClick={handleLogout}>
                Sair da Conta
              </button>
            </div>
          ) : (
            <div className="login-form-wrapper">
              <h3>Área do Administrador</h3>
              <p className="login-subtitle">Faça login para liberar o importador de arquivos</p>
              
              {loginError && <div className="login-error-alert">{loginError}</div>}
              
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label>E-mail Corporativo</label>
                  <input 
                    type="email" 
                    placeholder="exemplo@empresa.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Senha de Acesso</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-submit" disabled={loadingLogin}>
                  {loadingLogin ? 'Autenticando...' : 'Entrar como Admin'}
                </button>
              </form>

              {/* Botão de redirecionamento para o Cadastro */}
              <div className="login-footer-actions">
                <span className="separator-text">ou</span>
                <button 
                  type="button" 
                  className="btn-link-cadastro" 
                  onClick={() => onNavigate('cadastro')}
                >
                  Criar nova conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;