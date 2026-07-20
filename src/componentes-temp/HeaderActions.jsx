import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../servicos/clienteSupabase';
import './HeaderActions.css';

function HeaderActions({ user, isAdmin }) {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/');
  }, [navigate]);

  const userName = useMemo(() => {
    if (!user || !user.email) return '';
    return user.email.split('@')[0];
  }, [user]);

  const handleHome = useCallback(() => navigate('/'), [navigate]);
  const handleLogin = useCallback(() => navigate('/login'), [navigate]);

  return (
    <header className="main-navbar">
      {/* Lado Esquerdo: Marca (Logo e Nome) */}
      <div className="navbar-brand">
        <img src="/Logo_Pedrasplast.png" alt="Logo" className="brand-logo-img" />
      </div>

      {/* Lado Direito: Seção de Autenticação */}
      <div className="navbar-auth-section">
        {user ? (
          <div className="user-logged-info">
            <span className="user-email">{userName}</span>
            {isAdmin ? (
              <span className="admin-badge">Admin</span>
            ) : (
              <span className="guest-badge">Operador</span>
            )}
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>
        ) : (
          <button className="nav-link active" onClick={handleLogin}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}

export default HeaderActions;