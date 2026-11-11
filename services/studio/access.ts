import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export class StudioError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message)
  }
}
export const studioDb = () => {
  if (!supabaseAdmin) throw new StudioError('O Estúdio está temporariamente indisponível.')
  return supabaseAdmin
}
export async function studioIdentity() {
  const { userId } = await auth()
  if (!userId) throw new StudioError('Entre na sua conta para usar o Estúdio.', 401)
  return userId
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin)
    throw new StudioError('Origem da solicitação inválida.', 403)
}
export async function studioClient(userId: string, clientId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(clientId))
    throw new StudioError('Salve e selecione um cliente para continuar.', 400)
  const { data, error } = await studioDb()
    .from('clients')
    .select('id,user_id,client_data,extra_data,strategy_data,audit_data')
    .eq('id', clientId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new StudioError('Não foi possível carregar o cliente.')
  if (!data) throw new StudioError('Cliente não encontrado nesta conta.', 404)
  return data
}
export async function studioJob(userId: string, jobId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(jobId)) throw new StudioError('Criação inválida.', 400)
  const { data, error } = await studioDb()
    .from('studio_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new StudioError('Não foi possível ler esta criação.')
  if (!data) throw new StudioError('Criação não encontrada nesta conta.', 404)
  await studioClient(userId, data.client_id)
  return data
}
export function studioFailure(error: unknown) {
  return Response.json(
    {
      success: false,
      error: error instanceof StudioError ? error.message : 'Não foi possível concluir. Tente novamente.',
    },
    {
      status: error instanceof StudioError ? error.status : 503,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}
export const studioResponse = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
