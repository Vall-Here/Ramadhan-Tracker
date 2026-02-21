import { useQuery } from '@tanstack/react-query'

const BASE = 'https://api.alquran.cloud/v1'

export interface Surah {
  number: number
  name: string           // Arabic name
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

export interface Ayah {
  number: number          // global ayah number
  numberInSurah: number
  text: string            // Arabic (uthmani)
  translation?: string    // Indonesian
  audio?: string          // mp3 url
  juz: number
  page: number
}

export interface SurahDetail {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
  ayahs: Ayah[]
}

// --- Fetch all 114 surahs ---
async function fetchSurahList(): Promise<Surah[]> {
  const res = await fetch(`${BASE}/surah`)
  if (!res.ok) throw new Error('Gagal memuat daftar surah')
  const json = await res.json()
  return json.data as Surah[]
}

export function useSurahList() {
  return useQuery<Surah[]>({
    queryKey: ['surah-list'],
    queryFn: fetchSurahList,
    staleTime: Infinity, // surah list never changes
    gcTime: Infinity,
  })
}

// --- Fetch a surah with Arabic + Indonesian translation ---
async function fetchSurahDetail(number: number): Promise<SurahDetail> {
  const [arabicRes, idRes] = await Promise.all([
    fetch(`${BASE}/surah/${number}/quran-uthmani`),
    fetch(`${BASE}/surah/${number}/id.indonesian`),
  ])
  if (!arabicRes.ok || !idRes.ok) throw new Error('Gagal memuat surah')

  const [arabicJson, idJson] = await Promise.all([arabicRes.json(), idRes.json()])

  const arabicData = arabicJson.data
  const idAyahs: { numberInSurah: number; text: string }[] = idJson.data.ayahs

  const ayahs: Ayah[] = arabicData.ayahs.map(
    (a: { number: number; numberInSurah: number; text: string; juz: number; page: number }, i: number) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.text,
      translation: idAyahs[i]?.text,
      audio: `https://cdn.islamic.network/quran/audio/128/ar.husary/${a.number}.mp3`,
      juz: a.juz,
      page: a.page,
    })
  )

  return {
    number: arabicData.number,
    name: arabicData.name,
    englishName: arabicData.englishName,
    englishNameTranslation: arabicData.englishNameTranslation,
    numberOfAyahs: arabicData.numberOfAyahs,
    revelationType: arabicData.revelationType,
    ayahs,
  }
}

export function useSurahDetail(number: number | null) {
  return useQuery<SurahDetail>({
    queryKey: ['surah-detail', number],
    queryFn: () => fetchSurahDetail(number!),
    enabled: number !== null,
    staleTime: 1000 * 60 * 60, // cache 1 hour
  })
}
