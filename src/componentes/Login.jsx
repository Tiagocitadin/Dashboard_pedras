import React, { useState } from 'react';
import { supabase } from '../servicos/clienteSupabase';

function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem(`Erro: ${error.message}`);
    } else {
      onNavigate('home'); // Redireciona para o início após logar
    }
    setCarregando(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Acessar o Sistema</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>E-mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={carregando}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {mensagem && <p style={{ marginTop: '15px', color: 'red', textAlign: 'center' }}>{mensagem}</p>}
      
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Não tem conta? <span onClick={() => onNavigate('cadastro')} style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Cadastre-se</span>
      </p>
    </div>
  );
}

export default Login;