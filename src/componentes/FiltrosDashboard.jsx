import React, { useCallback } from 'react';
import './FiltrosDashboard.css';

export default function FiltrosDashboard({ 
    filtros, 
    setFiltros, 
    rawDados = [],
    // Props de controle (true por padrão)
    exibirPeriodo = true,
    exibirInjetora = true,
    exibirProduto = true,
    exibirMp = true, 
    exibirTipo = true,
    // Listas dinâmicas opcionais
    tiposDisponiveis = [],
    produtosDisponiveis = [],
    mpsDisponiveis = []
}) {

    const toggleTipo = useCallback((tipo) => {
        setFiltros(prev => {
            const atual = prev.tipo || [];
            const novosTipos = atual.includes(tipo)
                ? atual.filter(t => t !== tipo)
                : [...atual, tipo];
            return { ...prev, tipo: novosTipos };
        });
    }, [setFiltros]);

    const limparDatas = useCallback(() => {
        setFiltros(prev => ({ ...prev, dataInicio: '', dataFim: '' }));
    }, [setFiltros]);

    return (
        <div className="filter-section">
            {/* 1. PERÍODO */}
            {exibirPeriodo && (
                <>
                    <div className="filter-header-row">
                        <label>PERÍODO</label>
                        <button type="button" className="clear-date-btn" onClick={limparDatas}>✕ LIMPAR</button>
                    </div>
                    <div className="date-inputs-container">
                        <input 
                            type="date" 
                            value={filtros.dataInicio || ''} 
                            onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))} 
                        />
                        <input 
                            type="date" 
                            value={filtros.dataFim || ''} 
                            onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))} 
                        />
                    </div>
                </>
            )}

            {/* 2. INJETORA */}
            {exibirInjetora && (
                <>
                    <label>INJETORA</label>
                    <select 
                        value={filtros.injetora || 'Todos'} 
                        onChange={(e) => setFiltros(prev => ({ ...prev, injetora: e.target.value, cod_prod: 'Todos' }))}
                    >
                        <option value="Todos">Todas</option>
                        {[...new Set(rawDados.map(d => d.injetora))].filter(Boolean).map(inj => (
                            <option key={inj} value={inj}>{inj}</option>
                        ))}
                    </select>
                </>
            )}

            {/* 3. CÓDIGO DO PRODUTO */}
            {exibirProduto && (
                <>
                    <label>CÓD. PROD</label>
                    <select 
                        value={filtros.cod_prod || 'Todos'} 
                        disabled={exibirInjetora && filtros.injetora === 'Todos'} 
                        onChange={(e) => setFiltros(prev => ({ ...prev, cod_prod: e.target.value }))}
                    >
                        <option value="Todos">Todos</option>
                        {produtosDisponiveis.map(prod => (
                            <option key={prod} value={prod}>{prod}</option>
                        ))}
                    </select>
                </>
            )}

            {/* 4. MATÉRIA-PRIMA (Opcional para outras telas) */}
            {exibirMp && (
                <>
                    <label>MATÉRIA-PRIMA</label>
                    <select 
                        value={filtros.mp || 'Todos'} 
                        onChange={(e) => setFiltros(prev => ({ ...prev, mp: e.target.value }))}
                    >
                        <option value="Todos">Todas</option>
                        {mpsDisponiveis.map(mp => (
                            <option key={mp} value={mp}>{mp}</option>
                        ))}
                    </select>
                </>
            )}

            {/* 5. TIPO */}
            {exibirTipo && tiposDisponiveis.length > 0 && (
                <>
                    <label>TIPO</label>
                    <div className="checkbox-group">
                        {tiposDisponiveis.map(tipo => (
                            <label key={tipo} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={(filtros.tipo || []).includes(tipo)}
                                    onChange={() => toggleTipo(tipo)}
                                />
                                <span>{tipo}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}