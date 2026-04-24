// app/api/manus/task/route.ts — Dispara pesquisa autônoma de concorrentes via Manus AI
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { manusCreateTask } from '@/lib/manus'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!process.env.MANUS_API_KEY) {
    return NextResponse.json({ error: 'MANUS_API_KEY não configurado' }, { status: 500 })
  }

  const { niche, city, type = 'competitors' } = await req.json()
  if (!niche) return NextResponse.json({ error: 'Nicho não informado' }, { status: 400 })

  const location = city ? `${city}, Brasil` : 'Brasil'

  const prompts: Record<string, string> = {
    competitors: `Você é um especialista em inteligência competitiva de marketing digital no Brasil.

Pesquise os 5 principais concorrentes do nicho: **${niche}** na região: **${location}**.

Para cada concorrente, descubra e analise:
1. Nome e website (se existir)
2. Posicionamento principal (proposta de valor, público-alvo)
3. Canais de marketing usados (Meta Ads, Google, Instagram, TikTok, etc.)
4. Ângulos criativos dos anúncios (tom, promessa, formato)
5. Pricing estimado ou modelo de negócio
6. Pontos fracos e oportunidades de diferenciação
7. Palavras-chave ou temas recorrentes na comunicação deles

Ao final, gere:
- Um resumo das oportunidades de diferenciação para quem quer entrar neste nicho
- Os 3 principais erros que os concorrentes estão cometendo

FORMATO DE RESPOSTA: JSON estruturado com os campos acima para cada concorrente + campo "opportunities" e "competitor_mistakes" no final.
Responda APENAS com o JSON, sem markdown extra.`,

    market: `Você é um especialista em mercado digital brasileiro.

Pesquise o mercado de **${niche}** em **${location}**:

1. Tamanho estimado do mercado e crescimento
2. Principais players e suas fatias
3. CPL médio real (custo por lead) para anúncios neste nicho
4. ROAS médio praticado pelo mercado
5. Canais de aquisição mais eficientes
6. Sazonalidade (meses de maior e menor demanda)
7. Tendências para os próximos 12 meses
8. Principais objeções do público-alvo

FORMATO: JSON com campos market_size, main_players, cpl_avg, roas_avg, best_channels, seasonality, trends, objections.
Responda APENAS com o JSON.`,
  }

  const prompt = prompts[type] || prompts.competitors

  try {
    const task = await manusCreateTask(prompt)
    return NextResponse.json({ ok: true, task_id: task.task_id, task_url: task.task_url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
