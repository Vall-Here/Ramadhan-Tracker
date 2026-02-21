import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[--primary]/10 via-[--background] to-[--background] flex flex-col items-center justify-center p-5 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-[--primary] flex items-center justify-center shadow-lg shadow-[--primary]/25">
          <Moon size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[--foreground]">Ramadhan Tracker</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Asisten ibadah harian kamu</p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Masuk</CardTitle>
          <CardDescription>Masuk ke akun kamu untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-[--destructive]/10 border border-[--destructive]/20 px-4 py-3 text-sm text-[--destructive]">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[--primary] hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? 'Memuat...' : 'Masuk'}
            </Button>
          </form>
          <p className="text-center text-sm text-[--muted-foreground] mt-5">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[--primary] font-semibold hover:underline">
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
