import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function translateAuthError(message: string): string {
    if (/over_email_send_rate_limit|rate.?limit|too many/i.test(message)) {
      return 'Terlalu banyak percobaan pendaftaran. Coba lagi beberapa menit lagi.'
    }
    if (/user already registered|already been registered/i.test(message)) {
      return 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.'
    }
    if (/invalid email/i.test(message)) {
      return 'Format email tidak valid.'
    }
    if (/password.*short|should be at least/i.test(message)) {
      return 'Password terlalu pendek. Minimal 8 karakter.'
    }
    return message
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(translateAuthError(error.message))
    } else if (data.session) {
      // Email confirmation dimatikan di Supabase — langsung masuk
      navigate('/')
    } else {
      // Email confirmation aktif — minta user cek email
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 max-w-md mx-auto text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <span className="text-3xl">✨</span>
        </div>
        <h2 className="text-xl font-bold">Akun berhasil dibuat!</h2>
        <p className="text-sm text-[--muted-foreground]">
          Cek email kamu untuk konfirmasi, lalu masuk ke aplikasi.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[--primary]/10 via-[--background] to-[--background] flex flex-col items-center justify-center p-5 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-[--primary] flex items-center justify-center shadow-lg shadow-[--primary]/25">
          <Moon size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Ramadhan Tracker</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Mulai Ramadhan terbaik kamu</p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Buat Akun</CardTitle>
          <CardDescription>Daftar gratis, mulai track ibadah</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl bg-[--destructive]/10 border border-[--destructive]/20 px-4 py-3 text-sm text-[--destructive]">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
              {loading ? 'Mendaftar...' : 'Buat Akun'}
            </Button>
          </form>
          <p className="text-center text-sm text-[--muted-foreground] mt-5">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[--primary] font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
