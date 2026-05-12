// Server Component — renderiza o Client Component DashboardInner
// Padrão correto do App Router: Server wrapper → Client boundary
import DashboardInner from './DashboardInner'

export default function DashboardPage() {
  return <DashboardInner />
}
