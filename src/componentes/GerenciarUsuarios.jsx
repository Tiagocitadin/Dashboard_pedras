import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importação do React Router
import { supabase } from '../servicos/clienteSupabase';
import './GerenciarUsuarios.css';

function GerenciarUsuarios() {
  const navigate = useNavigate(); // Hook para navegação
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Busca todos os perfis cadastrados no banco
  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('email', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: `Erro ao buscar usuários: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Altera a regra do usuário no banco de dados
  const alterarRegra = async (usuarioId, novaRegra) => {
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ regra: novaRegra })
        .eq('id', usuarioId);

      if (error) throw error;

      // Atualiza o estado local para refletir a mudança na tela imediatamente
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioId ? { ...u, regra: novaRegra } : u))
      );
      setMensagem({ tipo: 'sucesso', texto: 'Nível de acesso atualizado com sucesso!' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: `Erro ao atualizar nível: ${error.message}` });
    }
  };

  return (
    <div className="gerenciar-usuarios-container">
      {/* Botão de retorno adicionado para navegação via Router */}
      <button className="btn-voltar-home" onClick={() => navigate('/')}>
        ← Voltar para Home
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
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>
                    Nenhum usuário cadastrado encontrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GerenciarUsuarios;