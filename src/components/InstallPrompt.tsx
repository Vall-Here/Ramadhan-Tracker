import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa_install_dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSInstructionOpen, setIsIOSInstructionOpen] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed recently
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed && Date.now() - Number(dismissed) < 1000 * 60 * 60 * 24 * 7) return

    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // iOS detection — iOS doesn't fire beforeinstallprompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as unknown as { standalone?: boolean }).standalone
    if (ios) {
      setIsIOS(true)
      setTimeout(() => setShow(true), 2500)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 2500)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed bottom-[calc(var(--bottom-nav-height)+12px)] left-3 right-3 z-[60] rounded-2xl shadow-2xl border border-[--border] overflow-hidden"
          style={{ backgroundColor: 'var(--card)' }}
        >
          <div className="flex items-center gap-3 p-4">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-[--primary]/10 flex items-center justify-center shrink-0">
              <Smartphone size={20} className="text-[--primary]" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">Pasang ke Homescreen</p>
              <p className="text-xs text-[--muted-foreground] mt-0.5">
                {isIOS ? 'Buka di Safari → Bagikan → "Add to Home Screen"' : 'Akses lebih cepat tanpa buka browser'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!isIOS && (
                <button
                  onClick={isIOS ? () => setIsIOSInstructionOpen(true) : install}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[--primary] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <Download size={13} />
                  Pasang
                </button>
              )}
              {isIOS && (
                <button
                  onClick={() => setIsIOSInstructionOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[--primary] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Cara
                </button>
              )}
              <button
                onClick={dismiss}
                className="w-8 h-8 rounded-xl bg-[--muted] flex items-center justify-center hover:bg-[--border] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* iOS step-by-step instruction strip */}
          <AnimatePresence>
            {isIOS && isIOSInstructionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[--border] overflow-hidden"
              >
                <div className="px-4 py-3 flex gap-4 text-xs text-[--muted-foreground]">
                  {[
                    { step: '1', text: 'Buka di Safari' },
                    { step: '2', text: 'Tap ikon Bagikan (□↑)' },
                    { step: '3', text: 'Pilih "Add to Home Screen"' },
                    { step: '4', text: 'Tap "Add" / "Tambah"' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-6 h-6 rounded-full bg-[--primary]/15 text-[--primary] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {step}
                      </div>
                      <p className="text-center leading-tight">{text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
