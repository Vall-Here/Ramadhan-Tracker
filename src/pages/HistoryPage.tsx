import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, X, Minus, BookOpen, Coins } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPrayerLabel, formatRupiah } from '@/lib/utils'
import type { PrayerLog, DailyLog, QuranLog, CharityLog } from '@/types'

const PRAYERS_WAJIB = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

interface DayData {
  date: string
  prayers: PrayerLog[]
  daily: DailyLog | null
  quran: QuranLog | null
  charity: CharityLog[]
}

export default function HistoryPage() {
  const { user } = useAuthStore()
  const [days, setDays] = useState<DayData[]>([])
  const [page, setPage] = useState(0) // 0 = this week, 1 = last week, etc.
  const PAGE_SIZE = 7

  useEffect(() => {
    if (!user) return
    async function load() {
      const endD = new Date()
      endD.setDate(endD.getDate() - page * PAGE_SIZE)
      const startD = new Date(endD)
      startD.setDate(startD.getDate() - PAGE_SIZE + 1)
      const start = startD.toISOString().split('T')[0]
      const end = endD.toISOString().split('T')[0]

      const [{ data: pl }, { data: dl }, { data: ql }, { data: cl }] = await Promise.all([
        supabase.from('prayer_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
        supabase.from('daily_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
        supabase.from('quran_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
        supabase.from('charity_logs').select('*').eq('user_id', user!.id).gte('date', start).lte('date', end),
      ])

      const result: DayData[] = []
      for (let i = PAGE_SIZE - 1; i >= 0; i--) {
        const d = new Date(endD); d.setDate(endD.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        result.push({
          date: ds,
          prayers: pl?.filter((p) => p.date === ds) ?? [],
          daily: dl?.find((l) => l.date === ds) ?? null,
          quran: ql?.find((q) => q.date === ds) ?? null,
          charity: cl?.filter((c) => c.date === ds) ?? [],
        })
      }
      setDays(result.reverse())
    }
    load()
  }, [user, page])

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-5 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Riwayat Ibadah</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page + 1)}
              className="w-8 h-8 rounded-lg bg-[--muted] flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-[--muted-foreground]">
              {page === 0 ? 'Minggu ini' : `${page} minggu lalu`}
            </span>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-8 h-8 rounded-lg bg-[--muted] flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {days.map(({ date, prayers, daily, quran, charity }) => {
          const wajibDone = prayers.filter(
            (p) => PRAYERS_WAJIB.includes(p.prayer_name) && (p.status === 'ontime' || p.status === 'qadha')
          ).length
          const isToday = date === new Date().toISOString().split('T')[0]
          const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'short',
          })

          return (
            <Card key={date} className={isToday ? 'border-[--primary]/40 bg-[--primary]/3' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{dayLabel}</p>
                    {isToday && <Badge variant="default" className="mt-1">Hari ini</Badge>}
                  </div>
                  <div className="flex gap-1.5">
                    {daily?.fasting_status === 'full' && <Badge variant="success">Puasa ✓</Badge>}
                    {daily?.fasting_status === 'partial' && <Badge variant="warning">Batal</Badge>}
                  </div>
                </div>

                {/* Sholat wajib icons */}
                <div className="flex gap-2 mb-3">
                  {PRAYERS_WAJIB.map((p) => {
                    const log = prayers.find((l) => l.prayer_name === p)
                    return (
                      <div
                        key={p}
                        className="flex flex-col items-center gap-1 flex-1"
                        title={getPrayerLabel(p)}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            log?.status === 'ontime'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30'
                              : log?.status === 'qadha'
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : log?.status === 'skipped'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-[--muted]'
                          }`}
                        >
                          {log?.status === 'ontime' && <Check size={14} className="text-emerald-600" />}
                          {log?.status === 'qadha' && <Minus size={14} className="text-amber-600" />}
                          {log?.status === 'skipped' && <X size={14} className="text-red-600" />}
                          {!log && <div className="w-2 h-2 rounded-full bg-[--border]" />}
                        </div>
                        <span className="text-[9px] text-[--muted-foreground]">
                          {getPrayerLabel(p).slice(0, 3)}
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-[--muted] flex items-center justify-center">
                      <span className="text-xs font-bold text-[--foreground]">{wajibDone}/5</span>
                    </div>
                    <span className="text-[9px] text-[--muted-foreground]">Total</span>
                  </div>
                </div>

                {/* Quran & charity */}
                {(quran || charity.length > 0) && (
                  <div className="flex gap-3 pt-3 border-t border-[--border]">
                    {quran && quran.pages_read > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                        <BookOpen size={12} className="text-emerald-500" />
                        <span>{quran.pages_read} hal tilawah</span>
                      </div>
                    )}
                    {charity.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                        <Coins size={12} className="text-amber-500" />
                        <span>{formatRupiah(charity.reduce((s, c) => s + c.amount, 0))}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </AppLayout>
  )
}
