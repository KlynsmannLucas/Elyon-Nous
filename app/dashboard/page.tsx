// O dashboard antigo (tema escuro) foi descontinuado. Tudo migrou para o
// Redesign v2 (tema claro). Qualquer acesso a /dashboard cai no novo /hoje.
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/hoje')
}
