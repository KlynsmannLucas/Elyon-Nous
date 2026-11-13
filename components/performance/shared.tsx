'use client'
import type { ReactNode } from 'react'
import { Card, Badge } from '@/components/dashboard/v2'
export const money = (value: any) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 2,
      }).format(Number(value))
export const count = (value: any) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(
        Number(value),
      )
export const percent = (value: any) =>
  value === null || value === undefined ? '—' : `${count(Number(value) * 100)}%`
export const day = (value: string) =>
  value
    ? new Date(value + 'T12:00:00Z').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
    : '—'
export const timestamp = (value: string) =>
  value
    ? new Date(value).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
export const inputClass =
  'border border-line rounded-lg bg-paper px-3 py-2 text-sm text-ink min-w-0 outline-none focus:border-blue'
export function MetricCard({
  label,
  value,
  note,
  change,
}: {
  label: string
  value: ReactNode
  note?: string
  change?: number | null
}) {
  return (
    <Card className="h-full">
      <p className="text-xs font-semibold text-ink-2">{label}</p>
      <p className="text-2xl md:text-[28px] font-semibold text-ink tracking-tight mt-2 break-words">
        {value}
      </p>
      <div className="mt-2 text-xs text-ink-2 leading-relaxed">
        {change !== undefined && change !== null && (
          <span className="font-mono mr-2">
            {change > 0 ? '+' : ''}
            {percent(change)} vs. anterior
          </span>
        )}
        {note}
      </div>
    </Card>
  )
}
export function Notice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'warn' | 'bad'
}) {
  return (
    <div
      role={tone === 'bad' ? 'alert' : undefined}
      className={`rounded-lg border p-4 text-sm leading-relaxed ${tone === 'bad' ? 'border-red-200 bg-red-50 text-red-800' : tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-line bg-canvas-2 text-ink-2'}`}
    >
      {children}
    </div>
  )
}
export function SectionTitle({
  title,
  detail,
  action,
}: {
  title: string
  detail?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {detail && (
          <p className="text-xs text-ink-2 mt-1 max-w-3xl leading-relaxed">
            {detail}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
export function Pending({
  children = 'Consultando as fontes deste cliente…',
}: {
  children?: ReactNode
}) {
  return (
    <div
      role="status"
      className="p-8 rounded-xl border border-line bg-paper text-sm text-ink-2 flex gap-3 items-center"
    >
      <span className="w-3 h-3 rounded-full bg-blue animate-pulse" />
      {children}
    </div>
  )
}
export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: { key: string; label: string; render?: (row: any) => ReactNode }[]
  rows: any[]
  caption: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className="py-3 px-3 first:pl-0 text-xs font-semibold text-ink-2 whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id || row.label || index}
              className="border-b border-line last:border-0"
            >
              {columns.map((c, i) =>
                i === 0 ? (
                  <th
                    scope="row"
                    key={c.key}
                    className="py-3 pr-3 text-sm font-medium text-ink min-w-[150px] max-w-sm break-words"
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </th>
                ) : (
                  <td
                    key={c.key}
                    className="p-3 text-ink-2 tabular-nums whitespace-nowrap"
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export function DeltaBadge({ value }: { value: number | null }) {
  return value === null ? null : (
    <Badge tone="neutral">
      {value > 0 ? '+' : ''}
      {percent(value)}
    </Badge>
  )
}
export function EmptyPanel({
  title,
  detail,
}: {
  title: string
  detail: string
}) {
  return (
    <Card>
      <div className="text-center p-8">
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-2 mt-2 max-w-lg mx-auto">{detail}</p>
      </div>
    </Card>
  )
}
