// app/page.tsx — Raiz sempre vai para a Landing Page
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/landing')
}
