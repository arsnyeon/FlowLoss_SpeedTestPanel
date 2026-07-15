import iosSound from '@/assets/ios.mp3'
import androidSound from '@/assets/android.mp3'

const isMobile = /Mobi|Android|iPhone|Macintosh/i.test(navigator.userAgent)
const isMiuiBrowser = /MiuiBrowser/i.test(navigator.userAgent)
const isIOS = /iPhone|Macintosh/i.test(navigator.userAgent)

const sounds = { ios: iosSound, android: androidSound }

let audioEl: HTMLAudioElement | null = null
let isRunningFn: (() => boolean) | null = null
let runBackgroundFn: (() => boolean) | null = null
let onAudioPause: (() => void) | null = null

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = document.createElement('audio')
    audioEl.loop = true
    audioEl.style.display = 'none'
    audioEl.src = isIOS ? sounds.ios : sounds.android
    document.body.appendChild(audioEl)

    audioEl.addEventListener('canplay', () => {
      if (isRunningFn?.() && runBackgroundFn?.()) {
        audioEl!.play().catch(() => {})
      }
    })

    audioEl.addEventListener('pause', () => {
      if (isRunningFn?.() && runBackgroundFn?.()) {
        onAudioPause?.()
      }
    })
  }
  return audioEl
}

function start() {
  if (!isMobile || isMiuiBrowser || !runBackgroundFn?.()) return
  const audio = getAudio()
  audio.play().catch(() => {})
}

function stop() {
  audioEl?.pause()
}

export function useBackgroundKeepAlive(
  isRunning: () => boolean,
  runBackground: () => boolean,
  onPause?: () => void,
) {
  isRunningFn = isRunning
  runBackgroundFn = runBackground
  if (onPause) onAudioPause = onPause

  return { start, stop }
}
