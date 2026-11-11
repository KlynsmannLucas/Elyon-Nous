'use client'
import { useEffect, useState } from 'react'
import { Card, Button, Badge } from '@/components/dashboard/v2'

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/admin/reportei${path}`, {
    cache: 'no-store',
    ...(body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir.')
  return data
}
export default function InternalIntegrations() {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false)
  const [token, setToken] = useState(''),
    [projects, setProjects] = useState<any[]>([]),
    [integrations, setIntegrations] = useState<any[]>([])
  const [clientId, setClientId] = useState(''),
    [projectId, setProjectId] = useState(''),
    [ids, setIds] = useState<number[]>([])
  const reload = () => api('').then(setData)
  useEffect(() => {
    let active = true
    api('')
      .then((value) => {
        if (active) setData(value)
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!data?.configured) return
    let active = true
    api('?projects=1')
      .then((result) => {
        if (active) setProjects(result.rows)
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
    return () => {
      active = false
    }
  }, [data?.configured])
  useEffect(() => {
    setIds([])
    setIntegrations([])
    if (!projectId) return
    let active = true
    api(`?projects=1&projectId=${projectId}`)
      .then((result) => {
        if (active) setIntegrations(result.rows)
      })
      .catch((error) => {
        if (active) setError(error.message)
      })
    return () => {
      active = false
    }
  }, [projectId])
  const act = async (body: unknown) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api('', body)
      setNotice('Configuração interna salva.')
      await reload()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setToken('')
      setBusy(false)
    }
  }
  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold text-ink">Integrações internas</h1>
      <p className="text-sm text-ink-2">
        Área exclusiva da administração. Os clientes do Nous não configuram o Reportei.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-green-800">
          {notice}
        </p>
      )}
      {data?.administrator && (
        <>
          <Card>
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">Reportei · serviço do Nous</h2>
              <Badge tone={data.configured ? 'good' : 'warn'}>
                {data.configured ? 'Configurado' : 'Aguardando autorização administrativa'}
              </Badge>
            </div>
            {data.companyName && <p className="text-sm mt-2">Empresa: {data.companyName}</p>}
            <p className="text-sm text-ink-2 mt-2">
              A credencial é configurada uma vez pela operação e usada apenas no servidor. Acesso a CRM exige
              vínculo administrativo explícito.
            </p>
            <form
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                act({ action: 'configure', token })
              }}
            >
              <label htmlFor="internal-reportei-token" className="block text-sm font-medium">
                Credencial de serviço
              </label>
              <input
                id="internal-reportei-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                maxLength={4096}
                className="p-2 border border-line rounded-sm w-full"
                placeholder="Token da API Reportei da administração"
              />
              <Button size="sm" disabled={busy || !token.trim()}>
                Validar e salvar no servidor
              </Button>
            </form>
            {data.canAdoptOwnConnection && (
              <Button
                className="mt-3"
                variant="soft"
                size="sm"
                disabled={busy}
                onClick={() => act({ action: 'adopt' })}
              >
                Reutilizar minha conexão administrativa existente
              </Button>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Autorizar dados por cliente</h2>
            <p className="text-sm text-ink-2 mt-1">
              A associação automática libera somente contas de anúncios cujo acesso foi verificado. Use este
              vínculo para autorizar também dados comerciais do projeto.
            </p>
            <label htmlFor="internal-client" className="block text-xs mt-4">
              Cliente do Nous
            </label>
            <select
              id="internal-client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="border border-line p-2 w-full mt-1 rounded-sm"
            >
              <option value="">Selecione</option>
              {data.clients?.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name} · {client.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <label htmlFor="internal-project" className="block text-xs mt-3">
              Projeto Reportei
            </label>
            <select
              id="internal-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="border border-line p-2 w-full mt-1 rounded-sm"
            >
              <option value="">Selecione</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} · {project.id}
                </option>
              ))}
            </select>
            <fieldset className="mt-3 space-y-2">
              <legend className="text-xs mb-2">Fontes autorizadas para este cliente</legend>
              {integrations.map((source) => (
                <label key={source.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ids.includes(source.id)}
                    onChange={(event) =>
                      setIds((previous) =>
                        event.target.checked
                          ? [...previous, source.id]
                          : previous.filter((id) => id !== source.id),
                      )
                    }
                  />
                  <span>
                    {source.name} · {source.slug} · #{source.id}
                  </span>
                </label>
              ))}
            </fieldset>
            <Button
              className="mt-4"
              disabled={busy || !clientId || !projectId || !ids.length}
              onClick={() =>
                act({ action: 'link', clientId, projectId: Number(projectId), integrationIds: ids })
              }
            >
              Autorizar vínculo interno
            </Button>
            <div className="mt-4 space-y-2">
              {data.links?.map((link: any) => (
                <p key={link.client_id} className="text-xs text-ink-3">
                  {data.clients?.find((client: any) => client.id === link.client_id)?.name || link.client_id}{' '}
                  → {link.project_name} · {link.integration_ids.length} fontes
                </p>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
