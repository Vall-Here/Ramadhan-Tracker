import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[--primary]/10 to-[--background] flex flex-col items-center justify-center p-5 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-[--primary] flex items-center justify-center shadow-lg shadow-[--primary]/25">
          <Moon size={32} className="text-white" />
        </div>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>
            {sent
              ? 'Cek inbox email kamu untuk link reset password.'
              : 'Masukkan email dan kami kirimkan link reset.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <span className="text-4xl">📧</span>
              <p className="mt-3 text-sm text-[--muted-foreground]">
                Email dikirim ke <strong>{email}</strong>
              </p>
            </div>
          )}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 mt-5 text-sm text-[--muted-foreground] hover:text-[--foreground]"
          >
            <ArrowLeft size={16} />
            Kembali ke halaman masuk
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
