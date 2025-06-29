'use client'

export function registerSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  }
}

export function unregisterSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

// PWA Install prompt
export function usePWAInstall() {
  if (typeof window === 'undefined') return { installPrompt: null, isInstallable: false, install: () => {} }

  let deferredPrompt: any = null
  let isInstallable = false

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    isInstallable = true
  })

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to the install prompt: ${outcome}`)
      deferredPrompt = null
      isInstallable = false
    }
  }

  return { installPrompt: deferredPrompt, isInstallable, install }
}