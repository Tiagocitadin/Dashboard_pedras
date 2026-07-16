// src/servicos/clienteSupabase.js
import { createClient } from '@supabase/supabase-js';

// Tenta carregar do .env; se não encontrar, usa as chaves diretamente como fallback
const urlSupabase = import.meta.env.VITE_SUPABASE_URL || 'https://gachmmrloqgccmwguter.supabase.co';
const chaveAnonSupabase = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YcJpLUnjk5aXyPX2P7QKfw_YY8L8GlI';

// Validação de segurança simples para alertar caso falte alguma credencial
if (!urlSupabase || !chaveAnonSupabase) {
  console.warn(
    "⚠️ Atenção: As credenciais do Supabase não foram encontradas no seu arquivo .env. " +
    "Verifique se o arquivo .env existe na raiz do projeto e se as variáveis estão corretas."
  );
}

// Cria e exporta o cliente do Supabase para uso em toda a aplicação
export const supabase = createClient(urlSupabase, chaveAnonSupabase);