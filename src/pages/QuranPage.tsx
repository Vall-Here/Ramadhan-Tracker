import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Play, Pause, BookOpen, Loader2, StopCircle, ListMusic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurahList, useSurahDetail, type Surah } from '@/hooks/useQuran'
import { AppLayout } from '@/components/layout/AppLayout'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Surah list item ──────────────────────────────────────────────────────────
function SurahCard({ surah, onClick }: { surah: Surah; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[--card] border border-[--border] hover:border-[--primary]/40 hover:bg-[--primary]/5 transition-all text-left active:bg-[--primary]/10"
    >
      {/* Number badge */}
      <div className="w-10 h-10 rounded-xl bg-[--primary]/10 flex items-center justify-center shrink-0">
        <span className="text-[--primary] text-xs font-bold">{surah.number}</span>
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{surah.englishName}</p>
        <p className="text-xs text-[--muted-foreground] mt-0.5">
          {surah.englishNameTranslation} · {surah.numberOfAyahs} ayat
        </p>
      </div>

      {/* Arabic name + type */}
      <div className="text-right shrink-0">
        <p className="text-base font-arabic leading-snug text-[--primary]">{surah.name}</p>
        <p className="text-[10px] text-[--muted-foreground] mt-0.5">
          {surah.revelationType === 'Meccan' ? 'Makkiyyah' : 'Madaniyyah'}
        </p>
      </div>
    </motion.button>
  )
}

// ── Single ayah row ──────────────────────────────────────────────────────────
function AyahRow({
  ayahNumber,
  numberInSurah,
  arabic,
  translation,
  audioUrl,
  isPlaying,
  onPlay,
  onPause,
}: {
  ayahNumber: number
  numberInSurah: number
  arabic: string
  translation?: string
  audioUrl?: string
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
}) {
  return (
    <div className="flex flex-col gap-3 py-4 border-b border-[--border] last:border-0">
      {/* Ayah number + audio */}
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-[--primary]/10 flex items-center justify-center">
          <span className="text-[--primary] text-xs font-bold">{numberInSurah}</span>
        </div>
        {audioUrl && (
          <button
            onClick={isPlaying ? onPause : onPlay}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              isPlaying
                ? 'bg-[--primary] text-white shadow-md shadow-[--primary]/25'
                : 'bg-[--muted] text-[--muted-foreground] hover:bg-[--primary]/10 hover:text-[--primary]'
            )}
          >
            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isPlaying ? 'Pause' : 'Dengar'}
          </button>
        )}
      </div>

      {/* Arabic */}
      <p
        dir="rtl"
        className="text-right text-2xl leading-[2.2] font-arabic text-[--foreground] tracking-wide"
      >
        {arabic}
      </p>

      {/* Translation */}
      {translation && (
        <p className="text-sm text-[--muted-foreground] leading-relaxed italic">
          {ayahNumber === 1 ? translation : translation}
        </p>
      )}
    </div>
  )
}

