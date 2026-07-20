// src/servicos/clienteSupabase.js
import { createClient } from '@supabase/supabase-js';

// Carrega as credenciais estritamente das variáveis de ambiente
const urlSupabase = import.meta.env.VITE_SUPABASE_URL;
const chaveAnonSupabase = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação de segurança para alertar caso faltem as credenciais no .env
if (!urlSupabase || !chaveAnonSupabase) {
  console.warn(
    "⚠️ Atenção: As credenciais do Supabase não foram encontradas no seu arquivo .env. " +
    "Verifique se o arquivo .env existe na raiz do projeto e se as variáveis estão corretas."
  );
}

// Cria e exporta o cliente do Supabase para uso em toda a aplicação
export const supabase = createClient(urlSupabase, chaveAnonSupabase);