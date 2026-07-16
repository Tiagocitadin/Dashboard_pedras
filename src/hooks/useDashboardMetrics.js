import { useMemo } from 'react';

export const useDashboardMetrics = (dados) => {
    return useMemo(() => {
        if (!dados || dados.length === 0) return null;

        const horasTotais = dados.reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        // Calcula Horas Paradas (Filtrando status diferente de 'Produzindo')
        const horasParadas = dados
            .filter(cur => cur.status !== 'Produzindo')
            .reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        // Calcula Horas Trabalhadas (Produzindo)
        const horasTrabalhadas = dados
            .filter(cur => cur.status === 'Produzindo')
            .reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        // Usando as chaves exatas do seu objeto dadosFormatados
        const totalConforme = dados.reduce((acc, cur) => acc + (cur.conforme || 0), 0);
        const totalDanificadas = dados.reduce((acc, cur) => acc + (cur.danificada || 0), 0);
        const totalProduzido = totalConforme + totalDanificadas;

        // Cálculo de Qualidade
        const qualidade = totalProduzido > 0 ? (totalConforme / totalProduzido) * 100 : 0;

        // Cálculo de Disponibilidade
        // Usamos 'duracao' (string no banco, convertemos para float)
        const tempoTotal = dados.reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);
        const tempoProduzindo = dados
            .filter(cur => cur.status === 'Produzindo')
            .reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        const disponibilidade = tempoTotal > 0 ? (tempoProduzindo / tempoTotal) * 100 : 0;

        // Agrupamento de Motivos de Parada
        const motivosMap = dados.reduce((acc, cur) => {
            if (cur.status !== 'Produzindo' && cur.motivo) {
                const motivo = cur.motivo;
                acc[motivo] = (acc[motivo] || 0) + (parseFloat(cur.duracao) || 0);
            }
            return acc;
        }, {});

        return {
            horasTotais: horasTotais.toFixed(2),
            horasTrabalhadas: horasTrabalhadas.toFixed(2),
            horasParadas: horasParadas.toFixed(2),
            totalConforme,
            totalDanificadas,
            qualidade: qualidade.toFixed(1),
            disponibilidade: disponibilidade.toFixed(1),
            motivos: Object.entries(motivosMap).map(([name, value]) => ({ name, value }))
        };
    }, [dados]);
};