// ── Surah reader ─────────────────────────────────────────────────────────────
function SurahReader({
  surahNumber,
  onBack,
}: {
  surahNumber: number
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useSurahDetail(surahNumber)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playAllActiveRef = useRef(false)

  // ── Stop everything ─────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    playAllActiveRef.current = false
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    setPlayingAyah(null)
    setIsPlayingAll(false)
  }, [])

  // ── Play a single ayah (toggle) ──────────────────────────────────────────
  const playAyah = useCallback(
    (globalNumber: number, url: string) => {
      playAllActiveRef.current = false
      setIsPlayingAll(false)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      if (playingAyah === globalNumber) { setPlayingAyah(null); return }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play().catch(() => {})
      setPlayingAyah(globalNumber)
      audio.onended = () => setPlayingAyah(null)
    },
    [playingAyah]
  )

  const pauseAyah = useCallback(() => {
    audioRef.current?.pause()
    setPlayingAyah(null)
  }, [])

  // ── Play all sequentially ────────────────────────────────────────────────
  const playFromIndex = useCallback(
    (idx: number) => {
      if (!playAllActiveRef.current || !data) return
      if (idx >= data.ayahs.length) {
        playAllActiveRef.current = false
        setPlayingAyah(null)
        setIsPlayingAll(false)
        return
      }
      const ayah = data.ayahs[idx]
      if (!ayah.audio) { playFromIndex(idx + 1); return }
      const audio = new Audio(ayah.audio)
      audioRef.current = audio
      setPlayingAyah(ayah.number)
      audio.play().catch(() => { playFromIndex(idx + 1) })
      audio.onended = () => playFromIndex(idx + 1)
    },
    [data]
  )

  const startPlayAll = useCallback(() => {
    stopAll()
    setIsPlayingAll(true)
    playAllActiveRef.current = true
    setTimeout(() => playFromIndex(0), 0)
  }, [stopAll, playFromIndex])

  // stop audio on unmount
  useEffect(() => {
    return () => {
      playAllActiveRef.current = false
      audioRef.current?.pause()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-[--primary]" size={32} />
        <p className="text-sm text-[--muted-foreground]">Memuat surah...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 p-6 text-center">
        <p className="text-3xl">😞</p>
        <p className="font-semibold">Gagal memuat surah</p>
        <p className="text-sm text-[--muted-foreground]">Periksa koneksi internet kamu dan coba lagi.</p>
        <button onClick={onBack} className="text-[--primary] text-sm font-semibold mt-2">
          ← Kembali ke daftar
        </button>
      </div>
    )
  }

  // no basmalah for Al-Fatihah (1) and At-Tawbah (9)
  const showBasmalah = surahNumber !== 1 && surahNumber !== 9

  return (
    <div className="flex flex-col">
      {/* Sticky surah header */}
      <div className="sticky top-0 z-10 bg-[--background]/95 backdrop-blur-md border-b border-[--border] pb-3 mb-2">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center hover:bg-[--border] transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="font-bold text-base leading-tight">
              {data.englishName} — {data.name}
            </p>
            <p className="text-xs text-[--muted-foreground]">
              {data.englishNameTranslation} · {data.numberOfAyahs} ayat ·{' '}
              {data.revelationType === 'Meccan' ? 'Makkiyyah' : 'Madaniyyah'}
            </p>
          </div>
          {/* Play All / Stop */}
          {isPlayingAll ? (
            <button
              onClick={stopAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[--destructive]/10 text-[--destructive] text-xs font-semibold hover:bg-[--destructive]/20 transition-colors shrink-0"
            >
              <StopCircle size={14} />
              Stop
            </button>
          ) : (
            <button
              onClick={startPlayAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[--primary]/10 text-[--primary] text-xs font-semibold hover:bg-[--primary]/20 transition-colors shrink-0"
            >
              <ListMusic size={14} />
              Play All
            </button>
          )}
        </div>

        {/* Mark to tracker button */}
        <button
          onClick={() => navigate('/tracker', { state: { openTab: 'tilawah' } })}
          className="w-full py-2 rounded-xl bg-[--primary]/10 text-[--primary] text-sm font-semibold hover:bg-[--primary]/20 transition-colors"
        >
          + Catat halaman ke Tracker Tilawah
        </button>
      </div>

      {/* Basmalah */}
      {showBasmalah && (
        <p
          dir="rtl"
          className="text-center text-2xl font-arabic text-[--primary] leading-loose pb-4 border-b border-[--border] mb-4"
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {/* Ayahs */}
      {data.ayahs.map((ayah) => (
        <AyahRow
          key={ayah.number}
          ayahNumber={ayah.number}
          numberInSurah={ayah.numberInSurah}
          arabic={ayah.text}
          translation={ayah.translation}
          audioUrl={ayah.audio}
          isPlaying={playingAyah === ayah.number}
          onPlay={() => playAyah(ayah.number, ayah.audio!)}
          onPause={pauseAyah}
        />
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function QuranPage() {
  const { data: surahs, isLoading, isError } = useSurahList()
  const [search, setSearch] = useState('')
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null)

  const filtered = (surahs ?? []).filter(
    (s) =>
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
      String(s.number).includes(search)
  )

  return (
    <AppLayout>
      <div className="px-4 pt-5 pb-2">
        {/* Page header (only when on list view) */}
        <AnimatePresence mode="wait">
          {selectedSurah === null ? (
            <motion.div
              key="header-list"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[--primary]/10 flex items-center justify-center">
                  <BookOpen size={20} className="text-[--primary]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Al-Qur'an</h1>
                  <p className="text-xs text-[--muted-foreground]">114 surah · terjemahan Indonesia</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]"
                />
                <Input
                  placeholder="Cari surah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Quick shortcuts */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Al-Fatihah', n: 1 },
                  { label: 'Yasin', n: 36 },
                  { label: 'Al-Mulk', n: 67 },
                  { label: 'Al-Kahfi', n: 18 },
                  { label: 'Ar-Rahman', n: 55 },
                ].map(({ label, n }) => (
                  <button
                    key={n}
                    onClick={() => setSelectedSurah(n)}
                    className="px-3 py-1.5 rounded-full bg-[--secondary] text-[--secondary-foreground] text-xs font-semibold hover:opacity-80 active:scale-95 transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Surah list */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Loader2 className="animate-spin text-[--primary]" size={28} />
                  <p className="text-sm text-[--muted-foreground]">Memuat daftar surah...</p>
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                  <p className="text-3xl">📡</p>
                  <p className="font-semibold text-sm">Koneksi bermasalah</p>
                  <p className="text-xs text-[--muted-foreground]">Pastikan kamu terhubung ke internet.</p>
                </div>
              )}

              {!isLoading && !isError && (
                <div className="flex flex-col gap-2">
                  {filtered.length === 0 ? (
                    <p className="text-center text-sm text-[--muted-foreground] py-8">
                      Surah "{search}" tidak ditemukan.
                    </p>
                  ) : (
                    filtered.map((surah) => (
                      <SurahCard
                        key={surah.number}
                        surah={surah}
                        onClick={() => {
                          setSelectedSurah(surah.number)
                          setSearch('')
                        }}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Juz indicator pills */}
              {!search && !isLoading && !isError && (
                <div className="flex flex-col items-center pb-4 mt-2">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                      <Badge key={juz} variant="outline" className="text-xs cursor-default">
                        Juz {juz}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`reader-${selectedSurah}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.2 }}
            >
              <SurahReader
                surahNumber={selectedSurah}
                onBack={() => setSelectedSurah(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
