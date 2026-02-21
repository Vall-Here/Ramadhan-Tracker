import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, BookOpen, Moon, Coins, ChevronRight, Star, BarChart2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { todayISO, formatHijriDate, getDayOfRamadhan, getPrayerLabel } from '@/lib/utils'
import { useImsakiyahMonth, getCoords, getNextPrayer } from '@/hooks/useImsakiyah'
import type { PrayerLog, DailyLog, QuranLog } from '@/types'

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

export default function HomePage() {
  const { user } = useAuthStore()
  const today = todayISO()
  const ramadhanDay = getDayOfRamadhan()
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([])
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [quranLog, setQuranLog] = useState<QuranLog | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      const [{ data: prayers }, { data: daily }, { data: quran }, { data: streaks }] =
        await Promise.all([
          supabase.from('prayer_logs').select('*').eq('user_id', user!.id).eq('date', today),
          supabase.from('daily_logs').select('*').eq('user_id', user!.id).eq('date', today).single(),
          supabase.from('quran_logs').select('*').eq('user_id', user!.id).eq('date', today).single(),
          supabase.from('habit_streaks').select('*').eq('user_id', user!.id).eq('habit_key', 'daily'),
        ])
      if (prayers) setPrayerLogs(prayers)
      if (daily) setDailyLog(daily)
      if (quran) setQuranLog(quran)
      if (streaks && streaks.length > 0) setStreak(streaks[0].current_streak)
    }
    fetchData()
  }, [user, today])

  const prayersDone = prayerLogs.filter((p) => p.status === 'ontime' || p.status === 'qadha').length
  const prayerProgress = Math.round((prayersDone / PRAYERS.length) * 100)

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Kamu'

  // ── Imsakiyah live card ───────────────────────────────────────────────
  const now = new Date()
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [ticker, setTicker] = useState(0)
  useEffect(() => { getCoords().then(setCoords) }, [])
  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])
  const { data: imsakEntries } = useImsakiyahMonth(
    coords?.lat ?? null, coords?.lon ?? null, now.getFullYear(), now.getMonth() + 1
  )
  const todayImsakiyah = imsakEntries?.find((e) => e.isoDate === today)
  const nextPrayer = todayImsakiyah ? getNextPrayer(todayImsakiyah.timings, new Date()) : null
  const imsak = todayImsakiyah?.timings.Imsak
  const iftar = todayImsakiyah?.timings.Maghrib

  const summaryCards = [
    {
      icon: Moon,
      label: 'Puasa',
      value: dailyLog?.fasting_status === 'full' ? 'Penuh ✓' : dailyLog?.fasting_status === 'partial' ? 'Sebagian' : 'Belum dicatat',
      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      to: '/tracker',
    },
    {
      icon: BookOpen,
      label: 'Tilawah',
      value: quranLog ? `${quranLog.pages_read} hal` : '0 hal',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      to: '/tracker',
    },
    {
      icon: Coins,
      label: 'Streak',
      value: `${streak} hari`,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      to: '/insights',
    },
  ]

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 p-5 pt-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[--muted-foreground]">{formatHijriDate()}</p>
              <h1 className="text-2xl font-bold mt-0.5">
                Assalamu'alaikum, {name} 👋
              </h1>
              {ramadhanDay > 0 && (
                <Badge variant="success" className="mt-2">
                  <Star size={11} />
                  Ramadhan Hari ke-{ramadhanDay}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2">
              <Flame size={18} className="text-amber-500" />
              <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">{streak}</span>
            </div>
          </div>
        </motion.div>

        {/* Imsakiyah live card */}
        {todayImsakiyah && (
          <motion.div
            key={`imsakiyah-${ticker}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Link to="/imsakiyah">
              <Card className="border-[--primary]/20 hover:border-[--primary]/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-[--primary]" />
                      <p className="text-sm font-semibold">Jadwal Imsakiyah</p>
                    </div>
                    <ChevronRight size={16} className="text-[--muted-foreground]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-xl bg-[--muted]">
                      <p className="text-[10px] text-[--muted-foreground] font-medium">Imsak</p>
                      <p className="text-sm font-bold font-mono mt-0.5">{imsak}</p>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-[--primary]/10">
                      <p className="text-[10px] text-[--primary] font-semibold uppercase tracking-wide">
                        {nextPrayer?.label ?? '—'}
                      </p>
                      <p className="text-sm font-bold font-mono text-[--primary] mt-0.5">
                        {nextPrayer?.time ?? '—'}
                      </p>
                      {nextPrayer && nextPrayer.minutesLeft > 0 && (
                        <p className="text-[10px] text-[--primary]/70 mt-0.5">
                          {Math.floor(nextPrayer.minutesLeft / 60) > 0
                            ? `${Math.floor(nextPrayer.minutesLeft / 60)}j ${nextPrayer.minutesLeft % 60}m lagi`
                            : `${nextPrayer.minutesLeft}m lagi`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-[--muted]">
                      <p className="text-[10px] text-[--muted-foreground] font-medium">Iftar</p>
                      <p className="text-sm font-bold font-mono mt-0.5">{iftar}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Prayer Progress Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-[--primary] to-emerald-700 border-0 text-white shadow-lg shadow-[--primary]/25">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Sholat Hari Ini</p>
                  <p className="text-3xl font-bold mt-0.5">
                    {prayersDone}<span className="text-white/60 text-xl">/{PRAYERS.length}</span>
                  </p>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="white" strokeWidth="3"
                      strokeDasharray={`${prayerProgress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{prayerProgress}%</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PRAYERS.map((p) => {
                  const log = prayerLogs.find((l) => l.prayer_name === p)
                  const done = log?.status === 'ontime' || log?.status === 'qadha'
                  return (
                    <span
                      key={p}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        done
                          ? 'bg-white/25 text-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {getPrayerLabel(p)}
                    </span>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary mini cards */}
        <div className="grid grid-cols-3 gap-3">
          {summaryCards.map(({ icon: Icon, label, value, color, to }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Link to={to}>
                <Card className="hover:border-[--primary]/30 transition-colors">
                  <CardContent className="p-3 flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[--muted-foreground] font-medium">{label}</p>
                      <p className="text-xs font-bold mt-0.5 leading-tight">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick tracker CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex gap-3 mb-6">
            <Link to="/quran" className="flex-1">
              <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:opacity-90 transition-opacity h-full">
                <CardContent className="p-3.5 flex items-center gap-2">
                  <BookOpen size={18} className="text-emerald-600 shrink-0" />
                  <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Baca Al-Qur'an</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/insights" className="flex-1">
              <Card className="hover:border-[--primary]/40 hover:bg-[--primary]/5 transition-colors h-full">
                <CardContent className="p-3.5 flex items-center gap-2">
                  <BarChart2 size={18} className="text-[--primary] shrink-0" />
                  <p className="font-semibold text-sm">Insights</p>
                </CardContent>
              </Card>
            </Link>
          </div>
          <Link to="/tracker">
            <Card className="border-[--primary]/20 bg-[--primary]/5 hover:bg-[--primary]/10 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Update ibadah hari ini</p>
                  <p className="text-xs text-[--muted-foreground] mt-0.5">Catat sholat, tilawah, dan puasa kamu</p>
                </div>
                <ChevronRight size={20} className="text-[--primary] shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Daily quote */}
        <Card className="bg-[--muted]">
          <CardContent className="p-4">
            <p className="text-xs text-[--muted-foreground] font-medium mb-2">Renungan Hari Ini</p>
            <p className="text-sm font-medium leading-relaxed">
              "Barangsiapa yang berpuasa Ramadhan karena iman dan mengharap pahala, niscaya akan diampuni dosa-dosanya yang telah lalu."
            </p>
            <p className="text-xs text-[--muted-foreground] mt-2">— HR. Bukhari & Muslim</p>
          </CardContent>
        </Card>

        {/* Today's progress */}
        <Card>
          <CardContent className="p-4 flex flex-col gap-3">
            <p className="font-semibold text-sm">Progress Hari Ini</p>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[--muted-foreground]">Sholat Wajib</span>
                <span className="font-medium">{prayersDone}/5</span>
              </div>
              <Progress value={prayerProgress} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[--muted-foreground]">Tilawah</span>
                <span className="font-medium">{quranLog?.pages_read ?? 0} hal</span>
              </div>
              <Progress value={Math.min(((quranLog?.pages_read ?? 0) / 20) * 100, 100)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
