import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../servicos/clienteSupabase';
import './HeaderActions.css';

function HeaderActions({ user, isAdmin }) {
  const navigate = useNavigate();

  // Otimizado com useCallback para evitar recriação da função a cada render
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/');
  }, [navigate]);

  // Otimiza o recorte do nome do usuário usando useMemo
  const userName = useMemo(() => {
    if (!user || !user.email) return '';
    return user.email.split('@')[0];
  }, [user]);

  // Se não houver usuário logado, retorna null imediatamente
  if (!user) {
    return null;
  }

  return (
    <div className="user-logged-info-right">
      <span className="user-name">
        {userName}
      </span>
      {isAdmin && <span className="admin-badge">Admin</span>}
      <button className="btn-logout" onClick={handleLogout}>
        Sair
      </button>
    </div>
  );
}

export default HeaderActions;