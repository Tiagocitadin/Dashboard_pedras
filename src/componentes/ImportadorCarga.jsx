import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../servicos/clienteSupabase';
import './ImportadorCarga.css';

import { parse, formatISO, isValid } from 'date-fns';

export default function ImportadorCarga() {
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState('');
  const [progressoMsg, setProgressoMsg] = useState('');
  const [porcentagem, setPorcentagem] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const formatarData = (valor) => {
    if (!valor) return null;

    // Se o Excel passar o valor como número (formato serial do Excel)
    if (typeof valor === 'number') {
      const dataJS = new Date((valor - 25569) * 86400 * 1000);
      return dataJS.toISOString();
    }

    // Se for string, tentamos converter do formato BR "dd/MM/yyyy HH:mm:ss"
    if (typeof valor === 'string') {
      // Tenta converter o formato "08/07/2026 00:00:06"
      const dataConvertida = parse(valor, 'dd/MM/yyyy HH:mm:ss', new Date());

      // Se a data for válida, retorna no padrão ISO
      if (isValid(dataConvertida)) {
        return formatISO(dataConvertida);
      }
    }

    return null;
  };

  const formatarDecimal = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0;
    if (typeof valor === 'string') {
      const limpo = valor.replace(',', '.');
      return parseFloat(limpo) || 0;
    }
    return parseFloat(valor) || 0;
  };

  const processarArquivo = async (file) => {
    if (!file) return;

    setCarregando(true);
    setStatus('Iniciando...');
    setProgressoMsg('Lendo planilha e verificando duplicatas no banco...');
    setPorcentagem(0);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) throw new Error("A planilha está vazia.");

        const dadosFormatados = rows.map((linha) => ({
          cod_prod: String(linha['Cód.Prod'] || ''),
          injetora: String(linha['Injetora'] || ''),
          inicio: formatarData(linha['Início']),
          fim: formatarData(linha['Fim']),
          duracao: String(linha['Duração'] || ''),
          op: String(linha['OP'] || ''),
          tipo: String(linha['Tipo'] || ''),
          motivo: String(linha['Motivo'] || ''),
          justificativa: String(linha['Justificativa'] || ''),
          celula: String(linha['Célula'] || ''),
          operador: String(linha['Operador'] || ''),
          material: String(linha['Material'] || ''),
          qtde_perdi: formatarDecimal(linha['Qtde perdida devido pausa']),
          cliente: String(linha['Cliente'] || ''),
          status: String(linha['Status'] || ''),
          lista_de_data: formatarData(linha['ListaDeData'])?.split('T')[0],
          inicio_dia: formatarData(linha['InícioDia']),
          fim_dia: formatarData(linha['FimDia']),
          tempo: String(linha['Tempo'] || ''),
          conforme: parseInt(linha['Conforme'] || 0, 10),
          danificada: parseInt(linha['Danificada'] || 0, 10),
          mp: String(linha['M.P'] || ''),
          pecas: parseInt(linha['Peças'] || 0, 10),
          no_injetora: String(linha['NºInjetora'] || ''),
          peso: formatarDecimal(linha['Peso']),
          consumido: formatarDecimal(linha['Consumido'])
        }));

        const { data: bancoDados, error: fetchError } = await supabase
          .from('carga_maquina')
          .select('injetora, inicio');

        if (fetchError) throw fetchError;

        const registrosExistentes = new Set(
          bancoDados.map(row => `${String(row.injetora).trim().toUpperCase()}|${String(row.inicio).trim()}`)
        );

        const dadosParaInserir = dadosFormatados.filter(linha => {
          const chave = `${String(linha.injetora).trim().toUpperCase()}|${String(linha.inicio).trim()}`;
          return !registrosExistentes.has(chave);
        });

        const totalLinhas = dadosFormatados.length;
        const totalNovos = dadosParaInserir.length;
        const totalDuplicados = totalLinhas - totalNovos;

        if (totalNovos === 0) {
          setStatus('⚠️ Importação finalizada');
          setProgressoMsg(`Nenhum dado novo. Todos os ${totalLinhas} registros já existem no banco.`);
          setPorcentagem(100);
          setCarregando(false);
          return;
        }

        setStatus(`Inserindo ${totalNovos} novos registros...`);
        const tamanhoLote = 500;

        for (let i = 0; i < totalNovos; i += tamanhoLote) {
          const lote = dadosParaInserir.slice(i, i + tamanhoLote);
          setProgressoMsg(`Enviando lote ${Math.floor(i / tamanhoLote) + 1}...`);

          const { error: insertError } = await supabase
            .from('carga_maquina')
            .insert(lote);

          if (insertError) throw insertError;
          setPorcentagem(Math.round(((i + lote.length) / totalNovos) * 100));
        }

        setStatus('✅ Importação concluída!');
        setProgressoMsg(
          totalDuplicados > 0
            ? `Sucesso: ${totalNovos} registros novos adicionados. (${totalDuplicados} duplicados foram ignorados).`
            : `Sucesso: ${totalNovos} registros adicionados.`
        );
        setPorcentagem(100);

      } catch (err) {
        console.error(err);
        setStatus(`❌ Erro: ${err.message}`);
        setPorcentagem(0);
      } finally {
        setCarregando(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processarArquivo(e.dataTransfer.files[0]);
  };

  const obterClasseStatus = () => {
    if (!status) return '';
    if (status.startsWith('✅')) return 'status-sucesso';
    if (status.startsWith('❌')) return 'status-erro';
    if (status.startsWith('⚠️')) return 'status-aviso';
    return 'status-processando';
  };

  return (
    <div className="importador-container">
      <div className="importador-card">
        <div className="importador-header">
          <div className="icon-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.61 21.89A10 10 0 0 0 20 2.62" /><path d="M8.04 12c.31-2.24 2.3-4 4.71-4s4.4 1.76 4.71 4" /><path d="M18 16a6 6 0 0 0-6-6c-2.3 0-4.4 1.3-5.34 3.32" /><rect width="16" height="8" x="2" y="14" rx="2" /><path d="M6 18h.01" /></svg>
          </div>
          <div>
            <h3 className="importador-titulo">Importador Carga Máquina</h3>
            <p className="importador-subtitulo">Planejamento de produção direto para o banco de dados</p>
          </div>
        </div>

        <hr className="divider" />

        <div
          className={`upload-dropzone ${isDragActive ? 'drag-active' : ''} ${carregando ? 'disabled' : ''}`}
          onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          onClick={() => !carregando && fileInputRef.current.click()}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={(e) => processarArquivo(e.target.files[0])} disabled={carregando} className="input-file-oculto" />
          <div className="dropzone-content">
            <p className="upload-text-principal">{carregando ? "Processando..." : "Arraste e solte o arquivo aqui"}</p>
            <p className="upload-text-secundario">Ou clique para procurar</p>
          </div>
        </div>

        {status && (
          <div className={`status-container ${obterClasseStatus()}`}>
            <div className="status-header-info">
              <span className="status-mensagem-principal">{status}</span>
              {progressoMsg && <span className="status-mensagem-secundaria">{progressoMsg}</span>}
            </div>
            {carregando && (
              <div className="progress-bar-wrapper">
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${porcentagem}%` }}></div>
                </div>
                <span className="progress-percentage">{porcentagem}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}