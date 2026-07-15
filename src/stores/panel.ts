import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePanelStore = defineStore('panel', () => {
  let dailyUsageSaveTimer: ReturnType<typeof setTimeout> | null = null
  let dailyUsageDate = ''
  const isRunning = ref(false)
  const isChecking = ref(false)
  const bytesUsed = ref(0)
  const speed = ref(0)
  const speedBit = ref(0)
  const runTimeStamp = ref(0)
  const runTimeShow = ref('00s')
  const lastError = ref('')
  const lastWarning = ref('')
  const dailyBytesUsed = ref(0)
  const dailyLimitReached = ref(false)

  const show = ref({
    allUsed: '-',
    speed: '-',
    speedBit: '-',
  })

  const predict = ref({
    min: '-',
    hour: '-',
    day: '-',
    mon: '-',
  })

  function todayKey() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
  }

  function persistDailyUsage() {
    dailyUsageDate = todayKey()
    localStorage.setItem('dailyUsage', JSON.stringify({ date: dailyUsageDate, bytes: dailyBytesUsed.value }))
  }

  function scheduleDailyUsageSave() {
    if (dailyUsageSaveTimer) return
    dailyUsageSaveTimer = setTimeout(() => {
      dailyUsageSaveTimer = null
      persistDailyUsage()
    }, 250)
  }

  function loadDailyUsage() {
    const today = todayKey()
    dailyUsageDate = today
    const stored = localStorage.getItem('dailyUsage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.date === today) {
          dailyBytesUsed.value = parsed.bytes
          return
        }
      } catch {}
    }
    dailyBytesUsed.value = 0
    dailyLimitReached.value = false
  }

  function addDailyUsage(bytes: number) {
    const today = todayKey()
    if (dailyUsageDate !== today) {
      dailyUsageDate = today
      dailyBytesUsed.value = 0
    }
    dailyBytesUsed.value += bytes
    scheduleDailyUsageSave()
  }

  function syncDailyUsage(serverBytes: number) {
    if (serverBytes > dailyBytesUsed.value) {
      dailyBytesUsed.value = serverBytes
      persistDailyUsage()
    }
  }

  function reset() {
    bytesUsed.value = 0
    speed.value = 0
    speedBit.value = 0
    runTimeStamp.value = 0
    runTimeShow.value = '00s'
    show.value = { allUsed: '-', speed: '-', speedBit: '-' }
    predict.value = { min: '-', hour: '-', day: '-', mon: '-' }
    lastError.value = ''
    lastWarning.value = ''
  }

  function resetTraffic() {
    bytesUsed.value = 0
    show.value = {
      ...show.value,
      allUsed: '-',
    }
  }

  loadDailyUsage()

  return { isRunning, isChecking, bytesUsed, speed, speedBit, runTimeStamp, runTimeShow, show, predict, lastError, lastWarning, dailyBytesUsed, dailyLimitReached, addDailyUsage, syncDailyUsage, loadDailyUsage, resetTraffic, reset }
})
