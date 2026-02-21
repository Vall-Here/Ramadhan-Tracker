import { useQuery } from '@tanstack/react-query'

const BASE = 'https://api.aladhan.com/v1'

// Calculation method 11 = Moonsighting Committee Worldwide (closest to MUI/Indonesia)
const METHOD = 11

export interface PrayerTimes {
  isoDate: string      // YYYY-MM-DD
  hijriLabel: string   // e.g. "1 Ramadhan 1447"
  readableDate: string // e.g. "Selasa, 17 Maret 2026"
  timings: {
    Imsak: string
    Fajr: string
    Sunrise: string
    Dhuhr: string
    Asr: string
    Maghrib: string
    Isha: string
  }
}

function stripZone(t: string): string {
  // "04:30 (WIB)" → "04:30"
  return t.replace(/\s*\(.*\)/, '').trim()
}

// Convert Aladhan's DD-MM-YYYY to YYYY-MM-DD
function ddmmyyyyToISO(s: string): string {
  const [dd, mm, yyyy] = s.split('-')
  return `${yyyy}-${mm}-${dd}`
}

interface AladhanDay {
  timings: Record<string, string>
  date: {
    gregorian: { date: string }
    hijri: { day: string; month: { en: string }; year: string }
  }
}

function mapDay(d: AladhanDay): PrayerTimes {
  const iso = ddmmyyyyToISO(d.date.gregorian.date)
  const dt = new Date(iso)
  const readableDate = dt.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const hijri = d.date.hijri
  const hijriMonthMap: Record<string, string> = {
    Muharram: 'Muharram', Safar: 'Safar', "Rabi' al-awwal": 'Rabiulawal',
    "Rabi' al-thani": 'Rabiulakhir', 'Jumada al-awwal': 'Jumadilula',
    'Jumada al-thani': 'Jumadilakhir', Rajab: 'Rajab',
    "Sha'ban": 'Syaban', Ramadan: 'Ramadhan',
    Shawwal: 'Syawal', "Dhu al-Qi'dah": 'Dzulkaidah',
    'Dhu al-Hijjah': 'Dzulhijjah',
    // Alternate spellings from API
    'Shaʿbān': 'Syaban', 'Ramaḍān': 'Ramadhan', 'Shawwāl': 'Syawal',
  }
  const monthId = hijriMonthMap[hijri.month.en] ?? hijri.month.en
  const hijriLabel = `${hijri.day} ${monthId} ${hijri.year}`

  return {
    isoDate: iso,
    hijriLabel,
    readableDate,
    timings: {
      Imsak: stripZone(d.timings.Imsak),
      Fajr: stripZone(d.timings.Fajr),
      Sunrise: stripZone(d.timings.Sunrise),
      Dhuhr: stripZone(d.timings.Dhuhr),
      Asr: stripZone(d.timings.Asr),
      Maghrib: stripZone(d.timings.Maghrib),
      Isha: stripZone(d.timings.Isha),
    },
  }
}

async function fetchMonthCalendar(lat: number, lon: number, year: number, month: number): Promise<PrayerTimes[]> {
  const url = `${BASE}/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${METHOD}&school=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Gagal mengambil jadwal imsakiyah')
  const json = await res.json()
  return (json.data as AladhanDay[]).map(mapDay)
}

// Geolocation promise — always resolves (falls back to Jakarta)
export async function getCoords(): Promise<{ lat: number; lon: number; city: string }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: -6.2088, lon: 106.8456, city: 'Jakarta' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: 'Lokasi Kamu' }),
      () => resolve({ lat: -6.2088, lon: 106.8456, city: 'Jakarta' }),
      { timeout: 5000 }
    )
  })
}

export function useImsakiyahMonth(lat: number | null, lon: number | null, year: number, month: number) {
  return useQuery<PrayerTimes[]>({
    queryKey: ['imsakiyah', lat, lon, year, month],
    queryFn: () => fetchMonthCalendar(lat!, lon!, year, month),
    enabled: lat !== null && lon !== null,
    staleTime: 1000 * 60 * 60 * 6, // cache 6h
    gcTime: 1000 * 60 * 60 * 24,
  })
}

// Return the next prayer name + time from now
export function getNextPrayer(
  timings: PrayerTimes['timings'],
  now = new Date()
): { name: string; label: string; time: string; minutesLeft: number } {
  const prayers: { key: keyof PrayerTimes['timings']; label: string }[] = [
    { key: 'Imsak',   label: 'Imsak' },
    { key: 'Fajr',    label: 'Subuh' },
    { key: 'Dhuhr',   label: 'Dzuhur' },
    { key: 'Asr',     label: 'Ashar' },
    { key: 'Maghrib', label: 'Maghrib (Iftar)' },
    { key: 'Isha',    label: "Isya'" },
  ]

  const todayStr = now.toISOString().split('T')[0]
  for (const p of prayers) {
    const [h, m] = timings[p.key].split(':').map(Number)
    const prayerDate = new Date(`${todayStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
    if (prayerDate > now) {
      const minutesLeft = Math.floor((prayerDate.getTime() - now.getTime()) / 60000)
      return {
        name: p.key,
        label: p.label,
        time: timings[p.key],
        minutesLeft,
      }
    }
  }
  // After Isha — show next day Imsak
  return { name: 'Imsak', label: 'Imsak Besok', time: timings.Imsak, minutesLeft: 0 }
}
