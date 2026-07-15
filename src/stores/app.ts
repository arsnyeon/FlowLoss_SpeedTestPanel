import { defineStore } from 'pinia'
import { ref } from 'vue'

type ThemeMode = 'light' | 'dark' | 'auto'

export const useAppStore = defineStore('app', () => {
  const defaultSiteName = ''
  const themeMode = ref<ThemeMode>((localStorage.getItem('themeMode') as ThemeMode) || 'auto')
  const isDark = ref(false)
  const siteName = ref(defaultSiteName)
  const siteVersion = ref('1.0')

  let mediaQuery: MediaQueryList | null = null

  function applyTheme() {
    if (themeMode.value === 'auto') {
      isDark.value = mediaQuery?.matches ?? false
    } else {
      isDark.value = themeMode.value === 'dark'
    }
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    localStorage.setItem('themeMode', mode)
    applyTheme()
  }

  function toggleDark() {
    if (themeMode.value === 'light') setThemeMode('dark')
    else if (themeMode.value === 'dark') setThemeMode('auto')
    else setThemeMode('light')
  }

  function initTheme() {
    // Migrate old darkMode setting
    const oldDarkMode = localStorage.getItem('darkMode')
    if (oldDarkMode !== null && !localStorage.getItem('themeMode')) {
      themeMode.value = oldDarkMode === 'true' ? 'dark' : 'light'
      localStorage.setItem('themeMode', themeMode.value)
      localStorage.removeItem('darkMode')
    }

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', applyTheme)
    applyTheme()
  }

  function setSiteName(name: string | null | undefined) {
    siteName.value = name?.trim() || defaultSiteName
  }

  function setSiteVersion(version: string | null | undefined) {
    siteVersion.value = version?.trim() || '1.0'
  }

  return { isDark, themeMode, siteName, siteVersion, toggleDark, setThemeMode, initTheme, setSiteName, setSiteVersion }
})
