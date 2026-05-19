// app/api/cron/refresh-benchmarks/route.ts
// Cron mensal: atualiza CPL/ROAS de todos os nichos via Tavily + Claude Haiku
// com queries específicas por canal (Meta, Google, TikTok, LinkedIn).
//
// Vercel Cron (vercel.json):
//   { "path": "/api/cron/refresh-benchmarks", "schedule": "0 6 1 * *" }
//   → Roda às 06:00 UTC no dia 1 de cada mês
//
// SQL para criar/migrar a tabela (rode no Supabase SQL Editor):
//   CREATE TABLE IF NOT EXISTS benchmark_cache (
//     niche_key        TEXT PRIMARY KEY,
//     niche_name       TEXT,
//     cpl_min          NUMERIC,
//     cpl_max          NUMERIC,
//     cpl_meta_min     NUMERIC,
//     cpl_meta_max     NUMERIC,
//     cpl_google_min   NUMERIC,
//     cpl_google_max   NUMERIC,
//     cpl_tiktok_min   NUMERIC,
//     cpl_tiktok_max   NUMERIC,
//     cpl_linkedin_min NUMERIC,
//     cpl_linkedin_max NUMERIC,
//     roas_avg         NUMERIC,
//     cpc_avg          NUMERIC,
//     ctr_avg          NUMERIC,
//     cpm_avg          NUMERIC,
//     cpa_avg          NUMERIC,
//     confidence       TEXT,
//     summary          TEXT,
//     updated_at       TIMESTAMPTZ DEFAULT NOW()
//   );
//   -- Migração para tabela existente (execute cada linha separadamente):
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpc_avg        NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS ctr_avg        NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpm_avg        NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpa_avg        NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_meta_min   NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_meta_max   NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_google_min NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_google_max NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_tiktok_min NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_tiktok_max NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_linkedin_min NUMERIC;
//   ALTER TABLE benchmark_cache ADD COLUMN IF NOT EXISTS cpl_linkedin_max NUMERIC;

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET

