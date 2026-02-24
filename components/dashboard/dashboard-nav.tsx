'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  BarChart3,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Settings,
  Menu,
  X,
  PieChart,
  Activity,
  AlertCircle,
  FileText,
  Home,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: TrendingUp,
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    label: 'Inventory',
    href: '/dashboard/inventory',
    icon: ShoppingCart,
  },
  {
    label: 'Sales',
    href: '/dashboard/sales',
    icon: BarChart3,
  },
]

const analyticsItems = [
  {
    label: 'Profit Analytics',
    href: '/dashboard/analytics/profit',
    icon: PieChart,
  },
  {
    label: 'Top Performers',
    href: '/dashboard/analytics/performers',
    icon: Activity,
  },
  {
    label: 'Stock Alerts',
    href: '/dashboard/analytics/stock-alerts',
    icon: AlertCircle,
  },
  {
    label: 'Weekly Report',
    href: '/dashboard/analytics/weekly-report',
    icon: FileText,
  },
]

const settingsItems = [
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-sidebar-foreground">ProfitBox</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-sidebar-accent rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-sidebar-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-sidebar-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="border-t border-sidebar-border px-4 py-2 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            
            {/* Analytics Section */}
            <div className="pt-2 border-t border-sidebar-border">
              <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase">Analytics</p>
              {analyticsItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2 text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {settingsItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <Button
              onClick={() => {
                handleLogout()
                setIsOpen(false)
              }}
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            ProfitBox
          </h1>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
          
          {/* Analytics Section */}
          <div className="pt-4 border-t border-sidebar-border">
            <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase">Analytics</p>
            {analyticsItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Theme Toggle and Logout */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </nav>
    </>
  )
}

