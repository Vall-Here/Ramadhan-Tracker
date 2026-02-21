import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface Props {
  children: ReactNode
  hidePadding?: boolean
}

export function AppLayout({ children, hidePadding = false }: Props) {
  return (
    <div className="min-h-screen bg-[--background] max-w-md mx-auto relative">
      <main
        className={hidePadding ? '' : 'safe-bottom'}
        style={{ minHeight: '100dvh' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
