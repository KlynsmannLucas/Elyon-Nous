// lib/manus.ts — Cliente Manus AI (agente autônomo)
// Docs: https://open.manus.ai/docs/v2/authentication

const BASE = 'https://api.manus.ai'

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-manus-api-key': process.env.MANUS_API_KEY || '',
  }
}

export interface ManusTask {
  ok: boolean
  task_id: string
  task_url: string
}

export interface ManusMessage {
  id: string
  type: 'user_message' | 'assistant_message' | 'status_update'
  timestamp: string
  assistant_message?: { content: string }
  status_update?: { agent_status: 'running' | 'waiting' | 'stopped' | 'error'; brief?: string }
}

export interface ManusResult {
  status: 'running' | 'waiting' | 'stopped' | 'error'
  output: string | null   // conteúdo do último assistant_message
  messages: ManusMessage[]
}

export async function manusCreateTask(prompt: string): Promise<ManusTask> {
  const res = await fetch(`${BASE}/v2/task.create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ message: { content: prompt } }),
    signal: AbortSignal.timeout(15000),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error?.message || 'Falha ao criar task no Manus')
  return data as ManusTask
}

export async function manusGetResult(taskId: string): Promise<ManusResult> {
  const res = await fetch(
    `${BASE}/v2/task.listMessages?task_id=${taskId}&order=desc&limit=50`,
    { headers: headers(), signal: AbortSignal.timeout(10000) }
  )
  const data = await res.json()
  if (!data.ok) throw new Error(data.error?.message || 'Falha ao buscar resultado do Manus')

  const messages: ManusMessage[] = data.messages || []

  const statusMsg = messages.find(m => m.type === 'status_update')
  const status = statusMsg?.status_update?.agent_status ?? 'running'

  // Pega o conteúdo do último assistant_message (em ordem desc, é o primeiro encontrado)
  const lastAssistant = messages.find(m => m.type === 'assistant_message')
  const output = lastAssistant?.assistant_message?.content ?? null

  return { status, output, messages }
}
