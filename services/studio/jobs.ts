import { clerkClient } from '@clerk/nextjs/server'
import { randomUUID } from 'crypto'
import { effectivePlanForUser } from '@/lib/access'
import { OPERATION_COSTS, PLAN_CREDITS } from '@/lib/credits'
import { briefSchema, type StudioBrief } from '@/lib/studio/schema'
import { studioClient, studioDb, StudioError, studioJob } from './access'
import { ownedStudioAsset, referenceBytes, saveStudioImage, publicAsset } from './assets'
import { createStudioPlan, renderStudioCreative } from './ai'
import { researchTargeting } from './targeting'
import { readInternalReporteiData } from '@/services/reportei/internal'

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export async function createStudioJob(userId: string, body: any) {
  const client = await studioClient(userId, String(body.clientId || ''))
  if (!UUID.test(body.requestId || '')) throw new StudioError('Identificador da criação inválido.', 400)
  const result = briefSchema.safeParse(body.brief)
  if (!result.success) throw new StudioError(result.error.issues[0]?.message || 'Revise o briefing.', 400)
  const existing = await studioDb()
    .from('studio_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('request_id', body.requestId)
    .maybeSingle()
  if (existing.error) throw new StudioError('Não foi possível preparar esta criação.')
  if (existing.data) {
    if (existing.data.client_id !== client.id)
      throw new StudioError('Esta criação pertence a outro cliente.', 409)
    return existing.data
  }
  for (const id of result.data.referenceIds) await ownedStudioAsset(userId, client.id, id)
  const recent = await studioDb()
    .from('studio_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  if (recent.error) throw new StudioError('Não foi possível verificar a disponibilidade do Estúdio.')
  if ((recent.count || 0) >= 12)
    throw new StudioError('Você já iniciou 12 criações nesta hora. Aguarde para preparar outra.', 429)
  const saved = await studioDb()
    .from('studio_jobs')
    .insert({
      id: randomUUID(),
      user_id: userId,
      client_id: client.id,
      request_id: body.requestId,
      brief: result.data,
    })
    .select('*')
    .single()
  if (saved.error) {
    const duplicate = await studioDb()
      .from('studio_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', client.id)
      .eq('request_id', body.requestId)
      .maybeSingle()
    if (duplicate.data) return duplicate.data
    throw new StudioError('Não foi possível salvar a criação.')
  }
  return saved.data
}
export async function getStudioJob(userId: string, id: string) {
  const job = await studioJob(userId, id)
  const savedAssets = await studioDb()
    .from('studio_assets')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', job.client_id)
    .eq('job_id', id)
    .order('created_at', { ascending: true })
  if (savedAssets.error) throw new StudioError('Não foi possível ler as artes desta criação.')
  const assets = (savedAssets.data || []).map(publicAsset)
  const { data: steps, error } = await studioDb()
    .from('studio_steps')
    .select('step,status,cost,attempts')
    .eq('user_id', userId)
    .eq('job_id', id)
  if (error) throw new StudioError('Não foi possível ler as etapas da criação.')
  return {
    ...job,
    assets,
    steps,
    chargedCredits: (steps || []).filter((s) => s.status !== 'failed').reduce((n, s) => n + s.cost, 0),
  }
}
export async function listStudioJobs(userId: string, clientId: string) {
  await studioClient(userId, clientId)
  const { data, error } = await studioDb()
    .from('studio_jobs')
    .select('id,client_id,brief,status,stage,error,created_at,updated_at')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw new StudioError('Não foi possível ler o histórico.')
  return data || []
}
async function chargeStep(userId: string, jobId: string, step: string, plan: string, operation: string) {
  const { data, error } = await studioDb().rpc('elyon_studio_charge_step', {
    p_user_id: userId,
    p_job_id: jobId,
    p_step: step,
    p_limit: PLAN_CREDITS[plan] || 0,
    p_cost: OPERATION_COSTS[operation],
    p_operation: operation,
  })
  if (error || !data) throw new StudioError('Não foi possível reservar os créditos desta etapa.')
  if (!data.allowed) throw new StudioError(data.error || 'Créditos insuficientes para esta etapa.', 402)
}
async function finishStep(userId: string, jobId: string, step: string, output: unknown) {
  const { error } = await studioDb().rpc('elyon_studio_complete_step', {
    p_user_id: userId,
    p_job_id: jobId,
    p_step: step,
    p_output: output,
  })
  if (error) throw new StudioError('A etapa não pôde ser registrada. Você pode retomar esta criação.')
}
async function failStep(userId: string, jobId: string, step: string) {
  const { error } = await studioDb().rpc('elyon_studio_fail_step', {
    p_user_id: userId,
    p_job_id: jobId,
    p_step: step,
  })
  if (error)
    throw new StudioError(
      'A devolução dos créditos está pendente. Retome a criação para reconciliar esta etapa.',
    )
}
export async function runStudioJob(userId: string, id: string) {
  let job = await studioJob(userId, id)
  if (job.status === 'ready') return getStudioJob(userId, id)
  let effective: string | null
  try {
    effective = effectivePlanForUser(await (await clerkClient()).users.getUser(userId))
  } catch {
    throw new StudioError('Não foi possível verificar seu plano.')
  }
  if (!effective) throw new StudioError('Assine um plano para continuar usando a IA.', 402)
  const db = studioDb(),
    now = new Date().toISOString()
  // A database compare-and-set admits a single runner, including across server instances.
  const claimed = await db
    .from('studio_jobs')
    .update({
      lease_until: new Date(Date.now() + 8 * 60000).toISOString(),
      updated_at: now,
      status: job.plan ? 'rendering' : 'planning',
      stage: job.plan ? 'Retomando as artes' : 'Lendo briefing e referências',
      error: null,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .neq('status', 'ready')
    .or(`lease_until.is.null,lease_until.lt.${now}`)
    .select('*')
    .maybeSingle()
  if (claimed.error) throw new StudioError('Não foi possível iniciar a criação.')
  if (!claimed.data) throw new StudioError('Esta criação já está em andamento. Acompanhe o progresso.', 409)
  job = claimed.data
  const brief: StudioBrief = briefSchema.parse(job.brief),
    client = await studioClient(userId, job.client_id)
  const update = async (value: Record<string, unknown>) => {
    const { error } = await db
      .from('studio_jobs')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new StudioError('Não foi possível salvar o progresso.')
  }
  try {
    const references = await referenceBytes(userId, client.id, brief.referenceIds)
    if (!job.plan) {
      // Reserve only the planning step here; each art has its own retry-safe receipt.
      await chargeStep(
        userId,
        id,
        'plan',
        effective,
        brief.mode === 'creative' ? 'assets_copy' : 'campaign_generate',
      )
      try {
        const evidence = await readInternalReporteiData(userId, client.id, { datePreset: 'last_30d' }).catch(
          () => null,
        )
        const generated = await createStudioPlan(brief, client, references, evidence)
        await update({ stage: 'Verificando opções de público e palavras-chave' })
        const targeting = await researchTargeting(userId, client, brief, generated.plan)
        job.plan = {
          campaign: generated.plan,
          targeting,
          generation: {
            model: generated.model,
            provider: generated.provider,
            createdAt: new Date().toISOString(),
          },
        }
        await finishStep(userId, id, 'plan', job.plan)
      } catch (error) {
        await failStep(userId, id, 'plan')
        throw error
      }
    }
    await update({
      status: 'rendering',
      stage:
        brief.mode === 'audience' ? 'Organizando os públicos' : 'Produzindo as artes com suas referências',
    })
    const formats = brief.mode === 'audience' ? [] : brief.formats
    const outcomes = await Promise.allSettled(
      formats.map(async (format) => {
        const step = `image:${format}`
        const existing = await db
          .from('studio_assets')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', id)
          .eq('format', format)
          .eq('kind', 'generated')
          .maybeSingle()
        if (existing.error) throw new StudioError('Não foi possível verificar as artes já salvas.')
        if (existing.data) {
          await finishStep(userId, id, step, { assetId: existing.data.id })
          return
        }
        await chargeStep(userId, id, step, effective, 'assets_generate')
        try {
          const image = await renderStudioCreative(brief, job.plan.campaign, format, references)
          const asset = await saveStudioImage(userId, client.id, {
            ...image,
            name: `${job.plan.campaign.name} · ${format}`,
            kind: 'generated',
            format,
            jobId: id,
            metadata: {
              model: image.model,
              provider: image.provider,
              referenceIds: brief.referenceIds,
              requiresReview: true,
            },
          })
          await finishStep(userId, id, step, { assetId: asset.id })
        } catch (error) {
          // If storage+DB already committed, preserve its receipt and reconcile on resume.
          const saved = await db
            .from('studio_assets')
            .select('id')
            .eq('user_id', userId)
            .eq('job_id', id)
            .eq('format', format)
            .maybeSingle()
          if (saved.error) throw new StudioError('A confirmação desta arte está pendente. Retome a criação.')
          if (!saved.data) await failStep(userId, id, step)
          throw error
        }
      }),
    )
    const failures = outcomes.filter((r) => r.status === 'rejected')
    await update({
      status: failures.length ? 'partial' : 'ready',
      stage: failures.length
        ? 'Plano salvo; algumas artes precisam ser retomadas'
        : 'Pacote pronto para revisar',
      error: failures.length
        ? 'As etapas que falharam sem gerar uma arte foram estornadas. Retome apenas o que falta.'
        : null,
      lease_until: null,
    })
  } catch (error) {
    // Reconcile a previous interrupted attempt if its references are no longer readable.
    const pending = await db
      .from('studio_steps')
      .select('step')
      .eq('user_id', userId)
      .eq('job_id', id)
      .eq('status', 'charged')
    for (const receipt of pending.data || []) {
      const format = receipt.step.startsWith('image:') ? receipt.step.slice(6) : null
      const saved = format
        ? await db
            .from('studio_assets')
            .select('id')
            .eq('user_id', userId)
            .eq('job_id', id)
            .eq('format', format)
            .maybeSingle()
        : null
      if (!saved?.error && !saved?.data) await failStep(userId, id, receipt.step)
    }
    await update({
      status: job.plan ? 'partial' : 'error',
      stage: 'Criação pausada',
      error:
        error instanceof StudioError
          ? error.message
          : 'A IA não conseguiu concluir. As etapas sem resultado foram estornadas.',
      lease_until: null,
    })
  }
  return getStudioJob(userId, id)
}
