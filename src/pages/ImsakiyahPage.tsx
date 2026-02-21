import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useImsakiyahMonth, getCoords, getNextPrayer, type PrayerTimes } from '@/hooks/useImsakiyah'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, todayISO } from '@/lib/utils'

// ── Countdown display ────────────────────────────────────────────────────────
function Countdown({ minutesLeft }: { minutesLeft: number }) {
  const h = Math.floor(minutesLeft / 60)
  const m = minutesLeft % 60
  return (
    <span className="font-mono font-bold tabular-nums">
      {h > 0 ? `${h}j ` : ''}{m}m
    </span>
  )
}

// ── Prayer row in daily card ─────────────────────────────────────────────────
const PRAYER_ROWS: { key: keyof PrayerTimes['timings']; label: string; highlight?: boolean }[] = [
  { key: 'Imsak',   label: 'Imsak', highlight: true },
  { key: 'Fajr',    label: 'Subuh' },
  { key: 'Sunrise', label: 'Terbit' },
  { key: 'Dhuhr',   label: 'Dzuhur' },
  { key: 'Asr',     label: 'Ashar' },
  { key: 'Maghrib', label: 'Maghrib (Iftar)', highlight: true },
  { key: 'Isha',    label: "Isya'" },
]

function DailyCard({
  entry,
  isToday,
  nextPrayerKey,
}: {
  entry: PrayerTimes
  isToday: boolean
  nextPrayerKey: string | null
}) {
  return (
    <Card className={cn('w-full', isToday && 'ring-2 ring-[--primary]')}>
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-base">{entry.readableDate}</p>
            <p className="text-xs text-[--muted-foreground] mt-0.5">{entry.hijriLabel}</p>
          </div>
          {isToday && <Badge variant="success">Hari ini</Badge>}
        </div>

        {/* Prayer times table */}
        <div className="flex flex-col gap-0">
          {PRAYER_ROWS.map(({ key, label, highlight }) => {
            const isNext = isToday && nextPrayerKey === key
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors',
                  highlight && 'bg-[--primary]/5',
                  isNext && 'bg-[--primary]/15 ring-1 ring-[--primary]/30'
                )}
              >
                <div className="flex items-center gap-2">
                  {isNext && (
                    <span className="w-2 h-2 rounded-full bg-[--primary] animate-pulse" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      highlight ? 'font-semibold text-[--primary]' : 'font-medium',
                      isNext && 'text-[--primary] font-bold'
                    )}
                  >
                    {label}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-sm font-mono font-bold tabular-nums',
                    isNext ? 'text-[--primary]' : 'text-[--foreground]'
                  )}
                >
                  {entry.timings[key]}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ImsakiyahPage() {
  const navigate = useNavigate()
  const today = todayISO()
  const now = new Date()

  // Ramadhan 2026: Mar + Apr
  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => {
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    // If before March 2026, default to March 2026
    if (y < 2026 || (y === 2026 && m < 3)) return { year: 2026, month: 3 }
    if (y === 2026 && m > 4) return { year: 2026, month: 4 }
    return { year: y, month: m }
  })

  const [coords, setCoords] = useState<{ lat: number; lon: number; city: string } | null>(null)
  const [locLoading, setLocLoading] = useState(true)
  const [ticker, setTicker] = useState(0) // for live countdown

  // Get geolocation once
  useEffect(() => {
    getCoords().then((c) => {
      setCoords(c)
      setLocLoading(false)
    })
  }, [])

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const { data: entries, isLoading, isError, refetch } = useImsakiyahMonth(
    coords?.lat ?? null,
    coords?.lon ?? null,
    viewMonth.year,
    viewMonth.month
  )

  const todayEntry = entries?.find((e) => e.isoDate === today)
  const nextPrayer = todayEntry ? getNextPrayer(todayEntry.timings, new Date()) : null

  // Ramadhan months only (Mar & Apr 2026)
  const canGoBack = !(viewMonth.year === 2026 && viewMonth.month === 3)
  const canGoForward = !(viewMonth.year === 2026 && viewMonth.month === 4)

  const goBack = useCallback(() => {
    setViewMonth((v) => {
      const m = v.month - 1
      return m < 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: m }
    })
  }, [])

  const goForward = useCallback(() => {
    setViewMonth((v) => {
      const m = v.month + 1
      return m > 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: m }
    })
  }, [])

  const monthLabel = new Date(viewMonth.year, viewMonth.month - 1, 1)
    .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  // Highlight today entry
  const todayIndex = entries?.findIndex((e) => e.isoDate === today) ?? -1

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-5 pt-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center hover:bg-[--border] transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Jadwal Imsakiyah</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {locLoading ? (
                <Loader2 size={12} className="animate-spin text-[--muted-foreground]" />
              ) : (
                <MapPin size={12} className="text-[--primary]" />
              )}
              <span className="text-xs text-[--muted-foreground]">{coords?.city ?? 'Mendapatkan lokasi…'}</span>
              {!locLoading && (
                <button
                  onClick={() => {
                    setLocLoading(true)
                    getCoords().then((c) => { setCoords(c); setLocLoading(false) })
                  }}
                  className="ml-1 text-[--primary]"
                >
                  <RefreshCw size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Today's next prayer banner */}
        {todayEntry && nextPrayer && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            key={ticker}
          >
            <Card className="bg-gradient-to-r from-[--primary] to-emerald-500 border-0 text-white overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Waktu Berikutnya</p>
                  <p className="text-lg font-bold mt-0.5">{nextPrayer.label}</p>
                  <p className="text-2xl font-mono font-bold">{nextPrayer.time}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs text-white/70">Lagi</p>
                  <div className="text-xl text-white">
                    <Countdown minutesLeft={nextPrayer.minutesLeft} />
                  </div>
                  <Clock size={28} className="text-white/20 mt-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center disabled:opacity-30 hover:bg-[--border] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="font-semibold text-base">{monthLabel}</p>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center disabled:opacity-30 hover:bg-[--border] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Loading / error */}
        {(locLoading || isLoading) && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="animate-spin text-[--primary]" size={28} />
            <p className="text-sm text-[--muted-foreground]">
              {locLoading ? 'Mendapatkan lokasi…' : 'Memuat jadwal…'}
            </p>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center p-4">
            <p className="text-3xl">📡</p>
            <p className="font-semibold text-sm">Gagal memuat jadwal</p>
            <p className="text-xs text-[--muted-foreground]">Periksa koneksi internet kamu.</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 rounded-xl bg-[--primary] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Daily cards — scroll to today on mount */}
        {!isLoading && !isError && entries && (
          <div className="flex flex-col gap-3">
            {/* Mini month header */}
            <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">
              {entries.length} hari · Ramadhan 1447 H
            </p>

            {entries.map((entry, i) => (
              <div
                key={entry.isoDate}
                id={i === todayIndex ? 'today-imsakiyah' : undefined}
              >
                <DailyCard
                  entry={entry}
                  isToday={entry.isoDate === today}
                  nextPrayerKey={entry.isoDate === today ? (nextPrayer?.name ?? null) : null}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
