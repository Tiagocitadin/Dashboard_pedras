import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../servicos/clienteSupabase';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { CheckCircle2, XCircle, Gauge, Clock, PauseCircle, Calculator, Target } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [rawDados, setRawDados] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filtros, setFiltros] = useState({
        injetora: 'Todos',
        cod_prod: 'Todos',
        mp: 'Todos',
        tipo: [],
        dataInicio: '',
        dataFim: ''
    });

    useEffect(() => {
        const fetchDados = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('carga_maquina').select('*');
            if (error) {
                console.error("Erro ao carregar dados:", error);
            } else {
                setRawDados(data || []);
            }
            setLoading(false);
        };
        fetchDados();
    }, []);

    const tiposDisponiveis = useMemo(() => {
        const tipos = [...new Set(rawDados.map(d => d.tipo))];
        return tipos.filter(t => t && t.toString().trim() !== '');
    }, [rawDados]);

    const produtosDisponiveis = useMemo(() => {
        const filtrado = filtros.injetora === 'Todos'
            ? rawDados
            : rawDados.filter(d => d.injetora === filtros.injetora);
        return [...new Set(filtrado.map(d => d.cod_prod))];
    }, [rawDados, filtros.injetora]);

    const mpsDisponiveis = useMemo(() => {
        // Filtra considerando a injetora e o produto selecionado para ser mais preciso
        const filtrado = rawDados.filter(d =>
            (filtros.injetora === 'Todos' || d.injetora === filtros.injetora) &&
            (filtros.cod_prod === 'Todos' || d.cod_prod === filtros.cod_prod)
        );
        return [...new Set(filtrado.map(d => d.mp))].filter(Boolean);
    }, [rawDados, filtros.injetora, filtros.cod_prod]);

    const dadosFiltrados = useMemo(() => {
        return rawDados.filter(item => {
            const matchInjetora = filtros.injetora === 'Todos' || item.injetora === filtros.injetora;
            const matchCodProd = filtros.cod_prod === 'Todos' || item.cod_prod === filtros.cod_prod;
            const matchMp = filtros.mp === 'Todos' || item.mp === filtros.mp; // <--- Nova regra
            const matchTipo = filtros.tipo.length === 0 || filtros.tipo.includes(item.tipo);

            let matchData = true;
            if (filtros.dataInicio || filtros.dataFim) {
                const dataItem = new Date(item.inicio);
                if (filtros.dataInicio) {
                    const inicio = new Date(filtros.dataInicio);
                    inicio.setHours(0, 0, 0, 0);
                    if (dataItem < inicio) matchData = false;
                }
                if (filtros.dataFim) {
                    const fim = new Date(filtros.dataFim);
                    fim.setHours(23, 59, 59, 999);
                    if (dataItem > fim) matchData = false;
                }
            }
            return matchInjetora && matchCodProd && matchMp && matchTipo && matchData;
        });
    }, [rawDados, filtros]);

    const metrics = useDashboardMetrics(dadosFiltrados);

    const toggleTipo = (tipo) => {
        setFiltros(prev => {
            const novosTipos = prev.tipo.includes(tipo)
                ? prev.tipo.filter(t => t !== tipo)
                : [...prev.tipo, tipo];
            return { ...prev, tipo: novosTipos };
        });
    };

    if (loading) {
        return <div className="loading-spinner">Processando dados de produção...</div>;
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                {/* Botão Voltar */}
                <button className="back-home-btn" onClick={() => navigate('/')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>Voltar ao Início</span>
                </button>

                <h2 className="brand-title">Pedrasplast</h2>

                <div className="filter-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>PERÍODO</label>
                        <button type="button" className="clear-date-btn" onClick={() => setFiltros({ ...filtros, dataInicio: '', dataFim: '' })}>✕ LIMPAR</button>
                    </div>
                    <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} />
                    <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} />

                    <label>INJETORA</label>
                    <select value={filtros.injetora} onChange={(e) => setFiltros({ ...filtros, injetora: e.target.value, cod_prod: 'Todos' })}>
                        <option value="Todos">Todas</option>
                        {[...new Set(rawDados.map(d => d.injetora))].map(inj => <option key={inj} value={inj}>{inj}</option>)}
                    </select>

                    <label>CÓD. PROD</label>
                    <select value={filtros.cod_prod} disabled={filtros.injetora === 'Todos'} onChange={(e) => setFiltros({ ...filtros, cod_prod: e.target.value })}>
                        <option value="Todos">Todos</option>
                        {produtosDisponiveis.map(prod => <option key={prod} value={prod}>{prod}</option>)}
                    </select>

                    <label>MATÉRIA-PRIMA</label>
                    <select
                        value={filtros.mp}
                        onChange={(e) => setFiltros({ ...filtros, mp: e.target.value })}
                    >
                        <option value="Todos">Todas</option>
                        {mpsDisponiveis.map(mp => (
                            <option key={mp} value={mp}>{mp}</option>
                        ))}
                    </select>

                    <label>TIPO</label>
                    <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                        {tiposDisponiveis.map(tipo => (
                            <label key={tipo} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={filtros.tipo.includes(tipo)}
                                    onChange={() => toggleTipo(tipo)}
                                    style={{ marginRight: '8px' }}
                                />
                                {tipo}
                            </label>

                        ))}
                    </div>

                </div>
            </aside>

            <main className="main-content">
                <header className="dashboard-header"><h1>Dashboard de Produção</h1></header>
                <section className="kpi-grid">
                    <div className="kpi-card">
                        <CheckCircle2 size={24} className="text-green-600" />
                        <span>CONFORME</span>
                        <strong>{metrics?.totalConforme || 0}</strong>
                    </div>

                    <div className="kpi-card">
                        <XCircle size={20} className="text-red-600" />
                        <span>DANIFICADAS</span>
                        <strong>{metrics?.totalDanificadas || 0}</strong>
                    </div>

                    <div className="kpi-card">
                        <Target size={20} className="text-blue-600" />
                        <span>QUALIDADE</span>
                        <strong>{metrics?.qualidade || 0} %</strong>
                    </div>

                    <div className="kpi-card">
                        <Clock size={20} className="text-gray-600" />
                        <span>HORA TRABALHADA</span>
                        <strong>{metrics?.horasTrabalhadas || 0} h</strong>
                    </div>

                    <div className="kpi-card" style={{ borderColor: '#ef4444' }}>
                        <PauseCircle size={20} className="text-red-500" />
                        <span>HORA PARADA</span>
                        <strong>{metrics?.horasParadas || 0} h</strong>
                    </div>

                    <div className="kpi-card">
                        <Calculator size={20} className="text-gray-600" />
                        <span>TOTAL DE HORAS</span>
                        <strong>{metrics?.horasTotais || 0} h</strong>
                    </div>
                </section>

                <section className="chart-container">
                    <h3>MOTIVOS DE PARADA</h3>
                    <div className="motivos-list">
                        {(metrics?.motivos || []).map((item, i) => (
                            <div key={i} className="motivo-bar">
                                <div className="label-row">
                                    <span>{item.name}</span>
                                    <span>{Number(item.value).toFixed(1)}h</span>
                                </div>
                                <div className="progress-bg">
                                    <div className="progress-fill" style={{ width: `${Math.min((item.value / 10) * 100, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}