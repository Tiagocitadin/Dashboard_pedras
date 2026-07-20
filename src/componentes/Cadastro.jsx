import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../servicos/clienteSupabase'; 
import './Cadastro.css';

function Cadastro() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Otimizado com useCallback para evitar recriação desnecessária da função a cada render
    const handleRegister = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        // Validação básica de senha no client-side
        if (password !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        // Registro no Supabase Auth
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            // Traduz a mensagem do Supabase para o português se o e-mail já estiver cadastrado
            if (error.message.includes('User already registered')) {
                setErrorMsg('Este usuário (e-mail) já está cadastrado.');
            } else {
                setErrorMsg(error.message);
            }
        } else {
            setSuccessMsg('Cadastro realizado com sucesso! Você já pode fazer login.');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    }, [email, password, confirmPassword]);

    const irParaLogin = useCallback(() => {
        navigate('/');
    }, [navigate]);

    return (
        <div className="register-screen">
            <div className="register-card">
                <div className="register-header">
                    <div className="register-logo">📝</div>
                    <h2>Criar Nova Conta</h2>
                    <p>Cadastre-se para acessar o painel de consulta e produção</p>
                </div>

                {errorMsg && <div className="register-alert error">{errorMsg}</div>}
                {successMsg && <div className="register-alert success">{successMsg}</div>}

                <form onSubmit={handleRegister} className="register-form">
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
                        <label>Senha</label>
                        <input 
                            type="password" 
                            placeholder="Mínimo 6 caracteres" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmar Senha</label>
                        <input 
                            type="password" 
                            placeholder="Digite a senha novamente" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn-register" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Já possui uma conta?</p>
                    <button className="btn-back-login" onClick={irParaLogin}>
                        Voltar para o Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Cadastro;