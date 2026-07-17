import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../servicos/clienteSupabase';
import { parse, formatISO, isValid } from 'date-fns';
import { FiArrowLeft } from 'react-icons/fi';
import './ImportadorCarga.css';

export default function ImportadorCarga() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState('');
  const [porcentagem, setPorcentagem] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [tabelaDestino, setTabelaDestino] = useState('carga_maquina');
  const fileInputRef = useRef(null);

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
      return dataJS.toISOString().split('T')[0];
    }
    if (typeof valor === 'string') {
      const dataConvertida = parse(valor, 'dd/MM/yyyy', new Date());
      if (isValid(dataConvertida)) return formatISO(dataConvertida, { representation: 'date' });
    }
    return null;
  };

  const processarArquivo = async (file) => {
    if (!file) return;

    setCarregando(true);
    setStatus('Processando...');
    setPorcentagem(0);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        if (rows.length === 0) throw new Error("A planilha está vazia.");

        const dadosFormatados = rows.map((linha) => {
          if (tabelaDestino === 'ciclo_injetora') {
            return {
              injetora: String(linha['Injetora'] || ''),
              data: formatarData(linha['Data']),
              cod_produto: String(linha['Cód. Produto'] || ''),
              descricao: String(linha['Descrição'] || ''),
              cavidade_molde: parseInt(linha['Cavidade Molde'] || 0),
              tempo_resfriamento: String(linha['Tempo de Resfriamento'] || ''),
              ciclo: String(linha['Ciclo'] || ''),
              tempo_injecao: String(linha['Tempo de Injeção'] || ''),
              kg_un: parseFloat(linha['Kg UN'] || 0),
              kg_haste: parseFloat(linha['Kg HASTE'] || 0),
              observacao: String(linha['Observação'] || '')
            };
          } else {
            // Ajustado para garantir que enviamos apenas colunas reconhecidas pelo seu banco
            return {
              cod_prod: String(linha['Cód.Prod'] || ''),
              injetora: String(linha['Injetora'] || ''),
              inicio: formatarData(linha['Início']),
              cliente: String(linha['Cliente'] || '') 
            };
          }
        });

        const totalLinhas = dadosFormatados.length;
        const tamanhoLote = 500;

        for (let i = 0; i < totalLinhas; i += tamanhoLote) {
          const lote = dadosFormatados.slice(i, i + tamanhoLote);
          const { error: insertError } = await supabase.from(tabelaDestino).insert(lote);
          if (insertError) throw insertError;
          setPorcentagem(Math.round(((i + lote.length) / totalLinhas) * 100));
        }

        setStatus(`✅ Sucesso: ${totalLinhas} registros importados.`);
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
      <button className="back-importador-btn" onClick={() => navigate('/')}>
        <FiArrowLeft /> <span>Voltar ao Início</span>
      </button>

      <div className="importador-card">
        <h3>Importador de Dados</h3>

        <div className="select-tabela">
          <label>Selecione a tabela de destino:</label>
          <select 
            value={tabelaDestino} 
            onChange={(e) => setTabelaDestino(e.target.value)} 
            disabled={carregando}
          >
            <option value="carga_maquina">Carga Máquina</option>
            <option value="ciclo_injetora">Ciclo Injetora</option>
          </select>
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