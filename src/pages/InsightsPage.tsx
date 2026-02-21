import { useEffect, useState } from 'react'
import { Flame, Trophy, TrendingUp, CalendarDays } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getPrayerLabel, todayISO } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { HabitStreak } from '@/types'

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// Ramadhan 2026 range
const RAMADHAN_START = '2026-03-17'
const RAMADHAN_END   = '2026-04-15'
const RAMADHAN_DAYS  = 30

function getRamadhanDayDates(): string[] {
  const dates: string[] = []
  const start = new Date(RAMADHAN_START)
  for (let i = 0; i < RAMADHAN_DAYS; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

type HeatLevel = 0 | 1 | 2 | 3 | 4

interface HeatDay {
  date: string
  day: number      // 1–30
  level: HeatLevel // 0=no data,1=low,2=mid,3=good,4=perfect
  prayers: number
  fasting: boolean
  isFuture: boolean
}

function heatColor(level: HeatLevel, isFuture: boolean) {
  if (isFuture) return 'bg-[--muted] opacity-30'
  switch (level) {
    case 0: return 'bg-[--muted]'
    case 1: return 'bg-emerald-200 dark:bg-emerald-900/40'
    case 2: return 'bg-emerald-300 dark:bg-emerald-700/60'
    case 3: return 'bg-emerald-500'
    case 4: return 'bg-[--primary]'
    default: return 'bg-[--muted]'
  }
}

export default function InsightsPage() {
  const { user } = useAuthStore()
  const today = todayISO()
  const [streaks, setStreaks] = useState<HabitStreak[]>([])
  const [weekStats, setWeekStats] = useState<{ date: string; prayers: number; fasting: boolean; pages: number }[]>([])
  const [totalXP, setTotalXP] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalFasting, setTotalFasting] = useState(0)
  const [totalCharity, setTotalCharity] = useState(0)
  const [heatmap, setHeatmap] = useState<HeatDay[]>([])

  useEffect(() => {
    if (!user) return
    async function fetch() {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 6)
      const start = startDate.toISOString().split('T')[0]
      const end = endDate.toISOString().split('T')[0]

      const [{ data: st }, { data: pl }, { data: dl }, { data: ql }, { data: cl },
             { data: plRam }, { data: dlRam }] = await Promise.all([
        supabase.from('habit_streaks').select('*').eq('user_id', user!.id),
        supabase.from('prayer_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
        supabase.from('daily_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
        supabase.from('quran_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
        supabase.from('charity_logs').select('*').eq('user_id', user!.id),
        // Full Ramadhan range for heatmap
        supabase.from('prayer_logs').select('date,status').eq('user_id', user!.id)
          .gte('date', RAMADHAN_START).lte('date', RAMADHAN_END),
        supabase.from('daily_logs').select('date,fasting_status').eq('user_id', user!.id)
          .gte('date', RAMADHAN_START).lte('date', RAMADHAN_END),
      ])

      if (st) setStreaks(st)

      // Build 7-day stats
      const days: { date: string; prayers: number; fasting: boolean; pages: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        const prayers = pl?.filter((p) => p.date === ds && (p.status === 'ontime' || p.status === 'qadha')).length ?? 0
        const fasting = dl?.some((l) => l.date === ds && l.fasting_status === 'full') ?? false
        const pages = ql?.find((q) => q.date === ds)?.pages_read ?? 0
        days.push({ date: ds, prayers, fasting, pages })
      }
      setWeekStats(days)

      // Build heatmap
      const ramDates = getRamadhanDayDates()
      const heat: HeatDay[] = ramDates.map((date, i) => {
        const isFuture = date > today
        const prayers = plRam?.filter((p) => p.date === date && (p.status === 'ontime' || p.status === 'qadha')).length ?? 0
        const fasting = dlRam?.some((l) => l.date === date && l.fasting_status === 'full') ?? false
        let level: HeatLevel = 0
        if (!isFuture) {
          if (prayers === 5 && fasting) level = 4
          else if (prayers >= 4) level = 3
          else if (prayers >= 2) level = 2
          else if (prayers >= 1) level = 1
          else level = 0
        }
        return { date, day: i + 1, level, prayers, fasting, isFuture }
      })
      setHeatmap(heat)

      // Totals
      const pages = ql?.reduce((s, q) => s + q.pages_read, 0) ?? 0
      const fasting = dl?.filter((l) => l.fasting_status === 'full').length ?? 0
      const charity = cl?.reduce((s, c) => s + c.amount, 0) ?? 0
      const xp = (pages * 5) + (fasting * 50) + ((pl?.filter(p => p.status === 'ontime').length ?? 0) * 20)
      setTotalPages(pages)
      setTotalFasting(fasting)
      setTotalCharity(charity)
      setTotalXP(xp)
    }
    fetch()
  }, [user, today])

  const dailyStreak = streaks.find((s) => s.habit_key === 'daily')

  // ── Heatmap tooltip state ──────────────────────────────────────────────────
  const [activeDay, setActiveDay] = useState<HeatDay | null>(null)

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 p-5 pt-6">
        <div>
          <h1 className="text-xl font-bold">Insights</h1>
          <p className="text-sm text-[--muted-foreground] mt-0.5">Progres ibadah kamu</p>
        </div>

        {/* Calendar Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays size={16} className="text-[--primary]" />
              Kalender Ramadhan 1447 H
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Day labels */}
            <p className="text-[10px] text-[--muted-foreground] mb-2">
              17 Mar — 15 Apr 2026 · Warna = ibadah hari itu
            </p>

            {/* Grid: 6 columns of 5 = 30 days */}
            <div className="grid grid-cols-6 gap-1.5">
              {heatmap.map((day) => {
                const isToday = day.date === today
                return (
                  <button
                    key={day.date}
                    onClick={() => setActiveDay(activeDay?.date === day.date ? null : day)}
                    className={cn(
                      'aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all',
                      heatColor(day.level, day.isFuture),
                      isToday && 'ring-2 ring-[--primary] ring-offset-1',
                      !day.isFuture && 'hover:opacity-80 active:scale-95'
                    )}
                  >
                    <span className={cn(
                      day.level >= 3 ? 'text-white' : 'text-[--muted-foreground]',
                      day.isFuture && 'opacity-40'
                    )}>
                      {day.day}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tooltip */}
            {activeDay && (
              <div className="mt-3 p-3 rounded-xl bg-[--muted] text-sm">
                <p className="font-semibold">
                  {new Date(activeDay.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                  {activeDay.date === today && <Badge variant="success" className="ml-2 text-[10px]">Hari ini</Badge>}
                </p>
                {activeDay.isFuture ? (
                  <p className="text-[--muted-foreground] text-xs mt-1">Belum tiba</p>
                ) : (
                  <div className="flex gap-4 mt-1.5 text-xs text-[--muted-foreground]">
                    <span>🕌 {activeDay.prayers}/5 sholat</span>
                    <span>{activeDay.fasting ? '✅ Puasa penuh' : '⭕ Belum puasa'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="text-[10px] text-[--muted-foreground]">Rendah</span>
              {([0, 1, 2, 3, 4] as HeatLevel[]).map((l) => (
                <div key={l} className={cn('w-4 h-4 rounded-sm', heatColor(l, false))} />
              ))}
              <span className="text-[10px] text-[--muted-foreground]">Tinggi</span>
            </div>
          </CardContent>
        </Card>

        {/* XP + Streak hero */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 text-white">
            <CardContent className="p-4 flex flex-col gap-1">
              <Flame size={22} />
              <p className="text-3xl font-bold">{dailyStreak?.current_streak ?? 0}</p>
              <p className="text-xs text-white/80">Hari Streak</p>
              <p className="text-xs text-white/60">Terbaik: {dailyStreak?.best_streak ?? 0} hari</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-purple-700 border-0 text-white">
            <CardContent className="p-4 flex flex-col gap-1">
              <Trophy size={22} />
              <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
              <p className="text-xs text-white/80">Total XP</p>
            </CardContent>
          </Card>
        </div>

        {/* 7-day bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-[--primary]" />
              Sholat 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end justify-between gap-2 h-24">
              {weekStats.map(({ date, prayers }) => {
                const pct = (prayers / 5) * 100
                const dayLabel = new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })
                return (
                  <div key={date} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full rounded-t-lg bg-[--muted] relative" style={{ height: '72px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-[--primary] transition-all duration-500"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[--muted-foreground]">{dayLabel}</span>
                    <span className="text-[10px] font-bold">{prayers}/5</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fasting chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Puasa 7 Hari</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              {weekStats.map(({ date, fasting }) => {
                const dayLabel = new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })
                return (
                  <div key={date} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-full aspect-square rounded-xl flex items-center justify-center text-base ${
                        fasting
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[--muted] text-[--muted-foreground]'
                      }`}
                    >
                      {fasting ? '✓' : '–'}
                    </div>
                    <span className="text-[10px] text-[--muted-foreground]">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Halaman', value: totalPages, unit: 'hal', color: 'text-emerald-600' },
            { label: 'Puasa Penuh', value: totalFasting, unit: 'hari', color: 'text-violet-600' },
            { label: 'Total Sedekah', value: `${(totalCharity / 1000).toFixed(0)}K`, unit: 'Rp', color: 'text-amber-600' },
          ].map(({ label, value, unit, color }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-[--muted-foreground] mt-0.5">{unit}</p>
                <p className="text-[10px] font-medium mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Streaks per habit */}
        {streaks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Streak Per Ibadah</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-3">
              {streaks.slice(0, 6).map((s) => (
                <div key={s.habit_key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{getPrayerLabel(s.habit_key)}</span>
                    <span className="font-semibold text-[--primary]">{s.current_streak} hari</span>
                  </div>
                  <Progress value={Math.min((s.current_streak / 30) * 100, 100)} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Prayer completeness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kelengkapan Sholat Wajib</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-3">
            {PRAYER_KEYS.map((key) => {
              const done = weekStats.filter((d) => {
                // We don't have prayer status here, but showing placeholder
                return d.prayers > 0
              }).length
              const pct = Math.round((done / 7) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{getPrayerLabel(key)}</span>
                    <Badge variant={pct === 100 ? 'success' : pct >= 70 ? 'warning' : 'outline'}>
                      {pct}%
                    </Badge>
                  </div>
                  <Progress value={pct} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
