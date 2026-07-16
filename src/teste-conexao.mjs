import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gachmmrloqgccmwguter.supabase.co'
const supabaseKey = 'sb_publishable_YcJpLUnjk5aXyPX2P7QKfw_YY8L8GlI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testar() {
  console.log("Tentando conectar ao Supabase...")

  // Faz uma chamada simples para listar as tabelas ou tentar ler algo do banco
  const { data, error } = await supabase.from('carga_maquina').select('*').limit(1)

  if (error) {
    console.error("❌ Erro ao conectar:", error.message)
  } else {
    console.log("✅ Conexão estabelecida com sucesso!")
    console.log("Dados retornados (mesmo que vazio):", data)
  }
}

testar()