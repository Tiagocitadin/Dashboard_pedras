import { useMemo } from 'react';

export const useDashboardMetrics = (dados) => {
    return useMemo(() => {
        // Garantir que dados seja sempre um array, mesmo se vier null/undefined
        const safeDados = Array.isArray(dados) ? dados : [];
        
        if (safeDados.length === 0) return null;

        const horasTotais = safeDados.reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        // Calcula Horas Paradas (Filtrando status diferente de 'Produzindo')
        const horasParadas = safeDados
            .filter(cur => cur.status !== 'Produzindo')
            .reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        // Calcula Horas Trabalhadas (Produzindo)
        const horasTrabalhadas = safeDados
            .filter(cur => cur.status === 'Produzindo')
            .reduce((acc, cur) => acc + (parseFloat(cur.duracao) || 0), 0);

        const totalConforme = safeDados.reduce((acc, cur) => acc + (cur.conforme || 0), 0);
        const totalDanificadas = safeDados.reduce((acc, cur) => acc + (cur.danificada || 0), 0);
        const totalProduzido = totalConforme + totalDanificadas;

        const qualidade = totalProduzido > 0 ? (totalConforme / totalProduzido) * 100 : 0;
        const disponibilidade = horasTotais > 0 ? (horasTrabalhadas / horasTotais) * 100 : 0;

        // Agrupamento de Motivos de Parada
        const motivosMap = safeDados.reduce((acc, cur) => {
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