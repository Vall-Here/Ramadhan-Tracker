import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function todayISO(): string {
  return formatDate(new Date())
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatHijriDate(): string {
  try {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  } catch {
    return ''
  }
}

export function getDayOfRamadhan(): number {
  // Returns current day of Ramadhan if within range, otherwise 0
  const now = new Date()
  // Ramadhan 2026: approx Mar 17 – Apr 15
  const start = new Date('2026-03-17')
  const end = new Date('2026-04-15')
  if (now >= start && now <= end) {
    return Math.ceil((now.getTime() - start.getTime()) / 86400000) + 1
  }
  return 0
}

export function getPrayerLabel(key: string): string {
  const labels: Record<string, string> = {
    fajr: 'Subuh',
    dhuhr: 'Dzuhur',
    asr: 'Ashar',
    maghrib: 'Maghrib',
    isha: "Isya'",
    tarawih: 'Tarawih',
    witir: 'Witir',
    dhuha: 'Dhuha',
    qiyam: 'Qiyamul Lail',
  }
  return labels[key] ?? key
}

export function xpForActivity(activity: string): number {
  const xp: Record<string, number> = {
    fajr: 30,
    dhuhr: 20,
    asr: 20,
    maghrib: 20,
    isha: 20,
    tarawih: 25,
    witir: 15,
    dhuha: 20,
    qiyam: 35,
    fasting_full: 50,
    fasting_partial: 20,
    quran_page: 5,
    charity: 30,
    journal: 15,
  }
  return xp[activity] ?? 10
}
