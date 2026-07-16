import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../servicos/clienteSupabase';
import './HeaderActions.css'; // Certifique-se de importar o CSS

function HeaderActions({ user, isAdmin }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (user) {
    return (
      <div className="user-logged-info-right">
        <span className="user-name">
          {user.email.split('@')[0]}
        </span>
        {isAdmin && <span className="admin-badge">Admin</span>}
        <button className="btn-logout" onClick={handleLogout}>
          Sair
        </button>
      </div>
    );
  }

 
}

export default HeaderActions;