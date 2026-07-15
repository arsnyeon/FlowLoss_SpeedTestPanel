import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const runBackground = ref(localStorage.getItem('runBackground') === 'true')
  const autoStart = ref(localStorage.getItem('autoStart') === 'true')
  const threadNum = ref(parseInt(localStorage.getItem('threadNum') || '8'))
  const maxUse = ref(parseInt(localStorage.getItem('maxUse') || '0'))
  const maxSpeed = ref(parseInt(localStorage.getItem('maxSpeed') || '0'))
  const urlValue = ref(localStorage.getItem('urlValue') || '')
  const groupMode = ref(localStorage.getItem('groupMode') === 'true')
  const groupValue = ref(localStorage.getItem('groupValue') || '')
  const chartShow = ref(localStorage.getItem('chartShow') !== 'false')
  const noCache = ref(localStorage.getItem('noCache') === 'true')
  const normalizeThreadNum = (value: number) => {
    const safeValue = Number.isFinite(value) ? Math.trunc(value) : 8
    return Math.max(1, Math.min(64, safeValue))
  }

  threadNum.value = normalizeThreadNum(threadNum.value)

  const cronTab = ref(JSON.parse(localStorage.getItem('cronTab') || JSON.stringify({
    status: false,
    mode: 'interval',
    section: 15,
    unit: 's',
    onset: 0,
    over: 23,
    tasks: 0,
  })))

  cronTab.value.tasks = 0
  if (!cronTab.value.mode) cronTab.value.mode = 'interval'

  const nodeRotation = ref<{
    enabled: boolean
    nodes: { url: string; label: string; trafficLimit: number; maxRuns: number }[]
  }>(JSON.parse(localStorage.getItem('nodeRotation') || JSON.stringify({
    enabled: false,
    nodes: [],
  })))

  if (groupMode.value) nodeRotation.value.enabled = false

  watch(runBackground, v => localStorage.setItem('runBackground', String(v)))
  watch(autoStart, v => localStorage.setItem('autoStart', String(v)))
  watch(threadNum, v => {
    const next = normalizeThreadNum(v)
    if (next !== v) {
      threadNum.value = next
      return
    }
    localStorage.setItem('threadNum', String(v))
  })
  watch(maxUse, v => localStorage.setItem('maxUse', String(v)))
  watch(maxSpeed, v => localStorage.setItem('maxSpeed', String(v)))
  watch(urlValue, v => localStorage.setItem('urlValue', v))
  watch(groupMode, v => localStorage.setItem('groupMode', String(v)))
  watch(groupValue, v => localStorage.setItem('groupValue', v))
  watch(chartShow, v => localStorage.setItem('chartShow', String(v)))
  watch(noCache, v => localStorage.setItem('noCache', String(v)))
  watch(cronTab, v => localStorage.setItem('cronTab', JSON.stringify(v)), { deep: true })
  watch(nodeRotation, v => localStorage.setItem('nodeRotation', JSON.stringify(v)), { deep: true })

  return { runBackground, autoStart, threadNum, maxUse, maxSpeed, urlValue, groupMode, groupValue, chartShow, noCache, cronTab, nodeRotation }
})
