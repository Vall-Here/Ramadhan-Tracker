import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, BookOpen, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Beranda' },
  { to: '/tracker', icon: CheckSquare, label: 'Tracker' },
  { to: '/quran', icon: BookOpen, label: 'Al-Qur\'an' },
  { to: '/history', icon: Clock, label: 'Riwayat' },
  { to: '/profile', icon: User, label: 'Profil' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[--border] bg-[--card]/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-[--primary]'
                  : 'text-[--muted-foreground] hover:text-[--foreground]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'p-1.5 rounded-xl transition-all duration-200',
                    isActive && 'bg-[--secondary]'
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
