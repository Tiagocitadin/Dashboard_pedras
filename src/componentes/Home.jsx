import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../servicos/clienteSupabase';
import './Home.css';

function Home({ user, isAdmin }) {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="home-screen">
      <div className="welcome-banner">
        <h1>Seja bem-vindo ao Painel de Produção</h1>
        <p>Visão integrada da produtividade por máquina, identificação de paradas e monitoramento de eficiência operacional..</p>
      </div>

      <div className="home-grid">
        <div className="info-card">
          <h3>O que você deseja fazer?</h3>
          <div className="action-guide">
            <div className="guide-item" onClick={() => navigate('/dashboard')}>
              <span className="guide-icon">📈</span>
              <div>
                <h4>Visualizar Dashboard</h4>
                <p>Gráficos de eficiência, peças fabricadas, tempos de atividade e análise de paradas.</p>
              </div>
            </div>
            
            {user && isAdmin && (
              <div className="guide-item" onClick={() => navigate('/importar')}>
                <span className="guide-icon">📥</span>
                <div>
                  <h4>Importar Carga Máquina</h4>
                  <p>Envio em massa de planilhas de programação de injetoras.</p>
                </div>
              </div>
            )}
          </div>
        </div>

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
                <button className="btn-action-primary" onClick={() => navigate('/importar')}>
                  Ir para Importador
                </button>
              ) : (
                <button className="btn-action-primary" onClick={() => navigate('/dashboard')}>
                  Ir para Dashboard
                </button>
              )}
              
              <button className="btn-logout-secundario" onClick={handleLogout}>
                Sair da Conta
              </button>
            </div>
          ) : (
            <div className="login-form-wrapper">
              <h3>Acesso ao Sistema</h3>
              <p className="login-subtitle">Faça login para continuar</p>
              
              {loginError && <div className="login-error-alert">{loginError}</div>}
              
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label>E-mail</label>
                  <input 
                    type="email" 
                    placeholder="nome@empresa.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Senha</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-submit" disabled={loadingLogin}>
                  {loadingLogin ? 'Autenticando...' : 'Entrar'}
                </button>
              </form>

              <div className="login-footer-actions">
                <span className="separator-text">ou</span>
                <button 
                  type="button" 
                  className="btn-link-cadastro" 
                  onClick={() => navigate('/cadastro')}
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