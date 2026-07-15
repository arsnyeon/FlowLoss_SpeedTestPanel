import { watch } from 'vue'
import { usePanelStore } from '@/stores/panel'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import { useNodesStore } from '@/stores/nodes'
import { useFormatter } from '@/composables/useFormatter'
import { useBackgroundKeepAlive } from '@/composables/useBackgroundKeepAlive'
import { validateSpeedNodeUrl } from '@/utils/nodeConnectivity'
import { getSpeedDailyUsage } from '@/api/public'
import { useRouter } from 'vue-router'
import { safeWebNodeHeaders } from '@/utils/webNodeHeaders'
import type { NodeItem } from '@/stores/nodes'

type ChartTarget = {
  addDataPoint?: (speed: number, latency: number) => void
  clearData?: () => void
}

let initialized = false
let chartTarget: ChartTarget | null = null
let urlSolve = ''
let loggedBytes = 0
let lastLogTime = 0
let recordUse = 0
let recordTime = 0
let startUse = 0
let startTime = 0
let stepLength = 1
let speedTemp: number[] = []
let tasks: number[] = []
let cronTask = 0
let rotationBytesAtSwitch = 0
let rotationRunCounts: number[] = []
let rotationCurrentIndex = 0
let speedSessionId = ''
let visibilityHandler: (() => void) | null = null
let abortController: AbortController | null = null

