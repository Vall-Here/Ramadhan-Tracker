import { create } from 'zustand'
import type { PrayerName, PrayerStatus } from '@/types'

interface TrackerState {
  selectedDate: string
  prayerStatuses: Record<PrayerName, PrayerStatus>
  fastingStatus: 'full' | 'partial' | 'skip' | null
  pagesRead: number
  setSelectedDate: (date: string) => void
  setPrayerStatus: (prayer: PrayerName, status: PrayerStatus) => void
  setFastingStatus: (status: TrackerState['fastingStatus']) => void
  setPagesRead: (pages: number) => void
  reset: () => void
}

const defaultPrayers: Record<PrayerName, PrayerStatus> = {
  fajr: null,
  dhuhr: null,
  asr: null,
  maghrib: null,
  isha: null,
  tarawih: null,
  witir: null,
  dhuha: null,
  qiyam: null,
}

export const useTrackerStore = create<TrackerState>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  prayerStatuses: { ...defaultPrayers },
  fastingStatus: null,
  pagesRead: 0,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setPrayerStatus: (prayer, status) =>
    set((state) => ({
      prayerStatuses: { ...state.prayerStatuses, [prayer]: status },
    })),
  setFastingStatus: (status) => set({ fastingStatus: status }),
  setPagesRead: (pages) => set({ pagesRead: pages }),
  reset: () =>
    set({
      prayerStatuses: { ...defaultPrayers },
      fastingStatus: null,
      pagesRead: 0,
    }),
}))
