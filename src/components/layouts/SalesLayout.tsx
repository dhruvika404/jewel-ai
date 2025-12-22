import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Gem, LayoutDashboard, Target, CheckCircle, TrendingUp, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmationModal from '@/components/modals/ConfirmationModal'

interface SalesLayoutProps {
  children: React.ReactNode
}

export default function SalesLayout({ children }: SalesLayoutProps) {
  const { logout, user } = useAuth()
  const location = useLocation()
  const [isSidebar, setIsSidebar] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const sideBarref = useRef<HTMLDivElement>(null)

  const menuItems = [
    { label: 'Dashboard', href: '/sales', icon: LayoutDashboard },
    // { label: 'My Leads', href: '/sales/leads', icon: Target },
    { label: 'Followups', href: '/sales/followups', icon: CheckCircle },
  ]

  const isActive = (href: string) => {
    if (href === '/sales') {
      return location.pathname === '/sales'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="max-h-screen min-h-screen bg-background flex">
      <div
        ref={sideBarref}
        className={cn(
          "fixed lg:static top-0 left-0 h-full z-50",
          "w-64 bg-card border-r border-border overflow-hidden",
          "transition-transform duration-300 ease-in-out",
          isSidebar ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="w-full h-screen flex flex-col">
          <div className="p-3 border-b border-border min-h-16">
            <Link to="/sales" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
                <Gem className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">Jewel AI</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setIsSidebar(false)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="p-2 border-t border-border">
            <button
              className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full rounded-md hover:bg-muted"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        modalTitle="Are you sure you want to sign out?"
        submitButtonText="Sign out"
        cancelButtonText="Cancel"
        title="You will need to sign in again to access your account."
        onClose={() => setShowLogoutConfirm(false)}
        isOpen={showLogoutConfirm}
        onConfirm={logout}
      />

      {isSidebar && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebar(false)}
        />
      )}

      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-30 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebar((prev) => !prev)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-foreground"></div>
              <div className="w-full h-0.5 bg-foreground"></div>
              <div className="w-full h-0.5 bg-foreground"></div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Gem className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-foreground">Jewel AI</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-16 lg:pt-0 overflow-y-auto h-screen">
        {children}
      </div>
    </div>
  )
}
