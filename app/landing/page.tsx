// app/landing/page.tsx — Landing "Clarity" (PR 6). Portada de ELYON LP Clarity.html (1:1),
// mesmos tokens do dashboard. CSS injetado, body via markup, JS (partículas/contadores/
// rotação/ROI/benchmark) executado no cliente. CTAs apontam para as rotas reais.
'use client'

import { useEffect } from 'react'
import { LANDING_CSS, LANDING_BODY, LANDING_SCRIPT } from './clarityContent'

export default function LandingPage() {
  useEffect(() => {
    const s = document.createElement('script')
    s.textContent = LANDING_SCRIPT
    document.body.appendChild(s)
    return () => { s.remove() }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: LANDING_BODY }} />
    </>
  )
}
