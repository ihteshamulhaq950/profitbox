/**
 * Authentication utility functions for ProfitBox
 * Uses getClaims() for efficient local auth checks (reads from cookies)
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

/**
 * Get auth info from server-side (uses getClaims which reads from cookies)
 * Returns user sub (equivalent to user.id), email, and role
 */
export async function getAuth() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.getClaims()

    if (error || !data) {
      return null
    }

    return {
      sub: data.claims.sub,
      email: data.claims.email,
      role: data.claims.role,
    }
  } catch (error) {
    console.error('Error getting auth claims:', error)
    return null
  }
}

/**
 * Get auth info from client-side (uses getClaims which reads from cookies)
 * Returns user sub (equivalent to user.id), email, and role
 */
export async function getAuthClient() {
  try {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.getClaims()

    if (error || !data) {
      return null
    }

    return {
      sub: data.claims.sub,
      email: data.claims.email,
      role: data.claims.role,
    }
  } catch (error) {
    console.error('Error getting auth claims:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuth()
  return auth !== null
}

/**
 * Check if user is authenticated (client-side)
 */
export async function isAuthenticatedClient(): Promise<boolean> {
  const auth = await getAuthClient()
  return auth !== null
}
