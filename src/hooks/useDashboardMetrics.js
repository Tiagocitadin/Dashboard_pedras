import { useMemo } from 'react';

// Converte HH:MM:SS ou número decimal (fração de dia do banco) para horas decimais reais
const converterTempoParaHoras = (tempoStr) => {
    if (tempoStr === null || tempoStr === undefined || tempoStr === "") return 0;

    // Se for número, o banco está salvando como fração de dia (ex: 0.041667 = 1 dia / 24).
    // Multiplicamos por 24 para transformar em horas reais.
    if (typeof tempoStr === "number") {
        return tempoStr * 24;
    }

    const str = String(tempoStr);

    // Se contiver ":", assume o formato de texto HH:MM:SS
    if (str.includes(":")) {
        const partes = str.split(":").map(Number);
        const horas = partes[0] || 0;
        const minutos = partes[1] || 0;
        const segundos = partes[2] || 0;
        return horas + (minutos / 60) + (segundos / 3600);
    }

    // Se for uma string numérica, converte para float e também aplica a conversão de fração de dia
    const num = parseFloat(str);
    if (!isNaN(num)) {
        return num * 24;
    }

    return 0;
};


// Formata horas decimais para HH:MM (suportando mais de 24h)
const formatarHorasParaHHMM = (totalHoras) => {
    if (!totalHoras || isNaN(totalHoras)) {
        return "00:00";
    }

    const minutosTotais = Math.round(totalHoras * 60);

    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
};


// Normaliza status
const normalizarStatus = (status) => {
    return String(status || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};


export const useDashboardMetrics = (dados) => {

    return useMemo(() => {

        const safeDados = Array.isArray(dados) ? dados : [];

        if (safeDados.length === 0) {
            return {
                totalConforme: 0,
                totalDanificadas: 0,
                qualidade: "0.0",
                horasTrabalhadas: "00:00",
                horasParadas: "00:00",
                horasTotais: "00:00",
                motivos: []
            };
        }

        const totalConforme = safeDados.reduce(
            (acc, cur) => acc + Number(cur.conforme || 0),
            0
        );

        const totalDanificadas = safeDados.reduce(
            (acc, cur) => acc + Number(cur.danificada || 0),
            0
        );

        const totalProduzido = totalConforme + totalDanificadas;

        const qualidade = totalProduzido > 0
            ? (totalConforme / totalProduzido) * 100
            : 0;

        // ==========================
        // HORAS PRODUZINDO
        // campo usado: tempo
        // ==========================
        const horasTrabalhadasDec = safeDados
            .filter(cur =>
                normalizarStatus(cur.status) === "produzindo"
            )
            .reduce(
                (acc, cur) =>
                    acc + converterTempoParaHoras(cur.tempo),
                0
            );

        // ==========================
        // HORAS INDISPONÍVEL
        // campo usado: tempo
        // ==========================
        const horasParadasDec = safeDados
            .filter(cur =>
                normalizarStatus(cur.status) === "indisponivel"
            )
            .reduce(
                (acc, cur) =>
                    acc + converterTempoParaHoras(cur.tempo),
                0
            );

        const horasTotaisDec =
            horasTrabalhadasDec + horasParadasDec;

        // ==========================
        // MOTIVOS DAS PARADAS
        // ==========================
        const motivosMap = safeDados.reduce((acc, cur) => {

            const status = normalizarStatus(cur.status);

            if (
                status === "indisponivel" &&
                cur.motivo
            ) {
                acc[cur.motivo] =
                    (acc[cur.motivo] || 0) +
                    converterTempoParaHoras(cur.duracao);
            }

            return acc;

        }, {});

        return {
            totalConforme,
            totalDanificadas,
            qualidade: qualidade.toFixed(1),

            // KPIs
            horasTrabalhadas:
                formatarHorasParaHHMM(horasTrabalhadasDec),

            horasParadas:
                formatarHorasParaHHMM(horasParadasDec),

            horasTotais:
                formatarHorasParaHHMM(horasTotaisDec),

            motivos:
                Object.entries(motivosMap)
                    .map(([name, value]) => ({
                        name,
                        value,
                        formattedValue:
                            formatarHorasParaHHMM(value)
                    }))
                    .sort((a, b) => b.value - a.value)
        };

    }, [dados]);
};