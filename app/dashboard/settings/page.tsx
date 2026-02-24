'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  user_metadata: Record<string, any>
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          user_metadata: authUser.user_metadata || {},
        })
      }
      setLoading(false)
    }

    loadUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    // In a real app, you'd call an API to delete the account
    alert('Account deletion would be handled by a backend function')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Manage your account and preferences</p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
          <CardDescription className="text-sm">View your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-muted-foreground">Email Address</label>
            <p className="text-base sm:text-lg text-foreground mt-1">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-muted-foreground">User ID</label>
            <p className="text-xs sm:text-sm text-foreground mt-1 font-mono break-all">{user?.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Control your active sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are currently logged in. Sign out to end your session.
          </p>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>Your data is organized in these tables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-secondary rounded">
              <span className="font-mono">products</span>
              <span className="text-muted-foreground">Product catalog</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary rounded">
              <span className="font-mono">stock_batches</span>
              <span className="text-muted-foreground">Inventory tracking</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary rounded">
              <span className="font-mono">daily_sales</span>
              <span className="text-muted-foreground">Sales records</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary rounded">
              <span className="font-mono">csv_imports</span>
              <span className="text-muted-foreground">Import history</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deleting your account will permanently remove all your data and cannot be undone.
          </p>
          <Button onClick={handleDeleteAccount} variant="destructive" disabled>
            Delete Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Resources for getting started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Check out the README.md file in the project root for comprehensive documentation and setup instructions.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-foreground font-medium">Useful links:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>
                <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Supabase Documentation
                </a>
              </li>
              <li>
                <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Next.js Documentation
                </a>
              </li>
              <li>
                <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Shadcn/ui Components
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
