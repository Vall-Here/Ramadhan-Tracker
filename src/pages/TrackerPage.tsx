import { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Check, Minus, X, BookOpen, Moon, Coins, AlignLeft, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn, todayISO, getPrayerLabel, xpForActivity } from '@/lib/utils'
import type { PrayerName, PrayerStatus } from '@/types'

const PRAYERS_WAJIB: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const PRAYERS_SUNNAH: PrayerName[] = ['tarawih', 'witir', 'dhuha', 'qiyam']

type Tab = 'sholat' | 'puasa' | 'tilawah' | 'sedekah'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'sholat', label: 'Sholat', icon: Moon },
  { id: 'puasa', label: 'Puasa', icon: Moon },
  { id: 'tilawah', label: 'Tilawah', icon: BookOpen },
  { id: 'sedekah', label: 'Sedekah', icon: Coins },
]

function PrayerButton({
  status,
  onClick,
}: {
  status: PrayerStatus
  onClick: (s: PrayerStatus) => void
}) {
  const opts: { s: PrayerStatus; label: string; color: string }[] = [
    { s: 'ontime', label: 'Tepat Waktu', color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
    { s: 'qadha', label: "Qadha'", color: 'bg-amber-500 hover:bg-amber-600 text-white' },
    { s: 'skipped', label: 'Tidak Sholat', color: 'bg-red-500 hover:bg-red-600 text-white' },
  ]
  return (
    <div className="flex gap-2">
      {opts.map(({ s, label, color }) => (
        <button
          key={s}
          onClick={() => onClick(status === s ? null : s)}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95',
            status === s ? color : 'bg-[--muted] text-[--muted-foreground]'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function PrayerStatusIcon({ status }: { status: PrayerStatus }) {
  if (status === 'ontime') return <Check size={14} className="text-emerald-500" />
  if (status === 'qadha') return <Minus size={14} className="text-amber-500" />
  if (status === 'skipped') return <X size={14} className="text-red-500" />
  return <div className="w-3.5 h-3.5 rounded-full border-2 border-[--border]" />
}

export default function TrackerPage() {
  const { user } = useAuthStore()
  const today = todayISO()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>(
    (location.state as { openTab?: Tab } | null)?.openTab ?? 'sholat'
  )
  const [prayerStatuses, setPrayerStatuses] = useState<Record<PrayerName, PrayerStatus>>({
    fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
    tarawih: null, witir: null, dhuha: null, qiyam: null,
  })
  const [fastingStatus, setFastingStatus] = useState<'full' | 'partial' | 'skip' | null>(null)
  const [fastingNote, setFastingNote] = useState('')
  const [pagesRead, setPagesRead] = useState(0)
  const [quranNotes, setQuranNotes] = useState('')
  const [charityAmount, setCharityAmount] = useState('')
  const [charityChannel, setCharityChannel] = useState('')
  const [totalXP, setTotalXP] = useState(0)
  const [saved, setSaved] = useState(false)

  // Load existing logs for today
  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: prayers }, { data: daily }, { data: quran }] = await Promise.all([
        supabase.from('prayer_logs').select('*').eq('user_id', user!.id).eq('date', today),
        supabase.from('daily_logs').select('*').eq('user_id', user!.id).eq('date', today).single(),
        supabase.from('quran_logs').select('*').eq('user_id', user!.id).eq('date', today).single(),
      ])
      if (prayers) {
        const map: Record<PrayerName, PrayerStatus> = {
          fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
          tarawih: null, witir: null, dhuha: null, qiyam: null,
        }
        prayers.forEach((p) => { map[p.prayer_name as PrayerName] = p.status })
        setPrayerStatuses(map)
      }
      if (daily) {
        setFastingStatus(daily.fasting_status)
        setFastingNote(daily.notes ?? '')
      }
      if (quran) {
        setPagesRead(quran.pages_read)
        setQuranNotes(quran.last_surah ?? '')
      }
    }
    load()
  }, [user, today])

  const calcXP = useCallback(() => {
    let xp = 0
    Object.entries(prayerStatuses).forEach(([key, val]) => {
      if (val === 'ontime') xp += xpForActivity(key)
      else if (val === 'qadha') xp += Math.floor(xpForActivity(key) * 0.5)
    })
    if (fastingStatus === 'full') xp += xpForActivity('fasting_full')
    if (fastingStatus === 'partial') xp += xpForActivity('fasting_partial')
    xp += Math.floor(pagesRead * xpForActivity('quran_page'))
    return xp
  }, [prayerStatuses, fastingStatus, pagesRead])

  useEffect(() => { setTotalXP(calcXP()) }, [calcXP])

  async function handleSave() {
    if (!user) return
    setSaved(false)
    const upserts: Promise<unknown>[] = []

    // Save prayer logs
    const prayerRows = Object.entries(prayerStatuses)
      .filter(([, v]) => v !== null)
      .map(([key, status]) => ({
        user_id: user.id, date: today, prayer_name: key, status, on_time: status === 'ontime',
      }))
    if (prayerRows.length) {
      upserts.push(supabase.from('prayer_logs').upsert(prayerRows, { onConflict: 'user_id,date,prayer_name' }))
    }

    // Save daily log
    upserts.push(
      supabase.from('daily_logs').upsert(
        { user_id: user.id, date: today, fasting_status: fastingStatus, notes: fastingNote },
        { onConflict: 'user_id,date' }
      )
    )

    // Save quran log
    if (pagesRead > 0) {
      upserts.push(
        supabase.from('quran_logs').upsert(
          { user_id: user.id, date: today, pages_read: pagesRead, juz_read: 0, minutes: 0, last_surah: quranNotes },
          { onConflict: 'user_id,date' }
        )
      )
    }

    await Promise.all(upserts)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-5 pt-6 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Tracker Harian</h1>
              <p className="text-xs text-[--muted-foreground] mt-0.5">
                {new Date(today).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded-xl">
              <span className="text-amber-500 font-bold text-sm">⚡ {totalXP} XP</span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 px-5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0',
                activeTab === id
                  ? 'bg-[--primary] text-[--primary-foreground] shadow-sm'
                  : 'bg-[--muted] text-[--muted-foreground]'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 px-5 py-4">
          <AnimatePresence mode="wait">
            {activeTab === 'sholat' && (
              <motion.div
                key="sholat"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide mb-3">Sholat Wajib</p>
                  <div className="flex flex-col gap-3">
                    {PRAYERS_WAJIB.map((prayer) => (
                      <Card key={prayer}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <PrayerStatusIcon status={prayerStatuses[prayer]} />
                              <span className="font-semibold text-sm">{getPrayerLabel(prayer)}</span>
                            </div>
                            {prayerStatuses[prayer] === 'ontime' && (
                              <Badge variant="success">+{xpForActivity(prayer)} XP</Badge>
                            )}
                          </div>
                          <PrayerButton
                            status={prayerStatuses[prayer]}
                            onClick={(s) => setPrayerStatuses((prev) => ({ ...prev, [prayer]: s }))}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide mb-3">Sholat Sunnah</p>
                  <div className="flex flex-col gap-3">
                    {PRAYERS_SUNNAH.map((prayer) => (
                      <Card key={prayer}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <PrayerStatusIcon status={prayerStatuses[prayer]} />
                              <span className="font-semibold text-sm">{getPrayerLabel(prayer)}</span>
                            </div>
                            {prayerStatuses[prayer] === 'ontime' && (
                              <Badge variant="success">+{xpForActivity(prayer)} XP</Badge>
                            )}
                          </div>
                          <PrayerButton
                            status={prayerStatuses[prayer]}
                            onClick={(s) => setPrayerStatuses((prev) => ({ ...prev, [prayer]: s }))}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'puasa' && (
              <motion.div
                key="puasa"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                <Card>
                  <CardContent className="p-5">
                    <p className="font-semibold mb-4">Status Puasa Hari Ini</p>
                    <div className="flex flex-col gap-3">
                      {[
                        { v: 'full', label: '✅ Puasa Penuh', desc: 'Dari imsak hingga waktu berbuka', xp: xpForActivity('fasting_full') },
                        { v: 'partial', label: '⚡ Batal / Sebagian', desc: 'Tidak bisa berpuasa penuh', xp: xpForActivity('fasting_partial') },
                        { v: 'skip', label: '❌ Tidak Berpuasa', desc: 'Uzur syar\'i atau lainnya', xp: 0 },
                      ].map(({ v, label, desc, xp }) => (
                        <button
                          key={v}
                          onClick={() => setFastingStatus(fastingStatus === v as 'full' | 'partial' | 'skip' ? null : v as 'full' | 'partial' | 'skip')}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                            fastingStatus === v
                              ? 'border-[--primary] bg-[--primary]/5'
                              : 'border-[--border] hover:border-[--primary]/30'
                          )}
                        >
                          <div>
                            <p className="font-semibold text-sm">{label}</p>
                            <p className="text-xs text-[--muted-foreground] mt-0.5">{desc}</p>
                          </div>
                          {xp > 0 && fastingStatus === v && <Badge variant="success">+{xp} XP</Badge>}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlignLeft size={16} className="text-[--muted-foreground]" />
                      <p className="font-semibold text-sm">Catatan (opsional)</p>
                    </div>
                    <Textarea
                      placeholder="Alasan, refleksi, atau catatan hari ini..."
                      value={fastingNote}
                      onChange={(e) => setFastingNote(e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'tilawah' && (
              <motion.div
                key="tilawah"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                <Card>
                  <CardContent className="p-5">
                    <p className="font-semibold mb-4">Tilawah Al-Qur'an</p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-[--primary]">{pagesRead}</p>
                        <p className="text-sm text-[--muted-foreground] mt-1">Halaman hari ini</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setPagesRead(Math.max(0, pagesRead - 1))}
                          className="w-12 h-12 rounded-full bg-[--muted] flex items-center justify-center text-xl font-bold hover:bg-[--border] active:scale-90 transition-all"
                        >
                          −
                        </button>
                        <button
                          onClick={() => setPagesRead(pagesRead + 1)}
                          className="w-16 h-16 rounded-full bg-[--primary] text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-[--primary]/25 hover:opacity-90 active:scale-90 transition-all"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {[1, 5, 10, 20].map((n) => (
                          <button
                            key={n}
                            onClick={() => setPagesRead(pagesRead + n)}
                            className="px-4 py-1.5 rounded-full bg-[--secondary] text-[--secondary-foreground] text-sm font-semibold hover:opacity-80 active:scale-95 transition-all"
                          >
                            +{n}
                          </button>
                        ))}
                      </div>
                      {pagesRead > 0 && (
                        <Badge variant="success" className="text-sm py-1 px-3">
                          +{pagesRead * xpForActivity('quran_page')} XP dari tilawah
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="font-semibold text-sm mb-3">Posisi Terakhir (opsional)</p>
                    <input
                      type="text"
                      placeholder="Contoh: QS. Al-Baqarah ayat 255"
                      value={quranNotes}
                      onChange={(e) => setQuranNotes(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[--input] bg-[--background] text-sm focus:outline-none focus:ring-2 focus:ring-[--ring]"
                    />
                  </CardContent>
                </Card>

                {/* Open Al-Quran reader */}
                <Link to="/quran">
                  <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:opacity-90 transition-opacity">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-900/50 flex items-center justify-center shadow-sm">
                          <BookOpen size={20} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Baca Al-Qur'an</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">114 surah · Arab + terjemahan + audio</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-emerald-600 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}

            {activeTab === 'sedekah' && (
              <motion.div
                key="sedekah"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                <Card>
                  <CardContent className="p-5">
                    <p className="font-semibold mb-4">Catat Sedekah / Amal</p>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-sm font-medium text-[--foreground] block mb-1.5">Jumlah (Rp)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={charityAmount}
                          onChange={(e) => setCharityAmount(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-[--input] bg-[--background] text-sm focus:outline-none focus:ring-2 focus:ring-[--ring]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[--foreground] block mb-1.5">Kanal / Tujuan</label>
                        <input
                          type="text"
                          placeholder="Masjid, panti, online, dll."
                          value={charityChannel}
                          onChange={(e) => setCharityChannel(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-[--input] bg-[--background] text-sm focus:outline-none focus:ring-2 focus:ring-[--ring]"
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!user || !charityAmount) return
                          await supabase.from('charity_logs').insert({
                            user_id: user.id, date: today,
                            amount: Number(charityAmount),
                            channel: charityChannel || 'Tidak disebutkan',
                            note: null,
                          })
                          setCharityAmount('')
                          setCharityChannel('')
                          setSaved(true)
                          setTimeout(() => setSaved(false), 2000)
                        }}
                      >
                        Simpan Catatan Sedekah
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save button (sticky bottom above nav) */}
        <div className="sticky bottom-[64px] left-0 right-0 px-5 pb-4 bg-gradient-to-t from-[--background] via-[--background]/80 to-transparent pt-4">
          <Button className="w-full h-12 text-base shadow-lg" onClick={handleSave}>
            {saved ? '✓ Tersimpan!' : 'Simpan Ibadah Hari Ini'}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
