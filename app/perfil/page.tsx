import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const PerfilPageInner = dynamic(
  () => import('./PerfilPageInner'),
  { ssr: false }
)

export default function PerfilPage() {
  return (
    <Suspense>
      <PerfilPageInner />
    </Suspense>
  )
}
