import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../servicos/clienteSupabase';
import { parse, formatISO, isValid } from 'date-fns';
import './ImportadorCarga.css';

export default function ImportadorCarga() {
  const navigate = useNavigate(); // Hook para navegação
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState('');
  const [progressoMsg, setProgressoMsg] = useState('');
  const [porcentagem, setPorcentagem] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Proteção para evitar que o usuário saia durante o upload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (carregando) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [carregando]);

  const formatarData = (valor) => {
    if (!valor) return null;
    if (typeof valor === 'number') {
      const dataJS = new Date((valor - 25569) * 86400 * 1000);
      return dataJS.toISOString();
    }
    if (typeof valor === 'string') {
      const dataConvertida = parse(valor, 'dd/MM/yyyy HH:mm:ss', new Date());
      if (isValid(dataConvertida)) return formatISO(dataConvertida);
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
    setProgressoMsg('Lendo planilha e verificando duplicatas...');
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

        if (totalNovos === 0) {
          setStatus('⚠️ Importação finalizada');
          setProgressoMsg(`Nenhum dado novo. Todos os ${totalLinhas} registros já existem.`);
          setPorcentagem(100);
          return;
        }

        const tamanhoLote = 500;
        for (let i = 0; i < totalNovos; i += tamanhoLote) {
          const lote = dadosParaInserir.slice(i, i + tamanhoLote);
          const { error: insertError } = await supabase.from('carga_maquina').insert(lote);
          if (insertError) throw insertError;
          setPorcentagem(Math.round(((i + lote.length) / totalNovos) * 100));
        }

        setStatus('✅ Importação concluída!');
        setProgressoMsg(`Sucesso: ${totalNovos} registros adicionados.`);
      } catch (err) {
        setStatus(`❌ Erro: ${err.message}`);
      } finally {
        setCarregando(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="importador-container">
      <button className="btn-voltar-home" onClick={() => navigate('/')}>← Voltar</button>
      
      <div className="importador-card">
        <div className="importador-header">
          <h3>Importador Carga Máquina</h3>
        </div>

        <div className={`upload-dropzone ${isDragActive ? 'drag-active' : ''} ${carregando ? 'disabled' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setIsDragActive(false); if (!carregando) processarArquivo(e.dataTransfer.files[0]); }}
          onClick={() => !carregando && fileInputRef.current.click()}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={(e) => processarArquivo(e.target.files[0])} style={{ display: 'none' }} />
          <p>{carregando ? "Processando..." : "Arraste o arquivo ou clique aqui"}</p>
        </div>

        {status && (
          <div className="status-container">
            <p>{status}</p>
            {carregando && <div className="progress-bar-fill" style={{ width: `${porcentagem}%` }}></div>}
          </div>
        )}
      </div>
    </div>
  );
}