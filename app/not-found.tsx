// app/not-found.tsx — Página 404 customizada (v2 light)
import Link from 'next/link'
import { Button } from '@/components/v2/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-display font-black text-ink mb-2">404</div>
        <h1 className="text-xl font-semibold text-ink mb-3">Página não encontrada</h1>
        <p className="text-ink-2 text-sm mb-6">
          O link que você acessou não existe ou foi removido.
        </p>
        <Link href="/dashboard">
          <Button>Voltar ao dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