// Todos os 82 nichos mapeados no ELYON — cobertura completa
const NICHES_TO_REFRESH: { key: string; name: string; searchTerm: string; b2b?: boolean }[] = [
  // ── Financeiro & Seguros ────────────────────────────────────────────────────
  { key: 'financeiro',           name: 'Financeiro / Crédito',                  searchTerm: 'financeiro crédito empréstimo consignado' },
  { key: 'corretor_saude',       name: 'Corretor de Planos de Saúde',           searchTerm: 'plano de saúde corretor operadora' },
  { key: 'corretor_imobiliario', name: 'Corretor Imobiliário',                  searchTerm: 'corretor imobiliário venda imóvel' },
  { key: 'protecao_patrimonial', name: 'Proteção Patrimonial',                  searchTerm: 'proteção patrimonial holding familiar' },
  { key: 'seguro_vida',          name: 'Seguro de Vida',                        searchTerm: 'seguro de vida corretor apólice' },
  { key: 'seguro_auto',          name: 'Seguro Automotivo',                     searchTerm: 'seguro automotivo carro veículo' },
  { key: 'seguro_residencial',   name: 'Seguro Residencial',                    searchTerm: 'seguro residencial casa imóvel' },
  { key: 'consorcio',            name: 'Consórcio',                             searchTerm: 'consórcio imóvel carro contemplado parcela' },
  { key: 'cambio_remessas',      name: 'Câmbio / Remessas',                     searchTerm: 'câmbio remessa internacional dólar fintech' },
  { key: 'previdencia_privada',  name: 'Previdência Privada',                   searchTerm: 'previdência privada PGBL VGBL aposentadoria' },

  // ── Saúde & Clínicas ────────────────────────────────────────────────────────
  { key: 'saude',                name: 'Saúde / Clínica',                       searchTerm: 'clínica médica saúde consulta' },
  { key: 'odontologia',          name: 'Odontologia',                           searchTerm: 'dentista odontologia estética dental' },
  { key: 'psicologia',           name: 'Psicologia / Terapia',                  searchTerm: 'psicólogo terapia psicologia atendimento' },
  { key: 'fisioterapia',         name: 'Fisioterapia',                          searchTerm: 'fisioterapia fisioterapeuta reabilitação' },
  { key: 'nutricao',             name: 'Nutrição',                              searchTerm: 'nutricionista alimentação saudável dieta' },
  { key: 'oftalmologia',         name: 'Oftalmologia',                          searchTerm: 'oftalmologia olhos cirurgia visão catarata' },
  { key: 'dermatologia',         name: 'Dermatologia',                          searchTerm: 'dermatologia pele tratamento estética médica' },
  { key: 'cirurgia_plastica',    name: 'Cirurgia Plástica',                     searchTerm: 'cirurgia plástica estética médica lipoaspiração rinoplastia' },
  { key: 'ortopedia',            name: 'Ortopedia',                             searchTerm: 'ortopedia traumatologia coluna joelho ombro' },
  { key: 'pediatria',            name: 'Pediatria',                             searchTerm: 'pediatria médico infantil criança consulta' },
  { key: 'ginecologia',          name: 'Ginecologia',                           searchTerm: 'ginecologia obstetrícia mulher consulta exame' },
  { key: 'cardiologia',          name: 'Cardiologia',                           searchTerm: 'cardiologia coração médico consulta ECG' },
  { key: 'psiquiatria',          name: 'Psiquiatria',                           searchTerm: 'psiquiatria saúde mental medicação consulta' },
  { key: 'fonoaudiologia',       name: 'Fonoaudiologia',                        searchTerm: 'fonoaudiologia gagueira voz fala criança adulto' },
  { key: 'clinica_reabilitacao', name: 'Clínica de Reabilitação',               searchTerm: 'clínica reabilitação recuperação dependência álcool drogas' },
  { key: 'clinica_capilar',      name: 'Clínica Capilar',                       searchTerm: 'transplante cabelo calvície clínica capilar tratamento' },
  { key: 'clinica_veterinaria',  name: 'Clínica Veterinária',                   searchTerm: 'clínica veterinária pet saúde animal consulta' },

  // ── Beleza & Estética ───────────────────────────────────────────────────────
  { key: 'beleza',               name: 'Beleza / Estética',                     searchTerm: 'salão de beleza estética cabeleireiro' },
  { key: 'harmonizacao',         name: 'Harmonização Facial',                   searchTerm: 'harmonização facial botox preenchimento lábios' },
  { key: 'depilacao',            name: 'Depilação',                             searchTerm: 'depilação laser a laser estética definitiva' },
  { key: 'micropigmentacao',     name: 'Micropigmentação',                      searchTerm: 'micropigmentação sobrancelha dermopigmentação labial' },
  { key: 'estetica_corporal',    name: 'Estética Corporal',                     searchTerm: 'estética corporal criolipólise gordura localizada massagem' },
  { key: 'barbearia',            name: 'Barbearia',                             searchTerm: 'barbearia salão masculino corte barba' },
  { key: 'tatuagem_piercing',    name: 'Tatuagem / Piercing',                   searchTerm: 'tatuagem piercing estúdio arte corporal' },

  // ── Fitness & Bem-estar ─────────────────────────────────────────────────────
  { key: 'fitness',              name: 'Fitness / Academia',                    searchTerm: 'academia fitness personal trainer musculação' },
  { key: 'crossfit_funcional',   name: 'CrossFit / Treino Funcional',           searchTerm: 'crossfit treino funcional box WOD' },
  { key: 'yoga_pilates',         name: 'Yoga / Pilates',                        searchTerm: 'yoga pilates estúdio bem-estar mindfulness' },

  // ── Educação & Cursos ───────────────────────────────────────────────────────
  { key: 'educacao',             name: 'Educação / Cursos Online',              searchTerm: 'curso online educação EAD infoproduto' },
  { key: 'escola_idiomas',       name: 'Escola de Idiomas',                     searchTerm: 'escola idiomas inglês francês espanhol curso' },
  { key: 'curso_concurso',       name: 'Curso para Concursos',                  searchTerm: 'curso preparatório concurso público aprovação' },
  { key: 'marketing_digital_cursos', name: 'Cursos de Marketing Digital',       searchTerm: 'cursos marketing digital gestor tráfego pago' },
  { key: 'coaching_carreira',    name: 'Coaching de Carreira',                  searchTerm: 'coaching carreira executivo liderança mentoria', b2b: true },
  { key: 'desenvolvimento_pessoal', name: 'Desenvolvimento Pessoal',            searchTerm: 'desenvolvimento pessoal hábitos produtividade mentalidade' },

  // ── Imobiliário & Construção ────────────────────────────────────────────────
  { key: 'imobiliario',          name: 'Imobiliário',                           searchTerm: 'imóvel lançamento construtora compra venda' },
  { key: 'construcao',           name: 'Construção / Reforma',                  searchTerm: 'construção reforma engenharia material obra' },
  { key: 'arquitetura_design',   name: 'Arquitetura / Design de Interiores',    searchTerm: 'arquitetura design interiores decoração projeto' },
  { key: 'moveis_planejados',    name: 'Móveis Planejados',                     searchTerm: 'móveis planejados marcenaria sob medida cozinha' },
  { key: 'loja_moveis',          name: 'Loja de Móveis',                        searchTerm: 'loja móveis decoração casa sofá cama' },
  { key: 'energia_solar',        name: 'Energia Solar',                         searchTerm: 'energia solar fotovoltaico painel instalação' },

  // ── Tecnologia & B2B ────────────────────────────────────────────────────────
  { key: 'tecnologia',           name: 'Tecnologia / SaaS',                     searchTerm: 'software SaaS tecnologia sistema', b2b: true },
  { key: 'saas_b2b',             name: 'SaaS B2B',                              searchTerm: 'SaaS B2B software empresarial automação CRM ERP', b2b: true },
  { key: 'desenvolvimento_software', name: 'Desenvolvimento de Software',        searchTerm: 'desenvolvimento software aplicativo app tecnologia', b2b: true },
  { key: 'rh_empresa',           name: 'RH / Recursos Humanos',                 searchTerm: 'recursos humanos RH outsourcing recrutamento seleção', b2b: true },
  { key: 'auditoria',            name: 'Auditoria / Compliance',                searchTerm: 'auditoria compliance governança consultoria', b2b: true },

  // ── Jurídico & Contabilidade ─────────────────────────────────────────────────
  { key: 'juridico',             name: 'Jurídico / Advocacia',                  searchTerm: 'advogado advocacia escritório jurídico' },
  { key: 'contabilidade',        name: 'Contabilidade',                         searchTerm: 'contabilidade contador escritório contábil' },

  // ── Consultoria & Agência ────────────────────────────────────────────────────
  { key: 'consultoria',          name: 'Consultoria / Coaching',                searchTerm: 'consultoria empresarial coach mentoria negócios' },
  { key: 'marketing_agencia',    name: 'Marketing / Agência',                   searchTerm: 'agência marketing tráfego pago gestão anúncios', b2b: true },
  { key: 'franquias',            name: 'Franquias',                             searchTerm: 'franquia franqueado expansão negócio investimento Brasil' },

  // ── E-commerce ──────────────────────────────────────────────────────────────
  { key: 'ecommerce',            name: 'E-commerce',                            searchTerm: 'loja virtual e-commerce compra online produto' },
  { key: 'ecommerce_cosmeticos', name: 'E-commerce Cosméticos',                 searchTerm: 'e-commerce cosméticos beleza skincare perfume online' },
  { key: 'ecommerce_moda',       name: 'E-commerce Moda',                       searchTerm: 'e-commerce moda roupas vestuário loja online' },
  { key: 'moda',                 name: 'Moda / Vestuário',                      searchTerm: 'moda vestuário roupas boutique varejo' },
  { key: 'farmacia',             name: 'Farmácia / Drogaria',                   searchTerm: 'farmácia drogaria medicamento produto saúde' },

  // ── Alimentação & Entretenimento ─────────────────────────────────────────────
  { key: 'restaurante',          name: 'Restaurante / Food',                    searchTerm: 'restaurante delivery alimentação food serviço' },
  { key: 'delivery_food',        name: 'Delivery de Comida',                    searchTerm: 'delivery comida aplicativo pedido online' },
  { key: 'padaria_cafeteria',    name: 'Padaria / Cafeteria',                   searchTerm: 'padaria cafeteria café pão confeitaria' },
  { key: 'catering_buffet',      name: 'Catering / Buffet',                     searchTerm: 'catering buffet evento casamento festa empresarial' },
  { key: 'eventos',              name: 'Eventos / Entretenimento',              searchTerm: 'evento entretenimento show festa ingresso' },

  // ── Pet & Turismo ────────────────────────────────────────────────────────────
  { key: 'pet',                  name: 'Pet / Veterinário',                     searchTerm: 'petshop veterinário pet cão gato' },
  { key: 'turismo',              name: 'Turismo / Viagens',                     searchTerm: 'turismo viagem hotel pacote agência' },

  // ── Serviços Locais & Residenciais ───────────────────────────────────────────
  { key: 'automotivo',           name: 'Automotivo / Oficina',                  searchTerm: 'oficina mecânica automotivo concessionária carro' },
  { key: 'lava_jato',            name: 'Lava Jato',                             searchTerm: 'lava jato higienização veículo detailing carro' },
  { key: 'servicos_residenciais',name: 'Serviços Residenciais',                 searchTerm: 'limpeza residencial serviço doméstico diarista jardinagem' },
  { key: 'ar_condicionado',      name: 'Ar-Condicionado',                       searchTerm: 'ar condicionado split instalação manutenção climatização' },
  { key: 'dedetizacao',          name: 'Dedetização',                           searchTerm: 'dedetização controle pragas extermínio baratas' },
  { key: 'mudancas_transporte',  name: 'Mudanças / Transporte',                 searchTerm: 'mudanças residencial transporte carga frete caminhão' },
  { key: 'autoescola',           name: 'Autoescola',                            searchTerm: 'autoescola CNH habilitação aulas direção' },
  { key: 'lavanderia',           name: 'Lavanderia',                            searchTerm: 'lavanderia lavanderias serviço roupas lavagem' },
  { key: 'seguranca_privada',    name: 'Segurança Privada',                     searchTerm: 'segurança privada vigilância empresa portaria' },

  // ── Criativo & Produção ──────────────────────────────────────────────────────
  { key: 'fotografia_video',     name: 'Fotografia / Vídeo',                    searchTerm: 'fotografia vídeo produção audiovisual foto' },
  { key: 'producao_audiovisual', name: 'Produção Audiovisual',                  searchTerm: 'produção audiovisual vídeo marketing conteúdo' },
]

