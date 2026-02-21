export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'tarawih' | 'witir' | 'dhuha' | 'qiyam'
export type PrayerStatus = 'ontime' | 'qadha' | 'skipped' | null

export interface PrayerLog {
  id: string
  user_id: string
  date: string
  prayer_name: PrayerName
  status: PrayerStatus
  on_time: boolean
  created_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  fasting_status: 'full' | 'partial' | 'skip' | null
  notes: string | null
  created_at: string
}

export interface QuranLog {
  id: string
  user_id: string
  date: string
  pages_read: number
  juz_read: number
  minutes: number
  last_surah: string | null
  last_ayah: number | null
  created_at: string
}

export interface CharityLog {
  id: string
  user_id: string
  date: string
  amount: number
  channel: string
  note: string | null
  created_at: string
}

export interface HabitStreak {
  id: string
  user_id: string
  habit_key: string
  current_streak: number
  best_streak: number
  last_logged_date: string | null
}

export interface Badge {
  id: string
  code: string
  title: string
  description: string
  icon: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  awarded_at: string
  badge?: Badge
}

export interface UserProfile {
  user_id: string
  avatar_url: string | null
  onboarding_level: number
  quran_target_pages: number
  quran_target_juz: number
  charity_target: number
  city: string | null
  latitude: number | null
  longitude: number | null
  privacy_setting: 'private' | 'public'
}

export interface DailySummary {
  date: string
  prayers_done: number
  prayers_total: number
  fasting: DailyLog['fasting_status']
  pages_read: number
  charity_amount: number
  xp_earned: number
}
