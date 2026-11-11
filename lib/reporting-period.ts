export interface ReportingPeriod {
  startDate: string
  endDate: string
  timezone: string
  includesToday: boolean
}

const DAY = 86_400_000
const dateKey = (date: Date) => date.toISOString().slice(0, 10)
const shift = (date: string, days: number) => dateKey(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY))

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && dateKey(new Date(`${value}T00:00:00Z`)) === value
}

/** All providers receive the same inclusive calendar dates, never different presets. */
export function resolveReportingPeriod(
  input: { datePreset?: string; startDate?: string; endDate?: string },
  now = new Date(),
  timezone = 'America/Sao_Paulo',
): ReportingPeriod {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  const today = `${part('year')}-${part('month')}-${part('day')}`
  let startDate: string
  let endDate: string
  if (input.startDate !== undefined || input.endDate !== undefined) {
    if (!validDate(input.startDate) || !validDate(input.endDate)) throw new Error('Informe as duas datas válidas no formato AAAA-MM-DD.')
    startDate = input.startDate
    endDate = input.endDate
  } else {
    const preset = input.datePreset || 'last_30d'
    const days = /^last_(7|14|30|90)d$/.exec(preset)
    if (days) {
      endDate = shift(today, -1)
      startDate = shift(endDate, 1 - Number(days[1]))
    } else if (preset === 'today' || preset === 'yesterday') {
      startDate = endDate = preset === 'today' ? today : shift(today, -1)
    } else if (preset === 'this_month') {
      startDate = `${today.slice(0, 7)}-01`
      endDate = today
    } else if (preset === 'last_month') {
      endDate = shift(`${today.slice(0, 7)}-01`, -1)
      startDate = `${endDate.slice(0, 7)}-01`
    } else throw new Error('Período de análise inválido.')
  }
  if (endDate < startDate || endDate > today || (Date.parse(endDate) - Date.parse(startDate)) / DAY >= 366) {
    throw new Error('Escolha um período de até 366 dias, sem datas futuras.')
  }
  return { startDate, endDate, timezone, includesToday: endDate === today }
}

export function previousReportingPeriod(period: ReportingPeriod): ReportingPeriod {
  const days = (Date.parse(period.endDate) - Date.parse(period.startDate)) / DAY + 1
  return { ...period, startDate: shift(period.startDate, -days), endDate: shift(period.startDate, -1), includesToday: false }
}
