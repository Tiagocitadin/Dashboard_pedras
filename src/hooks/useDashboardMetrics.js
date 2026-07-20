import { useMemo } from 'react';

// Função auxiliar para converter tempo em horas decimais para somar com precisão
const converterTempoParaHoras = (tempoStr) => {
    if (!tempoStr) return 0;
    if (typeof tempoStr === 'number') return tempoStr; 

    const partes = String(tempoStr).split(':');
    if (partes.length >= 2) {
        const horas = parseFloat(partes[0]) || 0;
        const minutos = parseFloat(partes[1]) || 0;
        const segundos = parseFloat(partes[2]) || 0;
        return horas + (minutos / 60) + (segundos / 3600);
    }

    return parseFloat(tempoStr) || 0;
};

// Função para transformar o total de horas decimais no formato "HH:MM" (sem segundos)
const formatarHorasParaHHMM = (totalHoras) => {
    if (!totalHoras || isNaN(totalHoras)) return "00:00";
    
    const minutosTotais = Math.round(totalHoras * 60);
    const h = Math.floor(minutosTotais / 60);
    const m = minutosTotais % 60;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const useDashboardMetrics = (dados) => {
    return useMemo(() => {
        const safeDados = Array.isArray(dados) ? dados : [];
        
        if (safeDados.length === 0) {
            return {
                totalConforme: 0,
                totalDanificadas: 0,
                qualidade: '0.0',
                horasTrabalhadas: "00:00",
                horasParadas: "00:00",
                horasTotais: "00:00",
                motivos: []
            };
        }

        const totalConforme = safeDados.reduce((acc, cur) => acc + (cur.conforme || 0), 0);
        const totalDanificadas = safeDados.reduce((acc, cur) => acc + (cur.danificada || 0), 0);
        const totalProduzido = totalConforme + totalDanificadas;

        const qualidade = totalProduzido > 0 ? (totalConforme / totalProduzido) * 100 : 0;

        // Cálculo de Horas Trabalhadas
        const horasTrabalhadasDec = safeDados
            .filter(cur => cur.status && cur.status.trim().toLowerCase() === 'Produzindo' || 'produzindo')
            .reduce((acc, cur) => acc + converterTempoParaHoras(cur.tempo), 0);

        // Cálculo de Horas Paradas (Indisponível)
        const horasParadasDec = safeDados
            .filter(cur => cur.status && cur.status.trim().toLowerCase() === 'Indisponível' || 'indisponível')
            .reduce((acc, cur) => acc + converterTempoParaHoras(cur.tempo), 0);

        // Cálculo de Horas Totais
        const horasTotaisDec = horasTrabalhadasDec + horasParadasDec;

        // Agrupamento de Motivos de Parada
        const motivosMap = safeDados.reduce((acc, cur) => {
            const statusAtual = cur.status ? cur.status.trim().toLowerCase() : '';
            if (statusAtual === 'indisponível' && cur.motivo) {
                const motivo = cur.motivo;
                acc[motivo] = (acc[motivo] || 0) + converterTempoParaHoras(cur.duracao);
            }
            return acc;
        }, {});

        return {
            totalConforme,
            totalDanificadas,
            qualidade: qualidade.toFixed(1),
            horasTrabalhadas: formatarHorasParaHHMM(horasTrabalhadasDec),
            horasParadas: formatarHorasParaHHMM(horasParadasDec),
            horasTotais: formatarHorasParaHHMM(horasTotaisDec),
            // Mantém 'value' como número decimal para a barra do gráfico funcionar,
            // e formata para 'HH:MM' em formattedValue.
            motivos: Object.entries(motivosMap).map(([name, value]) => ({ 
                name, 
                value: value, 
                formattedValue: formatarHorasParaHHMM(value)
            }))
            .sort((a, b) => b.value - a.value)
        };
    }, [dados]);
};