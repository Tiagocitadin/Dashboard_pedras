import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../Servicos/clienteSupabase';
import './GerenciarUsuarios.css';

function GerenciarUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Busca inicial otimizada
  const carregarUsuarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, email, regra')
        .order('email', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: `Erro ao buscar usuários: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // Atualização Otimista: A interface muda na hora, a requisição corre em background
  const alterarRegra = useCallback(async (usuarioId, novaRegra) => {
    // 1. Atualiza visualmente na hora (feedback instantâneo)
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuarioId ? { ...u, regra: novaRegra } : u))
    );
    setMensagem({ tipo: 'sucesso', texto: 'Nível de acesso atualizado com sucesso!' });

    try {
      // 2. Envia para o Supabase em background
      const { error } = await supabase
        .from('perfis')
        .update({ regra: novaRegra })
        .eq('id', usuarioId);

      if (error) {
        // Se der erro no banco, reverte a alteração visual
        carregarUsuarios();
        throw error;
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: `Erro ao atualizar nível: ${error.message}` });
    }
  }, [carregarUsuarios]);

  // Renderização otimizada das linhas da tabela
  const linhasTabela = useMemo(() => {
    if (usuarios.length === 0) {
      return (
        <tr>
          <td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>
            Nenhum usuário cadastrado encontrado.
          </td>
        </tr>
      );
    }

    return usuarios.map((user) => (
      <tr key={user.id}>
        <td className="user-email-col">{user.email}</td>
        <td>
          <span className={`badge-role ${user.regra}`}>
            {user.regra === 'admin' ? 'Administrador' : 'Operador'}
          </span>
        </td>
        <td style={{ textAlign: 'center' }}>
          {user.regra === 'admin' ? (
            <button
              className="btn-change-role op"
              onClick={() => alterarRegra(user.id, 'operador')}
            >
              Rebaixar para Operador
            </button>
          ) : (
            <button
              className="btn-change-role adm"
              onClick={() => alterarRegra(user.id, 'admin')}
            >
              Promover a Admin
            </button>
          )}
        </td>
      </tr>
    ));
  }, [usuarios, alterarRegra]);

  return (
    <div className="gerenciar-usuarios-container">    
      <button className="btn-voltar-home" onClick={() => navigate('/')}>
         <FiArrowLeft /> <span>Voltar ao Início</span>
      </button>

      <div className="admin-header-block">
        <h2>Gerenciamento de Usuários</h2>
        <p>Altere permissões e níveis de acesso dos colaboradores cadastrados.</p>
      </div>

      {mensagem.texto && (
        <div className={`alert-message ${mensagem.tipo}`}>
          {mensagem.texto}
          <button onClick={() => setMensagem({ tipo: '', texto: '' })} className="close-alert">×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Carregando usuários...</div>
      ) : (
        <div className="table-responsive">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Perfil Atual</th>
                <th style={{ textAlign: 'center' }}>Ações de Permissão</th>
              </tr>
            </thead>
            <tbody>
              {linhasTabela}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GerenciarUsuarios;