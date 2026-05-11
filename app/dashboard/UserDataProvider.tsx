'use client'
import { createContext, useContext } from 'react'

export type ServerUserData = {
  id: string
  firstName: string | null
  lastName:  string | null
  email:     string
  plan:      string | null
  createdAt: number
} | null

const Ctx = createContext<ServerUserData>(null)

export function UserDataProvider({ data, children }: { data: ServerUserData; children: React.ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>
}

export function useServerUserData(): ServerUserData {
  return useContext(Ctx)
}
