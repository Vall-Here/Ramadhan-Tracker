import { useState, useEffect } from 'react'
import { LogOut, User, Bell, Shield, ChevronRight, Moon, Sun, X, Eye, EyeOff, Award, Edit3, Target, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn, formatRupiah } from '@/lib/utils'
import type { UserProfile, UserBadge } from '@/types'

// ── Simple bottom sheet modal ────────────────────────────────────────────────
function Sheet({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl max-h-[92dvh] overflow-y-auto"
            style={{ backgroundColor: 'var(--card)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[--muted-foreground]/30" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[--border]">
              <h2 className="font-bold text-lg">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[--muted] flex items-center justify-center hover:bg-[--border] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 pt-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height) + 1.25rem)' }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        enabled ? 'bg-[--primary]' : 'bg-[--muted-foreground]/30'
      )}
    >
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
        enabled ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

// ── Success panel ─────────────────────────────────────────────────────────────
function SuccessPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <Check size={28} className="text-emerald-600" />
      </div>
      <p className="font-semibold">{message}</p>
    </div>
  )
}

// ── Dark mode helpers ─────────────────────────────────────────────────────────
function isDarkMode() { return document.documentElement.classList.contains('dark') }
function applyDarkMode(dark: boolean) {
  if (dark) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setSession, signOut } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [darkMode, setDarkModeState] = useState(isDarkMode)

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editTargetsOpen, setEditTargetsOpen] = useState(false)
  const [changePassOpen, setChangePassOpen] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Load profile + badges
  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', user.id).order('awarded_at', { ascending: false }),
    ]).then(([{ data: prof }, { data: ub }]) => {
      if (prof) setProfile(prof as UserProfile)
      if (ub) setBadges(ub as UserBadge[])
    })
  }, [user])

  const name = user?.user_metadata?.full_name ?? 'Pengguna'
  const email = user?.email ?? ''
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  function handleDarkToggle(val: boolean) {
    setDarkModeState(val)
    applyDarkMode(val)
  }

  async function handleSignOut() {
    setLoggingOut(true)
    await signOut()
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 p-5 pt-6">
        <h1 className="text-xl font-bold">Profil</h1>

        {/* Avatar + info */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[--primary] to-emerald-700 flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">{name}</p>
              <p className="text-sm text-[--muted-foreground] truncate">{email}</p>
              {profile?.city && <p className="text-xs text-[--muted-foreground] mt-0.5">📍 {profile.city}</p>}
              <Badge variant="success" className="mt-2">Aktif</Badge>
            </div>
            <button
              onClick={() => setEditProfileOpen(true)}
              className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center hover:bg-[--border] transition-colors shrink-0"
            >
              <Edit3 size={15} className="text-[--muted-foreground]" />
            </button>
          </CardContent>
        </Card>

        {/* Target Ramadhan */}
        <Card className="bg-gradient-to-br from-[--primary]/10 to-[--primary]/5 border-[--primary]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">🎯 Target Ramadhan Kamu</p>
              <button onClick={() => setEditTargetsOpen(true)} className="flex items-center gap-1 text-xs text-[--primary] font-semibold hover:underline">
                <Edit3 size={12} />Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Target Tilawah', value: `${profile?.quran_target_pages ?? 20} hal/hari` },
                { label: 'Target Sedekah', value: profile ? formatRupiah(profile.charity_target) + '/bln' : 'Rp 100.000/bln' },
                { label: 'Kota / Lokasi', value: profile?.city || 'Belum diset' },
                { label: 'Privasi Profil', value: profile?.privacy_setting === 'public' ? 'Publik' : 'Privat 🔒' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-[--muted-foreground]">{label}</p>
                  <p className="text-sm font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide mb-2 px-1">Badge Diraih</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((ub) => (
                <div key={ub.badge_id} className="flex items-center gap-2 bg-[--card] border border-[--border] rounded-2xl px-3 py-2">
                  <span className="text-xl">{ub.badge?.icon}</span>
                  <div>
                    <p className="text-xs font-bold">{ub.badge?.title}</p>
                    <p className="text-[10px] text-[--muted-foreground]">{ub.badge?.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Akun */}
        <div>
          <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide mb-2 px-1">Akun</p>
          <Card>
            <CardContent className="p-0">
              {[
                { icon: User,   label: 'Edit Profil',    desc: 'Nama dan kota domisili',          onClick: () => setEditProfileOpen(true) },
                { icon: Target, label: 'Target Ibadah',  desc: 'Tilawah, sedekah, dan privasi',   onClick: () => setEditTargetsOpen(true) },
                { icon: Bell,   label: 'Notifikasi',     desc: 'Pengingat sholat dan imsak',      onClick: () => setNotifOpen(true) },
              ].map(({ icon: Icon, label, desc, onClick }, i, arr) => (
                <button key={label} onClick={onClick} className={cn('w-full flex items-center gap-4 px-5 py-4 hover:bg-[--muted] active:bg-[--muted] transition-colors text-left', i < arr.length - 1 && 'border-b border-[--border]')}>
                  <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0"><Icon size={18} className="text-[--muted-foreground]" /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm">{label}</p><p className="text-xs text-[--muted-foreground]">{desc}</p></div>
                  <ChevronRight size={16} className="text-[--muted-foreground] shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Keamanan & Tampilan */}
        <div>
          <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide mb-2 px-1">Keamanan & Tampilan</p>
          <Card>
            <CardContent className="p-0">
              <button onClick={() => setChangePassOpen(true)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[--muted] transition-colors text-left border-b border-[--border]">
                <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0"><Shield size={18} className="text-[--muted-foreground]" /></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm">Ganti Password</p><p className="text-xs text-[--muted-foreground]">Ubah kata sandi akun</p></div>
                <ChevronRight size={16} className="text-[--muted-foreground] shrink-0" />
              </button>
              <button onClick={() => setSessionsOpen(true)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[--muted] transition-colors text-left border-b border-[--border]">
                <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0"><Award size={18} className="text-[--muted-foreground]" /></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm">Sesi Aktif</p><p className="text-xs text-[--muted-foreground]">Perangkat yang sedang masuk</p></div>
                <ChevronRight size={16} className="text-[--muted-foreground] shrink-0" />
              </button>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0">
                  {darkMode ? <Moon size={18} className="text-[--muted-foreground]" /> : <Sun size={18} className="text-[--muted-foreground]" />}
                </div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm">Mode Gelap</p><p className="text-xs text-[--muted-foreground]">{darkMode ? 'Aktif' : 'Nonaktif'}</p></div>
                <Toggle enabled={darkMode} onChange={handleDarkToggle} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* App info */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Moon size={16} className="text-[--primary]" />
              <span className="font-semibold text-sm">Ramadhan Tracker</span>
            </div>
            <p className="text-xs text-[--muted-foreground]">v1.0.0 — Semoga ibadah kamu diterima Allah ﷻ</p>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full text-[--destructive] border-[--destructive]/30 hover:bg-[--destructive]/5" onClick={handleSignOut} disabled={loggingOut}>
          <LogOut size={16} />
          {loggingOut ? 'Keluar...' : 'Keluar dari Akun'}
        </Button>
      </div>

      {/* ── Modals ── */}
      <EditProfileSheet
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={user}
        profile={profile}
        onSaved={(city) => {
          setProfile((p) => p ? { ...p, city } : p)
          supabase.auth.getSession().then(({ data: { session } }) => { if (session) setSession(session) })
          setEditProfileOpen(false)
        }}
      />
      <EditTargetsSheet
        open={editTargetsOpen}
        onClose={() => setEditTargetsOpen(false)}
        profile={profile}
        userId={user?.id ?? ''}
        onSaved={(updated) => { setProfile((p) => p ? { ...p, ...updated } : p); setEditTargetsOpen(false) }}
      />
      <ChangePasswordSheet open={changePassOpen} onClose={() => setChangePassOpen(false)} />
      <SessionsSheet open={sessionsOpen} onClose={() => setSessionsOpen(false)} user={user} />
      <NotifSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </AppLayout>
  )
}

// ── Edit Profil Sheet ─────────────────────────────────────────────────────────
function EditProfileSheet({ open, onClose, user, profile, onSaved }: {
  open: boolean; onClose: () => void
  user: SupabaseUser | null
  profile: UserProfile | null
  onSaved: (city: string) => void
}) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) { setName(user?.user_metadata?.full_name ?? ''); setCity(profile?.city ?? ''); setError(null); setSuccess(false) }
  }, [open, user, profile])

  async function handleSave() {
    if (!name.trim()) { setError('Nama tidak boleh kosong'); return }
    setSaving(true); setError(null)
    const [authRes, profRes] = await Promise.all([
      supabase.auth.updateUser({ data: { full_name: name.trim() } }),
      supabase.from('profiles').update({ city: city.trim() || null }).eq('user_id', user!.id),
    ])
    setSaving(false)
    if (authRes.error) { setError(authRes.error.message); return }
    if (profRes.error) { setError(profRes.error.message); return }
    setSuccess(true)
    setTimeout(() => onSaved(city.trim()), 800)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Profil">
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-xl bg-[--destructive]/10 border border-[--destructive]/20 px-4 py-3 text-sm text-[--destructive]">{error}</div>}
        {success ? <SuccessPanel message="Profil diperbarui!" /> : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" autoComplete="name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Kota / Domisili</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Contoh: Jakarta, Surabaya" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full mt-2">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ── Edit Targets Sheet ────────────────────────────────────────────────────────
function EditTargetsSheet({ open, onClose, profile, userId, onSaved }: {
  open: boolean; onClose: () => void; profile: UserProfile | null; userId: string
  onSaved: (v: Partial<UserProfile>) => void
}) {
  const [pages, setPages] = useState('20')
  const [charity, setCharity] = useState('100000')
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setPages(String(profile?.quran_target_pages ?? 20))
      setCharity(String(profile?.charity_target ?? 100000))
      setPrivacy(profile?.privacy_setting ?? 'private')
      setError(null); setSuccess(false)
    }
  }, [open, profile])

  async function handleSave() {
    const pagesNum = parseInt(pages); const charityNum = parseInt(charity)
    if (isNaN(pagesNum) || pagesNum < 1) { setError('Target tilawah minimal 1 halaman'); return }
    if (isNaN(charityNum) || charityNum < 0) { setError('Target sedekah tidak valid'); return }
    setSaving(true)
    const { error: err } = await supabase.from('profiles').upsert({
      user_id: userId, quran_target_pages: pagesNum, charity_target: charityNum, privacy_setting: privacy,
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => onSaved({ quran_target_pages: pagesNum, charity_target: charityNum, privacy_setting: privacy }), 800)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Target Ibadah">
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-xl bg-[--destructive]/10 border border-[--destructive]/20 px-4 py-3 text-sm text-[--destructive]">{error}</div>}
        {success ? <SuccessPanel message="Target disimpan!" /> : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Target Tilawah Harian (halaman)</Label>
              <Input type="number" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} min={1} max={100} />
              <p className="text-xs text-[--muted-foreground]">20 hal/hari → khatam 30 juz dalam 30 hari</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Target Sedekah Bulanan (Rp)</Label>
              <Input type="number" inputMode="numeric" value={charity} onChange={(e) => setCharity(e.target.value)} min={0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Privasi Profil</Label>
              <div className="flex gap-3">
                {(['private', 'public'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setPrivacy(v)} className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors', privacy === v ? 'bg-[--primary] text-white border-[--primary]' : 'border-[--border] hover:border-[--primary]/40')}>
                    {v === 'private' ? '🔒 Privat' : '🌐 Publik'}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full mt-2">{saving ? 'Menyimpan...' : 'Simpan Target'}</Button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ── Change Password Sheet ─────────────────────────────────────────────────────
function ChangePasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) { setNewPass(''); setConfirmPass(''); setError(null); setSuccess(false) }
  }, [open])

  async function handleSave() {
    if (newPass.length < 8) { setError('Password minimal 8 karakter'); return }
    if (newPass !== confirmPass) { setError('Konfirmasi password tidak cocok'); return }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPass })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true); setTimeout(onClose, 1500)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Ganti Password">
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-xl bg-[--destructive]/10 border border-[--destructive]/20 px-4 py-3 text-sm text-[--destructive]">{error}</div>}
        {success ? <SuccessPanel message="Password berhasil diubah!" /> : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min. 8 karakter" className="pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Konfirmasi Password</Label>
              <div className="relative">
                <Input type={showConfirm ? 'text' : 'password'} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Ulangi password baru" className="pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPass && newPass !== confirmPass && <p className="text-xs text-[--destructive]">Password tidak cocok</p>}
            </div>
            <Button onClick={handleSave} disabled={saving || newPass.length < 8 || newPass !== confirmPass} className="w-full mt-2">
              {saving ? 'Menyimpan...' : 'Ganti Password'}
            </Button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ── Sessions Sheet ────────────────────────────────────────────────────────────
function SessionsSheet({ open, onClose, user }: {
  open: boolean; onClose: () => void
  user: SupabaseUser | null
}) {
  const [logs, setLogs] = useState<{ id: string; event_type: string; created_at: string }[]>([])

  useEffect(() => {
    if (!open || !user) return
    supabase.from('login_activities').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setLogs(data) })
  }, [open, user])

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <Sheet open={open} onClose={onClose} title="Sesi Aktif">
      <div className="flex flex-col gap-4">
        <Card className="border-[--primary]/30 bg-[--primary]/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[--primary]/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-[--primary]" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sesi Ini · Browser</p>
              <p className="text-xs text-[--muted-foreground]">Email: {user?.email}</p>
              <p className="text-xs text-[--muted-foreground]">Bergabung: {createdAt}</p>
              <Badge variant="success" className="mt-1.5 text-[10px]">Aktif sekarang</Badge>
            </div>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide mb-2">Riwayat Login</p>
            <div className="flex flex-col gap-0">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-[--border] last:border-0">
                  <span className="text-sm capitalize">{l.event_type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-[--muted-foreground]">
                    {new Date(l.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {logs.length === 0 && (
          <p className="text-sm text-[--muted-foreground] text-center py-4">Belum ada riwayat login dicatat.</p>
        )}
      </div>
    </Sheet>
  )
}

// ── Notifications Sheet ───────────────────────────────────────────────────────
function NotifSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const NOTIF_KEY = 'ramadhan_notif_prefs'
  const defaultPrefs = { imsak: true, fajr: true, dhuhr: false, asr: false, maghrib: true, isha: false }

  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem(NOTIF_KEY); return s ? JSON.parse(s) : defaultPrefs }
    catch { return defaultPrefs }
  })
  const [permStatus, setPermStatus] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (open && 'Notification' in window) setPermStatus(Notification.permission)
  }, [open])

  function toggle(key: string) {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
  }

  async function requestPermission() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermStatus(result)
  }

  const items = [
    { key: 'imsak',  label: 'Imsak / Sahur',       desc: 'Pengingat 10 menit sebelum imsak' },
    { key: 'fajr',   label: 'Subuh',                desc: 'Notifikasi waktu sholat Subuh' },
    { key: 'dhuhr',  label: 'Dzuhur',               desc: 'Notifikasi waktu sholat Dzuhur' },
    { key: 'asr',    label: 'Ashar',                desc: 'Notifikasi waktu sholat Ashar' },
    { key: 'maghrib',label: 'Maghrib / Iftar',      desc: 'Notifikasi buka puasa' },
    { key: 'isha',   label: "Isya'",                desc: "Notifikasi waktu sholat Isya'" },
  ]

  return (
    <Sheet open={open} onClose={onClose} title="Notifikasi">
      <div className="flex flex-col gap-4">
        {permStatus !== 'granted' && (
          <div className={cn('rounded-xl p-4 flex flex-col gap-2',
            permStatus === 'denied'
              ? 'bg-[--destructive]/10 border border-[--destructive]/20'
              : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          )}>
            {permStatus === 'denied' ? (
              <>
                <p className="font-semibold text-sm text-[--destructive]">Notifikasi diblokir</p>
                <p className="text-xs text-[--muted-foreground]">Aktifkan izin notifikasi di pengaturan browser kamu.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Izin notifikasi diperlukan</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Berikan izin agar bisa menerima pengingat sholat dan imsak.</p>
                <Button onClick={requestPermission} className="w-full mt-1" size="sm">Izinkan Notifikasi</Button>
              </>
            )}
          </div>
        )}
        {permStatus === 'granted' && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            ✓ Notifikasi diizinkan
          </div>
        )}
        <p className="text-xs text-[--muted-foreground]">Pengaturan disimpan di perangkat ini. Memerlukan halaman terbuka atau mode PWA.</p>
        <Card>
          <CardContent className="p-0">
            {items.map(({ key, label, desc }, i, arr) => (
              <div key={key} className={cn('flex items-center gap-4 px-5 py-4', i < arr.length - 1 && 'border-b border-[--border]')}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-[--muted-foreground]">{desc}</p>
                </div>
                <Toggle enabled={prefs[key] ?? false} onChange={() => toggle(key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Sheet>
  )
}
