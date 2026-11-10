'use client'
import { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { enforceUserScope, clearUserScopeOnLogout } from '@/lib/userScope'

export function UserScopeBoundary({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const id = user?.id
  const previous = useRef<string | null>(null)
  const [ready, setReady] = useState<string | null>(null)
  useEffect(() => {
    if (!isLoaded) return
    if (!id) { clearUserScopeOnLogout(); setReady(null); return }
    if (previous.current && previous.current !== id) {
      clearUserScopeOnLogout()
      window.location.reload()
      return
    }
    previous.current = id
    enforceUserScope(id)
    setReady(id)
    // Another tab changed identity. Reload to reauthenticate before mounting data consumers.
    const changed = (event: StorageEvent) => {
      if (event.key === 'elyon_active_user' && event.newValue !== id) window.location.reload()
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [isLoaded, id])
  if (!isLoaded || !id || ready !== id) return null
  return <div key={id} className="contents">{children}</div>
}
