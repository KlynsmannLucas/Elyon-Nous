// app/(elyon)/financeiro/page.tsx — Painel financeiro (honorários da agência) no v2.
'use client'

import { useEffect, useState } from 'react'
import { TabFinanceiro } from '@/components/dashboard/TabFinanceiro'

export default function FinanceiroPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return <div className="p-4 md:p-6"><TabFinanceiro /></div>
}