async function tavilyQuery(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ''
    const data = await res.json()
    const parts: string[] = []
    if (data.answer) parts.push(data.answer)
    data.results?.slice(0, 2).forEach((r: any) => {
      if (r.content) parts.push(r.content.slice(0, 300))
    })
    return parts.join('\n')
  } catch {
    return ''
  }
}

async function fetchBenchmarksByChannel(searchTerm: string, isB2B: boolean): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return ''
  const year = new Date().getFullYear()

  const q3 = isB2B
    ? `CPL LinkedIn Google Ads ${searchTerm} Brasil ${year} custo por lead benchmark B2B`
    : `CPL TikTok YouTube ${searchTerm} Brasil ${year} custo por lead anúncios benchmark`

  const [r1, r2, r3] = await Promise.allSettled([
    tavilyQuery(`CPL Meta Ads Instagram ${searchTerm} Brasil ${year} custo por lead benchmark gestores resultado real`, apiKey),
    tavilyQuery(`CPL Google Ads ${searchTerm} Brasil ${year} custo por lead benchmark pesquisa paga resultado`, apiKey),
    tavilyQuery(q3, apiKey),
  ])

  return [r1, r2, r3]
    .map(r => (r.status === 'fulfilled' ? r.value : ''))
    .filter(Boolean)
    .join('\n\n')
}

