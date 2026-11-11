'use client'

import { useEffect, useState } from 'react'
import { Card, Badge, Button } from '@/components/dashboard/v2'

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o Reportei.')
  return result
}

const platformLabel: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads', kommo: 'Kommo' }

export default function ReporteiIntegrationCard({ clientId, clientName }: { clientId?: string; clientName: string }) {
  const [connection, setConnection] = useState<any>(null)
  const [token, setToken] = useState('')
  const [editing, setEditing] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [integrations, setIntegrations] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [link, setLink] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api('/api/reportei/connection', { signal: controller.signal }).then(setConnection)
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!connection?.connected) return
    const controller = new AbortController()
    const signal = controller.signal
    Promise.all([api('/api/reportei/projects', { signal }), clientId
      ? api(`/api/reportei/client?clientId=${encodeURIComponent(clientId)}`, { signal }) : Promise.resolve({ link: null })])
      .then(([result, current]) => {
        if (signal.aborted) return
        setProjects(result.projects)
        setLink(current.link)
        setProjectId(current.link ? String(current.link.project_id) : result.projects.length === 1 ? String(result.projects[0].id) : '')
      }).catch(error => { if (!signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [connection?.connected, connection?.connectedAt, clientId])

  useEffect(() => {
    if (!projectId || !connection?.connected) { setIntegrations([]); setSelected([]); return }
    const controller = new AbortController()
    setLoadingIntegrations(true)
    setIntegrations([])
    setSelected([])
    api(`/api/reportei/projects?projectId=${encodeURIComponent(projectId)}`, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return
        setIntegrations(result.integrations)
        const linkedIds = link && String(link.project_id) === projectId ? link.integration_ids : null
        setSelected(linkedIds || result.integrations.filter((row: any) => row.status === 'active').map((row: any) => row.id))
      }).catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoadingIntegrations(false) })
    return () => controller.abort()
  }, [projectId, connection?.connected, link])

  const connect = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await api('/api/reportei/connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      setConnection(result); setEditing(false); setNotice('Conta validada. Agora vincule o projeto ao cliente abaixo.')
    } catch (error: any) { setError(error.message) }
    finally { setToken(''); setBusy(false) }
  }
  const saveLink = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await api('/api/reportei/client', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, projectId: Number(projectId), integrationIds: selected }) })
      setLink(result.link); setNotice('Projeto vinculado. Consulte os dados em Desempenho → Contatos e vendas.')
    } catch (error: any) { setError(error.message) }
    finally { setBusy(false) }
  }
  const disconnect = async () => {
    if (!window.confirm('Desconectar o Reportei deste usuário? Os vínculos com projetos e o histórico importado do Reportei serão removidos. Meta e Google Ads continuam conectados.')) return
    setBusy(true); setError(''); setNotice('')
    try {
      await api('/api/reportei/connection', { method: 'DELETE' })
      setConnection({ connected: false }); setLink(null); setProjects([]); setProjectId(''); setToken('')
    } catch (error: any) { setError(error.message) }
    finally { setBusy(false) }
  }

  return <Card className="mt-4">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="font-semibold text-ink">Reportei</h2>
        <p className="text-sm text-ink-2 mt-1 max-w-2xl">Complete a leitura dos anúncios com conversas, novos contatos, cadastros e negócios do CRM. Cada informação mantém sua origem.</p>
      </div>
      <Badge tone={connection?.connected ? 'good' : 'neutral'}>{connection?.connected ? 'Conectado' : 'Não conectado'}</Badge>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-green-800">{notice}</p>}
    {(!connection?.connected || editing) && <form onSubmit={connect} className="mt-4 space-y-3 max-w-xl">
      <p className="text-xs text-ink-2">No Reportei, acesse Configurações da empresa → API Reportei e gere seu token. <a className="text-blue underline" href="https://developers.reportei.com/#authentication" target="_blank" rel="noreferrer">Ver instruções</a></p>
      <label className="block text-sm font-medium text-ink" htmlFor="reportei-token">Token da API Reportei</label>
      <input id="reportei-token" type="password" autoComplete="off" spellCheck={false} value={token} onChange={event => setToken(event.target.value)}
        className="w-full border border-line rounded-sm p-2.5 bg-paper text-ink" required maxLength={4096} placeholder="Cole seu token para conectar" />
      <p className="text-xs text-ink-3">O token fica protegido na sua conta e não é salvo no navegador.</p>
      <Button size="sm" disabled={busy || !token.trim()}>{busy ? 'Validando…' : 'Conectar Reportei ao Nous'}</Button>
    </form>}
    {connection?.connected && <div className="mt-4 space-y-3">
      <p className="text-xs text-ink-3">Empresa no Reportei: {connection.companyName}</p>
      <div className="border-t border-line pt-3">
        <h3 className="text-sm font-semibold text-ink">Projeto para {clientName || 'este cliente'}</h3>
        {!clientId ? <p className="text-sm text-ink-2 mt-2">Salve e selecione um cliente no Nous para vincular o projeto.</p> : <>
          {link && <p className="mt-1 text-xs text-green-800">Vínculo atual: {link.project_name}</p>}
          <label className="block mt-3 text-xs text-ink-2" htmlFor="reportei-project">Projeto do Reportei</label>
          <select id="reportei-project" value={projectId} onChange={event => { setProjectId(event.target.value); setNotice(''); setError('') }}
            className="mt-1 w-full max-w-xl border border-line rounded-sm p-2.5 bg-paper text-ink text-sm">
            <option value="">Selecione um projeto</option>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name} · #{project.id}</option>)}
          </select>
          {loadingIntegrations && <p role="status" className="mt-2 text-xs text-ink-3">Consultando as integrações do projeto…</p>}
          <fieldset className="mt-3 space-y-2" disabled={busy || loadingIntegrations}>
            <legend className="text-xs text-ink-2 mb-2">Contas que complementarão este cliente</legend>
            {integrations.map(integration => <label key={integration.id} className="flex gap-2 items-start text-sm text-ink">
              <input type="checkbox" checked={selected.includes(integration.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, integration.id] : previous.filter(id => id !== integration.id))} className="mt-0.5" />
              <span>{platformLabel[integration.platform]} · {integration.name}<span className="block text-xs text-ink-3">{integration.accountId ? `Conta ${integration.accountId} · ` : ''}Integração #{integration.id} · {integration.status === 'active' ? 'Ativa' : 'Inativa'}</span></span>
            </label>)}
          </fieldset>
          <div className="mt-3"><Button size="sm" disabled={busy || loadingIntegrations || !projectId || !selected.length} onClick={saveLink}>{busy ? 'Salvando…' : 'Salvar vínculo com este cliente'}</Button></div>
        </>}
      </div>
      <div className="border-t border-line pt-3 flex gap-2">
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setEditing(!editing); setToken('') }}>{editing ? 'Cancelar' : 'Atualizar token'}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={disconnect}>Desconectar Reportei</Button>
      </div>
    </div>}
  </Card>
}
