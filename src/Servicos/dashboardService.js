import { useMemo } from 'react';

export const useDashboardMetrics = (dados) => {
  return useMemo(() => {
    if (!dados || dados.length === 0) return null;

    const totalConforme = dados.reduce((acc, cur) => acc + (cur.conforme || 0), 0);
    const totalDanificadas = dados.reduce((acc, cur) => acc + (cur.danificada || 0), 0);
    const totalProduzido = totalConforme + totalDanificadas;

    // Cálculo de Qualidade
    const qualidade = totalProduzido > 0 ? (totalConforme / totalProduzido) * 100 : 0;

    // Agrupamento de Motivos de Parada
    const motivos = dados.reduce((acc, cur) => {
      const motivo = cur.motivo || 'Sem motivo';
      acc[motivo] = (acc[motivo] || 0) + (parseFloat(cur.duracao) || 0);
      return acc;
    }, {});

    return {
      totalConforme,
      totalDanificadas,
      qualidade: qualidade.toFixed(1),
      motivos: Object.entries(motivos).map(([name, value]) => ({ name, value }))
    };
  }, [dados]);
};