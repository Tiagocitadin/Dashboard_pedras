import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
            let todosOsDados = [];
            let pagina = 0;
            const tamanhoPagina = 1000;
            let continuar = true;

            try {
                // Loop para buscar todos os registros em blocos de 1000 (limite do Supabase)
                while (continuar) {
                    const { data, error } = await supabase
                        .from('carga_maquina')
                        .select('*')
                        .range(pagina * tamanhoPagina, (pagina + 1) * tamanhoPagina - 1);

                    if (error) {
                        console.error("Erro ao carregar dados:", error);
                        break;
                    }

                    if (data && data.length > 0) {
                        todosOsDados = [...todosOsDados, ...data];
                        if (data.length < tamanhoPagina) {
                            continuar = false; // Se veio menos que 1000, chegou ao fim da tabela
                        } else {
                            pagina++;
                        }
                    } else {
                        continuar = false;
                    }
                }

                setRawDados(todosOsDados);
            } catch (err) {
                console.error("Erro inesperado ao buscar dados:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDados();
    }, []);

    // Otimizado: Memoriza a listagem de tipos disponíveis
    const tiposDisponiveis = useMemo(() => {
        return [...new Set(rawDados.map(d => d.tipo))].filter(t => t && t.toString().trim() !== '');
    }, [rawDados]);

    // Otimizado: Produtos disponíveis baseados na injetora
    const produtosDisponiveis = useMemo(() => {
        const filtrado = filtros.injetora === 'Todos'
            ? rawDados
            : rawDados.filter(d => d.injetora === filtros.injetora);
        return [...new Set(filtrado.map(d => d.cod_prod))];
    }, [rawDados, filtros.injetora]);

    // Otimizado: Matérias-primas disponíveis baseadas na injetora e produto
    const mpsDisponiveis = useMemo(() => {
        const filtrado = rawDados.filter(d =>
            (filtros.injetora === 'Todos' || d.injetora === filtros.injetora) &&
            (filtros.cod_prod === 'Todos' || d.cod_prod === filtros.cod_prod)
        );
        return [...new Set(filtrado.map(d => d.mp))].filter(Boolean);
    }, [rawDados, filtros.injetora, filtros.cod_prod]);

    // Otimizado: Pré-processamento de datas em formato timestamp para evitar instanciar new Date() a cada loop do filter
    const dadosFiltrados = useMemo(() => {
        const inicioTs = filtros.dataInicio ? new Date(filtros.dataInicio).setHours(0, 0, 0, 0) : null;
        const fimTs = filtros.dataFim ? new Date(filtros.dataFim).setHours(23, 59, 59, 999) : null;
        const tiposSet = new Set(filtros.tipo);

        return rawDados.filter(item => {
            if (filtros.injetora !== 'Todos' && item.injetora !== filtros.injetora) return false;
            if (filtros.cod_prod !== 'Todos' && item.cod_prod !== filtros.cod_prod) return false;
            if (filtros.mp !== 'Todos' && item.mp !== filtros.mp) return false;
            if (tiposSet.size > 0 && !tiposSet.has(item.tipo)) return false;

            if (inicioTs || fimTs) {
                const dataItemTs = new Date(item.inicio).getTime();
                if (inicioTs && dataItemTs < inicioTs) return false;
                if (fimTs && dataItemTs > fimTs) return false;
            }

            return true;
        });
    }, [rawDados, filtros]);

    const metrics = useDashboardMetrics(dadosFiltrados);

    // Otimizado com useCallback para evitar recriação desnecessária da função
    const toggleTipo = useCallback((tipo) => {
        setFiltros(prev => {
            const novosTipos = prev.tipo.includes(tipo)
                ? prev.tipo.filter(t => t !== tipo)
                : [...prev.tipo, tipo];
            return { ...prev, tipo: novosTipos };
        });
    }, []);

    const limparDatas = useCallback(() => {
        setFiltros(prev => ({ ...prev, dataInicio: '', dataFim: '' }));
    }, []);

    if (loading) {
        return <div className="loading-spinner">Processando dados de produção...</div>;
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
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
                        <button type="button" className="clear-date-btn" onClick={limparDatas}>✕ LIMPAR</button>
                    </div>
                    <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))} />
                    <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))} />

                    <label>INJETORA</label>
                    <select value={filtros.injetora} onChange={(e) => setFiltros(prev => ({ ...prev, injetora: e.target.value, cod_prod: 'Todos' }))}>
                        <option value="Todos">Todas</option>
                        {tiposDisponiveis.length > 0 && [...new Set(rawDados.map(d => d.injetora))].map(inj => <option key={inj} value={inj}>{inj}</option>)}
                    </select>

                    <label>CÓD. PROD</label>
                    <select value={filtros.cod_prod} disabled={filtros.injetora === 'Todos'} onChange={(e) => setFiltros(prev => ({ ...prev, cod_prod: e.target.value }))}>
                        <option value="Todos">Todos</option>
                        {produtosDisponiveis.map(prod => <option key={prod} value={prod}>{prod}</option>)}
                    </select>

                    <label>MATÉRIA-PRIMA</label>
                    <select value={filtros.mp} onChange={(e) => setFiltros(prev => ({ ...prev, mp: e.target.value }))}>
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
                        <strong>{Number(metrics?.totalConforme || 0).toLocaleString('pt-BR')}</strong>
                    </div>

                    <div className="kpi-card">
                        <XCircle size={20} className="text-red-600" />
                        <span>DANIFICADAS</span>
                        <strong>{Number(metrics?.totalDanificadas || 0).toLocaleString('pt-BR')}</strong>
                    </div>

                    <div className="kpi-card">
                        <Target size={20} className="text-blue-600" />
                        <span>QUALIDADE</span>
                        <strong>{Number(metrics?.qualidade || 0).toFixed(2)} %</strong>
                    </div>

                    <div className="kpi-card">
                        <Clock size={20} className="text-gray-600" />
                        <span>HORA TRABALHADA</span>
                        <strong>{metrics?.horasTrabalhadas || 0} hrs</strong>
                    </div>

                    <div className="kpi-card" style={{ borderColor: '#ef4444' }}>
                        <PauseCircle size={20} className="text-red-500" />
                        <span>HORA PARADA</span>
                        <strong>{metrics?.horasParadas || 0} hrs</strong>
                    </div>

                    <div className="kpi-card">
                        <Calculator size={20} className="text-gray-600" />
                        <span>TOTAL DE HORAS</span>
                        <strong>{metrics?.horasTotais || 0} hrs</strong>
                    </div>
                </section>

                <section className="chart-container">
                    <h3>MOTIVOS DE PARADA</h3>
                    <div className="motivos-list">
                        {(metrics?.motivos || []).map((item, i) => (
                            <div key={i} className="motivo-bar">
                                <div className="label-row">
                                    <span>{item.name}</span>
                                    {/* Exibe o tempo formatado em HH:MM:SS que veio do hook */}
                                    <span>{item.formattedValue}</span>
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