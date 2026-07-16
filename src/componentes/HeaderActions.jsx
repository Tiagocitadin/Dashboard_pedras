import React from 'react';
import { supabase } from '../servicos/clienteSupabase';

function HeaderActions({ user, isAdmin, onNavigate }) {
  if (user) {
    return (
      <div className="user-logged-info">
        <span className="user-email">{user.email}</span>
        {isAdmin && <span className="admin-badge">Admin</span>}
        <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="guest-section">
      
      <button className="btn-login" onClick={() => onNavigate('login')}>
        Entrar
      </button>
    </div>
  );
}

export default HeaderActions;