export function useSpeedRunner(target?: ChartTarget | null) {
  const panel = usePanelStore()
  const settings = useSettingsStore()
  const user = useUserStore()
  const nodesStore = useNodesStore()
  const router = useRouter()
  const { format, formatBytes, formatSpeed, formatBandwidth, formatRunTime } = useFormatter()
  const keepAlive = useBackgroundKeepAlive(
    () => panel.isRunning,
    () => settings.runBackground,
    () => { panel.isRunning = false },
  )

  if (target !== undefined) chartTarget = target

  function setChartTarget(target: ChartTarget | null) {
    chartTarget = target
  }

  function setUsed() {
    panel.show.allUsed = panel.bytesUsed > 0 ? formatBytes(panel.bytesUsed) : '-'
  }

  function setSpeed(speed: number) {
    if (!speed || speed <= 0 || Number.isNaN(speed)) {
      panel.speed = 0
      panel.speedBit = 0
      panel.show.speed = '-'
      panel.show.speedBit = '-'
      return
    }

    panel.speed = speed
    panel.speedBit = speed * 8
    panel.show.speed = formatSpeed(speed)
    panel.show.speedBit = formatBandwidth(speed * 8)
    panel.predict.min = formatBytes(speed * 60)
    panel.predict.hour = formatBytes(speed * 60 * 60)
    panel.predict.day = formatBytes(speed * 60 * 60 * 24)
    panel.predict.mon = formatBytes(speed * 60 * 60 * 24 * 30)
  }

  function getHomeTitle(): string {
    return document.title || 'FlowLoss'
  }

  function setTitle(speed?: number) {
    if (document.visibilityState === 'visible') return
    if (!settings.runBackground) return
    if (router.currentRoute.value.path !== '/') return
    if (!panel.isRunning) {
      if (settings.maxUse && panel.bytesUsed >= settings.maxUse) {
        document.title = '已完成'
      } else {
        document.title = '已暂停'
      }
      return
    }
    const speedText = speed ? formatSpeed(speed) : panel.show.speed
    document.title = `${formatBytes(panel.bytesUsed)} ${speedText}`
  }

  async function checkUrl(url: string) {
    return validateSpeedNodeUrl(url)
  }

  function activeGroupNodes() {
    if (!settings.groupMode || !settings.groupValue) return []
    return (nodesStore.groupedNodes[settings.groupValue] || []).filter(node => node.status !== false)
  }

  function threadTarget(threadIndex: number, attempt = 0): NodeItem | null {
    if (!settings.groupMode) {
      const allNodes = Object.values(nodesStore.groupedNodes).flat()
      return allNodes.find(node => node.url === settings.urlValue) || {
        title: settings.urlValue,
        url: settings.urlValue,
        status: true,
      }
    }

    const nodes = activeGroupNodes()
    if (!nodes.length) return null
    if (nodes.length <= settings.threadNum) return nodes[threadIndex % nodes.length]
    const bucket = nodes.filter((_, index) => index % settings.threadNum === threadIndex % settings.threadNum)
    return bucket[attempt % bucket.length]
  }

  async function apiSolver() {
    if (settings.groupMode) {
      urlSolve = activeGroupNodes()[0]?.url || ''
      if (!urlSolve) {
        panel.isRunning = false
        throw new Error('所选节点组没有可用节点')
      }
      return
    }
    urlSolve = settings.urlValue
  }

  function nodeRequest(node?: NodeItem | null) {
    const stored = node || Object.values(nodesStore.groupedNodes).flat().find(item => item.url === settings.urlValue)
      || nodesStore.getCustomNodeByUrl(settings.urlValue)
    const method = stored?.method || 'GET'
    const storedUrl = stored && 'url' in stored ? stored.url : stored?.value
    const storedHeaders = stored && 'headers' in stored ? stored.headers : undefined
    const headerResult = safeWebNodeHeaders(storedHeaders, storedUrl || settings.urlValue)
    if (headerResult.removedSensitive) {
      panel.lastWarning = 'HTTP 节点的敏感请求头已自动忽略，请改用 HTTPS'
    }
    return {
      method,
      postData: method === 'POST' ? stored?.postData || '' : '',
      headers: headerResult.headers,
    }
  }

  const threadBytesMap = new Map<number, { val: number; lastReset: number }>()

  const speedCtr = (threadIndex: number) => {
    let tb = threadBytesMap.get(threadIndex)
    if (!tb) {
      tb = { val: 0, lastReset: Date.now() }
      threadBytesMap.set(threadIndex, tb)
    }
    const now = Date.now()
    const elapsed = now - tb.lastReset
    if (elapsed >= 1000) {
      tb.val = 0
      tb.lastReset = now
    }
    const perThreadLimit = settings.maxSpeed / 8 / settings.threadNum
    if (tb.val >= perThreadLimit) {
      const wait = 1000 - (now - tb.lastReset)
      return new Promise((resolve) => {
        setTimeout(() => {
          tb!.val = 0
          tb!.lastReset = Date.now()
          resolve(0)
        }, Math.max(wait, 10))
      })
    }
  }

  function speedCtrAdd(threadIndex: number, bytes: number) {
    const tb = threadBytesMap.get(threadIndex)
    if (tb) tb.val += bytes
  }

  function recordTransferBytes(count: number) {
    if (!Number.isFinite(count) || count <= 0) return
    panel.bytesUsed += count
    panel.addDailyUsage(count)
    user.addDosage(count)
  }

  async function delay(ms: number, signal?: AbortSignal) {
    if (ms <= 0 || signal?.aborted) return
    await new Promise<void>(resolve => {
      const timer = window.setTimeout(done, ms)
      function done() {
        signal?.removeEventListener('abort', done)
        window.clearTimeout(timer)
        resolve()
      }
      signal?.addEventListener('abort', done, { once: true })
    })
  }

  async function startThread(index: number) {
    const currentAbort = abortController
    let attempt = 0
    while (panel.isRunning && !currentAbort?.signal.aborted && index < settings.threadNum) {
      const target = threadTarget(index, attempt)
      if (!target?.url) return
      const requestConfig = nodeRequest(target)
      let fetchUrl = target.url
      if (settings.noCache) {
        const sep = fetchUrl.includes('?') ? '&' : '?'
        fetchUrl = `${fetchUrl}${sep}_=${Date.now()}.${index}`
      }
      try {
        const response = await fetch(fetchUrl, {
          method: requestConfig.method,
          body: requestConfig.method === 'POST' ? requestConfig.postData : undefined,
          headers: requestConfig.headers,
          cache: 'no-store',
          mode: 'cors',
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          signal: currentAbort?.signal,
        })
        if (!response.ok || !response.body) throw new Error(`下载节点响应异常 ${response.status}`)
        const contentLength = response.headers.get('content-length')
        const realLength = contentLength ? parseInt(contentLength) : Infinity
        const reader = response.body.getReader()
        let decodedLength = 0
        while (panel.isRunning && !currentAbort?.signal.aborted) {
          const { value, done } = await reader.read()
          const chunkLength = value?.length || 0
          if (done || !chunkLength) break
          const usefulLength = Math.max(0, Math.min(chunkLength, realLength - decodedLength))
          recordTransferBytes(usefulLength)
          speedCtrAdd(index, usefulLength)
          decodedLength += chunkLength
          if (settings.maxSpeed) await speedCtr(index)
        }
        await reader.cancel().catch(() => undefined)
        attempt += 1
      } catch (err) {
        if (currentAbort?.signal.aborted || !panel.isRunning) return
        panel.lastError = err instanceof Error ? err.message : String(err)
        attempt += 1
        await delay(250, currentAbort?.signal)
      }
    }
  }

  async function restartRunningTarget() {
    try {
      await apiSolver()
      if (!panel.isRunning) return
      const previousAbort = abortController
      abortController = new AbortController()
      previousAbort?.abort()
      for (let i = 0; i < settings.threadNum; i++) void startThread(i)
    } catch (err) {
      panel.isRunning = false
      panel.lastError = err instanceof Error ? err.message : String(err)
    }
  }

  function addChartPoint(speed: number) {
    speedTemp.push(speed)
    while (speedTemp.length >= stepLength) {
      const tmp = speedTemp.splice(0, stepLength)
      const avg = tmp.includes(0) ? 0 : tmp.reduce((sum, item) => sum + item, 0) / stepLength
      chartTarget?.addDataPoint?.(avg, 0)
    }
    if (stepLength < 64 && panel.runTimeStamp > 200 * stepLength) {
      stepLength *= 2
    }
  }

  async function uploadLog(isFinal = false) {
    const nowTime = Date.now() / 1000
    const used = panel.bytesUsed - loggedBytes
    const time = nowTime - lastLogTime
    loggedBytes = panel.bytesUsed
    lastLogTime = nowTime

    const nodesStore = useNodesStore()
    const allNodes = Object.values(nodesStore.groupedNodes).flat()
    const currentNode = allNodes.find(n => n.url === settings.urlValue)
    const reportUrl = settings.groupMode ? `group:${settings.groupValue}` : settings.urlValue
    const urlName = settings.groupMode ? settings.groupValue : currentNode?.title || undefined

    try {
      const groupNodes = settings.groupMode ? activeGroupNodes() : []
      const resp = await user.uploadLog(used, time, reportUrl, settings.threadNum, urlName, {
        sessionId: speedSessionId,
        direction: 'DOWNLOAD',
        downloadBytes: used,
        uploadBytes: 0,
        testMode: settings.groupMode ? 'GROUP' : 'SINGLE',
        groupName: settings.groupMode ? settings.groupValue : undefined,
        nodeCount: settings.groupMode ? groupNodes.length : 1,
        groupNodes: settings.groupMode
          ? groupNodes.map(node => ({
              title: node.title,
              url: node.url,
              direction: 'DOWNLOAD' as const,
              method: node.method || 'GET',
              httpProtocol: 'AUTO' as const,
              enhanced: false,
            }))
          : undefined,
        downloadThreadNum: settings.threadNum,
        uploadThreadNum: 0,
        clientType: 'WEB',
        isFinal,
      })
      if (user.isLoggedIn && resp?.status === -1) {
        user.token = ''
        user.uin = '10000'
        user.isLoggedIn = false
        panel.lastError = '账号状态异常，已自动下线'
      }
      if (resp?.status === -2) {
        panel.isRunning = false
        panel.dailyLimitReached = true
        panel.lastWarning = '今日测试流量已达上限，已被限制'
      }
    } catch {
      // 上报失败不能中断测速。
    }
  }

  function secEvent() {
    panel.runTimeStamp += 1
    panel.runTimeShow = formatRunTime(panel.runTimeStamp)
    const now = Date.now() / 1000
    const speed = (panel.bytesUsed - recordUse) / Math.max(0.001, now - recordTime)
    addChartPoint(Number.isFinite(speed) ? speed : 0)
    setSpeed(Number.isFinite(speed) ? speed : 0)
    setTitle(speed)
    recordUse = panel.bytesUsed
    recordTime = now
  }

  function checkRotation() {
    if (settings.groupMode) return
    const rot = settings.nodeRotation
    if (!rot.enabled || rot.nodes.length === 0) return

    const currentNode = rot.nodes[rotationCurrentIndex]
    if (!currentNode) return

    const bytesThisRound = panel.bytesUsed - rotationBytesAtSwitch
    const limitBytes = currentNode.trafficLimit * 1024 * 1024

    if (bytesThisRound < limitBytes) return

    rotationRunCounts[rotationCurrentIndex]++
    const nextIndex = findNextRotationNode()
    if (nextIndex === -1) {
      panel.isRunning = false
      panel.lastWarning = '所有轮换节点已完成，测速自动停止'
      return
    }
    rotationCurrentIndex = nextIndex
    rotationBytesAtSwitch = panel.bytesUsed
    settings.urlValue = rot.nodes[nextIndex].url
  }

  function findNextRotationNode(): number {
    const nodes = settings.nodeRotation.nodes
    const len = nodes.length
    for (let i = 1; i <= len; i++) {
      const idx = (rotationCurrentIndex + i) % len
      const node = nodes[idx]
      if (node.maxRuns === 0 || rotationRunCounts[idx] < node.maxRuns) {
        return idx
      }
    }
    return -1
  }

  function frameEvent() {
    setUsed()
    checkRotation()
    if (settings.maxUse && panel.bytesUsed >= settings.maxUse) {
      panel.isRunning = false
      panel.lastWarning = '已达到流量上限，测速自动停止'
    }
  }

  function clearTasks() {
    tasks.forEach(task => window.clearInterval(task))
    tasks = []
    threadBytesMap.clear()
  }

  function stopCron() {
    if (cronTask) window.clearTimeout(cronTask)
    cronTask = 0
    settings.cronTab.tasks = 0
  }

  function tryCronTab() {
    const hour = new Date().getHours()
    const inPeriod = hour >= settings.cronTab.onset && hour <= settings.cronTab.over

    if (settings.cronTab.mode === 'period') {
      if (inPeriod && !panel.isRunning) {
        panel.isRunning = true
      } else if (!inPeriod && panel.isRunning) {
        panel.isRunning = false
      }
      cronTask = window.setTimeout(tryCronTab, 60 * 1000)
      settings.cronTab.tasks = cronTask
      return
    }

    const preset = { s: 1000, m: 1000 * 60, h: 1000 * 60 * 60 }
    if (settings.cronTab.section < 5 && settings.cronTab.unit === 's') {
      settings.cronTab.section = 15
    }
    if (inPeriod) {
      if (settings.cronTab.tasks !== 0) panel.isRunning = !panel.isRunning
    } else {
      panel.isRunning = false
    }
    cronTask = window.setTimeout(tryCronTab, preset[settings.cronTab.unit as 's' | 'm' | 'h'] * settings.cronTab.section)
    settings.cronTab.tasks = cronTask
  }

  async function start() {
    panel.lastError = ''
    panel.isChecking = true
    panel.runTimeStamp = 0
    panel.runTimeShow = '00s'
    chartTarget?.clearData?.()
    abortController = new AbortController()
    try {
      if (settings.nodeRotation.enabled && settings.nodeRotation.nodes.length > 0) {
        rotationCurrentIndex = 0
        rotationRunCounts = new Array(settings.nodeRotation.nodes.length).fill(0)
        settings.urlValue = settings.nodeRotation.nodes[0].url
      }

      await apiSolver()
      if (!panel.isRunning) {
        clearTasks()
        return
      }
      if (settings.maxUse && panel.bytesUsed >= settings.maxUse) {
        panel.bytesUsed = 0
        loggedBytes = 0
      }

      lastLogTime = Date.now() / 1000
      loggedBytes = panel.bytesUsed
      speedSessionId = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      startUse = panel.bytesUsed
      startTime = Date.now() / 1000
      recordUse = panel.bytesUsed
      recordTime = Date.now() / 1000
      rotationBytesAtSwitch = panel.bytesUsed
      speedTemp = []
      stepLength = 1

      if (!panel.isRunning) {
        clearTasks()
        return
      }

      for (let i = 0; i < settings.threadNum; i++) void startThread(i)

      tasks.push(window.setInterval(frameEvent, 15))
      tasks.push(window.setInterval(() => { void uploadLog(false) }, 60000))
      secEvent()
      tasks.push(window.setInterval(secEvent, 1000))
      keepAlive.start()
      if (settings.cronTab.status && settings.cronTab.tasks === 0) tryCronTab()
    } catch (err) {
      panel.isRunning = false
      panel.lastError = err instanceof Error ? err.message : String(err)
    } finally {
      panel.isChecking = false
    }
  }

  async function stop() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    clearTasks()
    keepAlive.stop()
    void uploadLog(true)
    const elapsed = Math.max(1, Date.now() / 1000 - startTime)
    const avgSpeed = (panel.bytesUsed - startUse) / elapsed
    setSpeed(avgSpeed)
    setUsed()
    setTitle()
    rotationBytesAtSwitch = 0
    rotationRunCounts = []
    rotationCurrentIndex = 0
  }

  async function tryStart() {
    if (settings.cronTab.mode !== 'period' && settings.cronTab.section < 5 && settings.cronTab.unit === 's') {
      panel.lastError = '定时任务以秒为单位时，执行间隔不能少于 5 秒'
      return
    }

    if (panel.isRunning) {
      if (settings.cronTab.status) {
        panel.lastError = '当前开启了定时任务，请先在面板设置中关闭'
        return
      }
      panel.isRunning = false
      return
    }

    await nodesStore.waitForNodes()
    nodesStore.selectDefaultNode()

    if (settings.groupMode) {
      if (!settings.groupValue) {
        panel.lastError = '请先选择测速节点组'
        return
      }
      if (!activeGroupNodes().length) {
        panel.lastError = '所选节点组没有可用节点'
        return
      }
      panel.isRunning = true
      return
    }

    if (!settings.urlValue) {
      panel.lastError = '请先选择测速节点'
      return
    }

    panel.isChecking = true
    const urlStatus = await checkUrl(settings.urlValue)
    panel.isChecking = false
    if (!urlStatus.status) {
      if (settings.nodeRotation.enabled && settings.nodeRotation.nodes.length > 1) {
        const failedUrl = settings.urlValue
        const failedNode = settings.nodeRotation.nodes.find(n => n.url === failedUrl)
        const nextNode = settings.nodeRotation.nodes.find(n => n.url !== failedUrl)
        if (nextNode) {
          settings.urlValue = nextNode.url
          panel.lastWarning = `节点「${failedNode?.label || failedUrl}」不可用：${urlStatus.info}，已切换到「${nextNode.label}」`
          panel.isRunning = true
          return
        }
      }
      panel.lastError = urlStatus.info
      return
    }

    panel.isRunning = true
  }

  function init() {
    if (initialized) return
    initialized = true

    getSpeedDailyUsage().then(resp => {
      panel.syncDailyUsage(resp.usedBytes)
    }).catch(() => {})

    watch(() => panel.isRunning, newState => {
      if (newState) void start()
      else void stop()
    })

    watch(() => settings.threadNum, () => {
      if (panel.isRunning) void restartRunningTarget()
    })

    watch(
      () => [settings.groupMode, settings.groupValue, settings.urlValue] as const,
      () => {
        if (panel.isRunning && !panel.isChecking) void restartRunningTarget()
      },
    )

    watch(() => settings.cronTab.status, enabled => {
      if (enabled) {
        settings.runBackground = true
      } else {
        panel.isRunning = false
        stopCron()
      }
    })

    watch(() => settings.runBackground, enabled => {
      if (!enabled && document.visibilityState === 'hidden' && panel.isRunning) {
        panel.isRunning = false
      }
    })

    visibilityHandler = () => {
      if (document.visibilityState === 'hidden' && !settings.runBackground && panel.isRunning) {
        panel.isRunning = false
      }
      if (document.visibilityState === 'visible' && router.currentRoute.value.path === '/') {
        document.title = getHomeTitle()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  function destroy() {
    clearTasks()
    stopCron()
    keepAlive.stop()
    panel.isRunning = false
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
    chartTarget = null
    initialized = false
  }

  return {
    init,
    destroy,
    tryStart,
    setChartTarget,
    checkUrl,
  }
}