type Extracted = {
  cpl_min:          number | null
  cpl_max:          number | null
  cpl_meta_min:     number | null
  cpl_meta_max:     number | null
  cpl_google_min:   number | null
  cpl_google_max:   number | null
  cpl_tiktok_min:   number | null
  cpl_tiktok_max:   number | null
  cpl_linkedin_min: number | null
  cpl_linkedin_max: number | null
  roas_avg:         number | null
  cpc_avg:          number | null
  ctr_avg:          number | null
  cpm_avg:          number | null
  cpa_avg:          number | null
  confidence:       string
}

async function extractNumbers(rawText: string, nicheName: string): Promise<Extracted | null> {
  if (!rawText) return null
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Extraia benchmarks de marketing digital para o nicho "${nicheName}" no Brasil.
Retorne APENAS JSON válido (sem markdown):
{
  "cpl_min": NUMBER_OR_NULL,
  "cpl_max": NUMBER_OR_NULL,
  "cpl_meta_min": NUMBER_OR_NULL,
  "cpl_meta_max": NUMBER_OR_NULL,
  "cpl_google_min": NUMBER_OR_NULL,
  "cpl_google_max": NUMBER_OR_NULL,
  "cpl_tiktok_min": NUMBER_OR_NULL,
  "cpl_tiktok_max": NUMBER_OR_NULL,
  "cpl_linkedin_min": NUMBER_OR_NULL,
  "cpl_linkedin_max": NUMBER_OR_NULL,
  "roas_avg": NUMBER_OR_NULL,
  "cpc_avg": NUMBER_OR_NULL,
  "ctr_avg": NUMBER_OR_NULL,
  "cpm_avg": NUMBER_OR_NULL,
  "cpa_avg": NUMBER_OR_NULL,
  "confidence": "alta|media|baixa"
}
Regras:
- cpl_min/max: range geral em R$ (mínimo dos canais, máximo dos canais).
- cpl_meta/google/tiktok/linkedin: CPL específico por canal em R$. null se não citado.
- ctr_avg: % (ex: 1.8). cpc_avg/cpm_avg/cpa_avg: R$.
- confidence: "alta" se 2+ fontes com valores, "media" se 1 fonte, "baixa" se estimado.
- Use null a inventar — dados ausentes são melhores que dados incorretos.

TEXTO:
${rawText.slice(0, 1200)}`,
      }],
    })
    const text = (res.content[0] as any).text?.trim() || ''
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers instanceof Headers ? req.headers.get('authorization') : null
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ skipped: true, reason: 'supabase not configured' })
  }

  const tavilyKey    = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey || !anthropicKey) {
    return NextResponse.json({ skipped: true, reason: 'TAVILY_API_KEY ou ANTHROPIC_API_KEY não configurados' })
  }

  const results: { key: string; status: string; cpl_min?: number | null; cpl_max?: number | null }[] = []
  const updatedAt = new Date().toISOString()

  for (const niche of NICHES_TO_REFRESH) {
    try {
      const raw = await fetchBenchmarksByChannel(niche.searchTerm, niche.b2b ?? false)
      const ex  = await extractNumbers(raw, niche.name)

      if (ex && (ex.cpl_min || ex.cpl_max)) {
        const { error } = await supabaseAdmin
          .from('benchmark_cache')
          .upsert({
            niche_key:        niche.key,
            niche_name:       niche.name,
            cpl_min:          ex.cpl_min,
            cpl_max:          ex.cpl_max,
            cpl_meta_min:     ex.cpl_meta_min,
            cpl_meta_max:     ex.cpl_meta_max,
            cpl_google_min:   ex.cpl_google_min,
            cpl_google_max:   ex.cpl_google_max,
            cpl_tiktok_min:   ex.cpl_tiktok_min,
            cpl_tiktok_max:   ex.cpl_tiktok_max,
            cpl_linkedin_min: ex.cpl_linkedin_min,
            cpl_linkedin_max: ex.cpl_linkedin_max,
            roas_avg:         ex.roas_avg,
            cpc_avg:          ex.cpc_avg,
            ctr_avg:          ex.ctr_avg,
            cpm_avg:          ex.cpm_avg,
            cpa_avg:          ex.cpa_avg,
            confidence:       ex.confidence,
            summary:          raw.slice(0, 600),
            updated_at:       updatedAt,
          }, { onConflict: 'niche_key' })

        results.push({
          key:     niche.key,
          status:  error ? `erro: ${error.message}` : 'ok',
          cpl_min: ex.cpl_min,
          cpl_max: ex.cpl_max,
        })
      } else {
        results.push({ key: niche.key, status: 'sem dados suficientes' })
      }

      await new Promise(r => setTimeout(r, 400))
    } catch (e: any) {
      results.push({ key: niche.key, status: `falhou: ${e.message}` })
    }
  }

  const ok = results.filter(r => r.status === 'ok').length
  console.log(`[cron/refresh-benchmarks] ${ok}/${NICHES_TO_REFRESH.length} nichos atualizados`)

  return NextResponse.json({
    refreshedAt: updatedAt,
    total:       NICHES_TO_REFRESH.length,
    updated:     ok,
    results,
  })
}
