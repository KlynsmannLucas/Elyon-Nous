// app/api/gtm/audit/route.ts — Auditoria automática de tracking com Google Tag Manager API
// PENDENTE: requer escopo tagmanager.readonly no OAuth.
// Scope: https://www.googleapis.com/auth/tagmanager.readonly
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getValidGoogleToken, tokenErrorToResponse } from '@/services/google/token-manager'

const GTM_API = 'https://tagmanager.googleapis.com/tagmanager/v2'

async function gtmGet(path: string, accessToken: string) {
  const res = await fetch(`${GTM_API}/${path}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    if (res.status === 403) throw new Error('Permissão insuficiente para GTM. Reconecte com escopo tagmanager.readonly.')
    throw new Error(`GTM: ${data.error?.message || `HTTP ${res.status}`}`)
  }
  return data
}

interface TagAuditResult {
  id:          string
  name:        string
  type:        string
  status:      'ok' | 'warning' | 'error'
  paused:      boolean
  hasTrigger:  boolean
  issues:      string[]
}

interface ChecklistItem {
  id:      string
  name:    string
  status:  'ok' | 'missing' | 'warning'
  message: string
}

const TAG_TYPE_LABELS: Record<string, string> = {
  'ua':          'Universal Analytics',
  'googtag':     'GA4 (Google Tag)',
  'gaawc':       'GA4 Event',
  'awct':        'Google Ads Conversion',
  'sp':          'Google Ads Remarketing',
  'fls':         'Floodlight Sales',
  'flc':         'Floodlight Counter',
  'html':        'HTML Customizado',
  'img':         'Imagem Pixel',
  'mTag':        'Monitoramento de Formulário',
}

function buildChecklist(tags: any[]): ChecklistItem[] {
  const tagTypes = tags.map(t => (t.type || '').toLowerCase())

  const hasGA4         = tagTypes.some(t => t.includes('googtag') || t.includes('gaawc') || t.includes('ga4'))
  const hasGAdsConv    = tagTypes.some(t => t.includes('awct'))
  const hasRemarketing = tagTypes.some(t => t.includes('sp') || t.includes('remarketing'))
  const hasUA          = tagTypes.some(t => t === 'ua')
  const hasMeta        = tags.some(t => (t.name || '').toLowerCase().includes('meta') || (t.name || '').toLowerCase().includes('facebook') || (t.name || '').toLowerCase().includes('pixel'))

  return [
    {
      id: 'ga4',
      name: 'GA4 Tag Configurada',
      status: hasGA4 ? 'ok' : 'missing',
      message: hasGA4 ? 'GA4 encontrado — dados de comportamento sendo coletados.' : 'GA4 ausente — você está perdendo dados críticos de comportamento e conversão.',
    },
    {
      id: 'google_ads_conversion',
      name: 'Tag de Conversão Google Ads',
      status: hasGAdsConv ? 'ok' : 'missing',
      message: hasGAdsConv ? 'Tag de conversão Google Ads encontrada.' : 'Tag de conversão ausente — o Google Ads não consegue otimizar para conversões reais.',
    },
    {
      id: 'remarketing',
      name: 'Tag de Remarketing',
      status: hasRemarketing ? 'ok' : 'warning',
      message: hasRemarketing ? 'Remarketing configurado.' : 'Remarketing não encontrado — você está perdendo visitantes qualificados.',
    },
    {
      id: 'meta_pixel',
      name: 'Meta Pixel',
      status: hasMeta ? 'ok' : 'warning',
      message: hasMeta ? 'Meta Pixel detectado.' : 'Meta Pixel não encontrado — verifique se está implementado fora do GTM.',
    },
    {
      id: 'ua_deprecated',
      name: 'Universal Analytics (descontinuado)',
      status: hasUA ? 'warning' : 'ok',
      message: hasUA ? 'UA ainda ativo — o UA foi descontinuado. Migre completamente para GA4.' : 'Sem UA — ok.',
    },
  ]
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const accountId   = body.accountId   as string | undefined
  const containerId = body.containerId as string | undefined

  if (!accountId || !containerId) {
    return NextResponse.json({
      success: false,
      error: 'accountId e containerId do GTM são obrigatórios. Encontre em tagmanager.google.com → Admin.',
      code: 'MISSING_GTM_IDS',
    }, { status: 400 })
  }

  let accessToken: string
  try {
    const token = await getValidGoogleToken(userId)
    accessToken = token.accessToken
  } catch (err) {
    const { error, code } = tokenErrorToResponse(err)
    return NextResponse.json({ success: false, error, code }, { status: 401 })
  }

  try {
    // Workspaces, tags, triggers, variáveis
    const [workspacesData, tagsData, triggersData, variablesData] = await Promise.allSettled([
      gtmGet(`accounts/${accountId}/containers/${containerId}/workspaces`, accessToken),
      gtmGet(`accounts/${accountId}/containers/${containerId}/workspaces/1/tags`, accessToken),
      gtmGet(`accounts/${accountId}/containers/${containerId}/workspaces/1/triggers`, accessToken),
      gtmGet(`accounts/${accountId}/containers/${containerId}/workspaces/1/variables`, accessToken),
    ])

    const workspaces = workspacesData.status === 'fulfilled' ? workspacesData.value.workspace || [] : []
    const rawTags    = tagsData.status     === 'fulfilled' ? tagsData.value.tag     || [] : []
    const triggers   = triggersData.status === 'fulfilled' ? triggersData.value.trigger  || [] : []
    const variables  = variablesData.status=== 'fulfilled' ? variablesData.value.variable|| [] : []

    const triggerIds = new Set(triggers.map((t: any) => t.triggerId))

    // Auditoria de cada tag
    const auditedTags: TagAuditResult[] = rawTags.map((tag: any) => {
      const tagTriggerIds = (tag.firingTriggerId || [])
      const hasTrigger    = tagTriggerIds.length > 0 && tagTriggerIds.some((id: string) => triggerIds.has(id))
      const paused        = tag.paused === true
      const issues: string[] = []

      if (!hasTrigger) issues.push('Sem trigger configurado — a tag nunca dispara')
      if (paused)      issues.push('Tag pausada — não está coletando dados')
      if ((tag.type || '') === 'ua') issues.push('Universal Analytics descontinuado — migre para GA4')

      // Tag de conversão sem valor configurado
      if ((tag.type || '').includes('awct')) {
        const hasValue = tag.parameter?.some((p: any) => p.key === 'conversionValue' && p.value !== '0')
        if (!hasValue) issues.push('Tag de conversão sem valor — otimização de ROAS ficará imprecisa')
      }

      return {
        id:         tag.tagId,
        name:       tag.name,
        type:       TAG_TYPE_LABELS[tag.type] || tag.type,
        status:     issues.length > 0 ? (paused || !hasTrigger ? 'error' : 'warning') : 'ok',
        paused,
        hasTrigger,
        issues,
      }
    })

    // Detectar tags duplicadas
    const tagNames   = auditedTags.map(t => t.name.toLowerCase())
    const duplicates = auditedTags.filter((t, i) =>
      tagNames.findIndex(n => n === t.name.toLowerCase()) !== i
    ).map(t => t.name)

    const checklist = buildChecklist(rawTags)

    const summary = {
      totalTags:    rawTags.length,
      totalTriggers:triggers.length,
      totalVars:    variables.length,
      tagsOk:       auditedTags.filter(t => t.status === 'ok').length,
      tagsWarning:  auditedTags.filter(t => t.status === 'warning').length,
      tagsError:    auditedTags.filter(t => t.status === 'error').length,
      tagsPaused:   auditedTags.filter(t => t.paused).length,
      tagsNoTrigger:auditedTags.filter(t => !t.hasTrigger).length,
      duplicates:   duplicates.length > 0 ? duplicates : [],
      checklistScore: Math.round(
        checklist.filter(c => c.status === 'ok').length / checklist.length * 100
      ),
    }

    return NextResponse.json({
      success: true,
      workspaces: workspaces.map((w: any) => ({ id: w.workspaceId, name: w.name })),
      tags:       auditedTags,
      triggers:   triggers.map((t: any) => ({ id: t.triggerId, name: t.name, type: t.type })),
      variables:  variables.map((v: any) => ({ id: v.variableId, name: v.name, type: v.type })),
      checklist,
      summary,
    })
  } catch (err: any) {
    const status = err.message.includes('Permissão') ? 403 : 500
    return NextResponse.json({ success: false, error: err.message }, { status })
  }
}
