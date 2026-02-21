import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Lazy-load pages for code splitting
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const TrackerPage = lazy(() => import('@/pages/TrackerPage'))
const InsightsPage = lazy(() => import('@/pages/InsightsPage'))
const HistoryPage = lazy(() => import('@/pages/HistoryPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const QuranPage = lazy(() => import('@/pages/QuranPage'))
const ImsakiyahPage = lazy(() => import('@/pages/ImsakiyahPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[--background]">
      <div className="w-10 h-10 rounded-full border-4 border-[--primary] border-t-transparent animate-spin" />
    </div>
  )
}

function AuthListener() {
  const { setSession } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthListener />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/tracker" element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
            <Route path="/quran" element={<ProtectedRoute><QuranPage /></ProtectedRoute>} />
            <Route path="/imsakiyah" element={<ProtectedRoute><ImsakiyahPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
