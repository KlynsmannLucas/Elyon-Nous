import { auth, clerkClient } from '@clerk/nextjs/server'
import { isAdministrator } from '@/lib/access'

export async function administrator() {
  const { userId } = await auth()
  if (!userId) return { userId: null, allowed: false, status: 401 }
  try {
    const user = await (await clerkClient()).users.getUser(userId)
    return { userId, allowed: isAdministrator(user), status: isAdministrator(user) ? 200 : 403 }
  } catch { return { userId, allowed: false, status: 503 } }
}
