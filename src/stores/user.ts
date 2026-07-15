import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SpeedLogSigner } from '@/utils/speedLogSecurity'
import { useAppStore } from '@/stores/app'

type LoginState = 'idle' | 'loading' | 'waiting' | 'binding' | 'expired' | 'failed' | 'success'

interface LoginCache {
  session?: string
  img?: string
  url?: string
}

export interface SpeedLogMetadata {
  sessionId?: string
  direction?: 'DOWNLOAD' | 'UPLOAD' | 'BIDIRECTIONAL'
  downloadBytes?: number
  uploadBytes?: number
  testMode?: 'SINGLE' | 'GROUP'
  groupName?: string
  nodeCount?: number
  groupNodes?: Array<{
    title: string
    url: string
    direction?: 'DOWNLOAD' | 'UPLOAD' | 'BIDIRECTIONAL'
    method?: 'GET' | 'POST' | 'HEAD'
    httpProtocol?: 'AUTO' | 'HTTP_1_1' | 'HTTP_2'
    enhanced?: boolean
  }>
  downloadThreadNum?: number
  uploadThreadNum?: number
  clientType?: 'WEB' | 'APP'
  clientVersion?: string
  isFinal?: boolean
}

export const useUserStore = defineStore('user', () => {
  const appStore = useAppStore()
  const isLoggedIn = ref(false)
  const uin = ref('')
  const username = ref('')
  const avatar = ref('')
  const token = ref('')
  const dosage = ref(parseInt(localStorage.getItem('dosage') || '0'))
  const rankData = ref<any>(null)
  const isCheckingStatus = ref(false)

  const loginState = ref<LoginState>('idle')
  const loginSession = ref('')
  const loginQrImage = ref('')
  const loginUrl = ref('')
  const loginMessage = ref('请使用 QQ/TIM 手机版扫描二维码')
  const loginError = ref('')
  const loginBusy = ref(false)
  const loginDots = ref('.')

  const API_URL = 'https://net.arsn.cn/api/'
  let loginTimer: number | null = null
  let dotsTimer: number | null = null
  const speedLogSigners = new Map<string, SpeedLogSigner>()
  const speedLogQueues = new Map<string, Promise<any>>()

  async function apiRequest(action: string, method = 'GET', args: Record<string, any> = {}) {
    const options: RequestInit = {
      method,
      mode: 'cors',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    }
    if (method === 'POST') {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(args)
    }
    const response = await fetch(API_URL + action, options)
    return await response.json()
  }

  async function checkStatus() {
    const accessToken = getToken()
    if (!accessToken) {
      clearUserState()
      return { status: -1 }
    }

    isCheckingStatus.value = true
    try {
      const resp = await apiRequest('speed/my-status', 'POST', { AccessToken: accessToken })
      if (resp.status === 0) {
        isLoggedIn.value = true
        token.value = accessToken
        rankData.value = resp.data
        uin.value = resp.uin || ''
        username.value = resp.nickname || ''
        avatar.value = resp.avatar || ''
      } else {
        clearUserState()
      }
      return resp
    } catch {
      clearUserState()
      return { status: -2, msg: '登录服务器异常' }
    } finally {
      isCheckingStatus.value = false
    }
  }

  function getToken(): string {
    return localStorage.getItem('AccessToken') || ''
  }

  function getCookie(name: string): string {
    const cookies = document.cookie.split('; ')
    for (const cookie of cookies) {
      const [cookieName, ...parts] = cookie.split('=')
      if (cookieName === name) {
        try {
          return decodeURIComponent(parts.join('=') || '')
        } catch {
          return parts.join('=') || ''
        }
      }
    }
    return ''
  }

  function setCookie(name: string, value: string, durationMs: number) {
    const expires = new Date(Date.now() + durationMs).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
  }

  function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }

  function clearUserState() {
    isLoggedIn.value = false
    uin.value = ''
    username.value = ''
    avatar.value = ''
    token.value = ''
    rankData.value = null
  }

  function readLoginCache(): LoginCache {
    try {
      return JSON.parse(getCookie('loginData') || '{}')
    } catch {
      return {}
    }
  }

  function saveLoginCache(cache: LoginCache) {
    setCookie('loginData', JSON.stringify(cache), 120 * 1000)
  }

  function clearLoginCache() {
    deleteCookie('loginData')
  }

  function resetLoginState() {
    stopLoginPolling()
    loginState.value = 'idle'
    loginSession.value = ''
    loginQrImage.value = ''
    loginUrl.value = ''
    loginMessage.value = '请使用 QQ/TIM 手机版扫描二维码'
    loginError.value = ''
    loginBusy.value = false
    loginDots.value = '.'
  }

  function applyLoginCache(cache: LoginCache) {
    loginSession.value = cache.session || ''
    loginQrImage.value = cache.img || ''
    loginUrl.value = cache.url || ''
    loginMessage.value = '请使用 QQ/TIM 手机版扫描二维码'
    loginError.value = ''
    loginState.value = 'waiting'
  }

  async function requestLoginQr(force = false) {
    loginBusy.value = true
    loginError.value = ''
    loginState.value = 'loading'

    try {
      const cache = readLoginCache()
      if (!force && cache.session && cache.img) {
        applyLoginCache(cache)
        startLoginPolling()
        return { status: 0, cached: true }
      }

      const resp = await apiRequest('auth/login', 'POST', { channelId: 1, AccessToken: getToken() || undefined })
      if (resp.url) {
        const nextCache = {
          session: resp.session || '',
          img: resp.qrcode || '',
          url: resp.url || '',
        }
        saveLoginCache(nextCache)
        applyLoginCache(nextCache)
        startLoginPolling()
      } else {
        loginState.value = 'failed'
        loginError.value = '获取登录二维码失败'
      }
      return { status: 0, ...resp }
    } catch {
      loginState.value = 'failed'
      loginError.value = '登录服务器异常，请稍后重试'
      return { status: -2, msg: loginError.value }
    } finally {
      loginBusy.value = false
    }
  }

  function startLoginPolling() {
    stopLoginPolling()
    loginTimer = window.setInterval(() => {
      pollQrLogin()
    }, 1000)
    dotsTimer = window.setInterval(() => {
      loginDots.value = loginDots.value.length >= 3 ? '.' : `${loginDots.value}.`
    }, 1000)
  }

  function stopLoginPolling() {
    if (loginTimer !== null) {
      window.clearInterval(loginTimer)
      loginTimer = null
    }
    if (dotsTimer !== null) {
      window.clearInterval(dotsTimer)
      dotsTimer = null
    }
  }

  async function pollQrLogin() {
    if (!loginSession.value) return { status: -5 }

    try {
      const resp = await apiRequest('auth/check', 'POST', { session: loginSession.value })
      if (resp.code === -1) {
        loginState.value = 'waiting'
        loginMessage.value = '请使用 QQ/TIM 手机版扫描二维码'
      } else if (resp.code === -2) {
        loginState.value = 'binding'
        loginMessage.value = '请输入刚刚用于授权的 QQ 号码'
        stopLoginPolling()
      } else if (resp.code === -3) {
        loginState.value = 'failed'
        loginError.value = resp.msg || '本次登录已被拒绝'
        loginMessage.value = '本次登录已被拒绝'
        clearLoginCache()
        stopLoginPolling()
      } else if (resp.code === -4) {
        loginState.value = 'expired'
        loginMessage.value = '登录超时，请刷新二维码重试'
        clearLoginCache()
        stopLoginPolling()
      } else if (resp.code === 0) {
        localStorage.setItem('AccessToken', resp.AccessToken)
        token.value = resp.AccessToken
        uin.value = resp.uin || ''
        username.value = resp.nickname || ''
        avatar.value = resp.avatar || (resp.uin ? `https://q.qlogo.cn/headimg_dl?dst_uin=${encodeURIComponent(resp.uin)}&spec=640` : '')
        isLoggedIn.value = true
        loginState.value = 'success'
        loginMessage.value = '登录成功'
        clearLoginCache()
        stopLoginPolling()
      }
      return { status: resp.code, ...resp }
    } catch {
      loginState.value = 'failed'
      loginError.value = '登录状态确认失败，请稍后重试'
      stopLoginPolling()
      return { status: -2, msg: loginError.value }
    }
  }

  async function bindQQ(uinValue: string) {
    const bindUin = uinValue.trim()
    if (!bindUin) {
      loginError.value = '请输入 QQ 号码'
      return { status: -1, msg: loginError.value }
    }
    if (!loginSession.value) {
      loginError.value = '登录会话已失效，请刷新二维码'
      loginState.value = 'expired'
      return { status: -4, msg: loginError.value }
    }

    loginBusy.value = true
    loginError.value = ''
    try {
      const resp = await apiRequest('auth/bind', 'POST', {
        uin: bindUin,
        session: loginSession.value,
      })
      if (resp.code === 0) {
        loginMessage.value = '绑定成功，正在确认登录'
        await pollQrLogin()
      } else {
        loginError.value = resp.msg || resp.message || '绑定失败，请检查 QQ 号码'
      }
      return { status: resp.code ?? 0, ...resp }
    } catch (e: any) {
      loginError.value = e?.message || '绑定服务异常，请稍后重试'
      return { status: -2, msg: loginError.value }
    } finally {
      loginBusy.value = false
    }
  }

  async function loginWithToken(accessToken: string) {
    const nextToken = accessToken.trim()
    if (!nextToken) return { status: -1, msg: '请输入 AccessToken' }

    localStorage.setItem('AccessToken', nextToken)
    const resp = await checkStatus()
    if (resp.status !== 0) {
      localStorage.removeItem('AccessToken')
      clearUserState()
    }
    return resp
  }

  function logout() {
    const accessToken = getToken()
    if (accessToken) {
      apiRequest('auth/logout', 'POST', { AccessToken: accessToken }).catch(() => {})
    }
    localStorage.removeItem('AccessToken')
    speedLogSigners.clear()
    speedLogQueues.clear()
    clearUserState()
  }

  async function uploadLog(
    used: number,
    time: number,
    urlValue: string,
    threadNum: number,
    urlName?: string,
    metadata: SpeedLogMetadata = {},
  ) {
    if (used <= 0 || time <= 0) return { status: 0 }
    const accessToken = token.value || getToken()
    const sessionId = metadata.sessionId
    if (!accessToken || !sessionId) return { status: -1, msg: '未登录' }
    const payload: Record<string, unknown> = {
      url: urlValue,
      threadNum,
      used,
      time,
      urlName,
      ...metadata,
      clientType: 'WEB',
      clientVersion: appStore.siteVersion,
    }

    const submit = async () => {
      let signer = speedLogSigners.get(sessionId)
      if (!signer) {
        signer = await SpeedLogSigner.create(apiRequest, accessToken, sessionId, 'WEB')
        speedLogSigners.set(sessionId, signer)
      }
      try {
        const envelope = await signer.seal(payload)
        const response = await apiRequest('speed/log', 'POST', { AccessToken: accessToken, ...envelope })
        if (response?.status === 0) signer.commit(envelope.sequence)
        else speedLogSigners.delete(sessionId)
        if (metadata.isFinal) speedLogSigners.delete(sessionId)
        return response
      } catch (error) {
        speedLogSigners.delete(sessionId)
        throw error
      }
    }

    const previous = speedLogQueues.get(sessionId) || Promise.resolve()
    const queued = previous.catch(() => undefined).then(submit)
    speedLogQueues.set(sessionId, queued)
    const cleanup = () => {
      if (speedLogQueues.get(sessionId) === queued) speedLogQueues.delete(sessionId)
    }
    queued.then(cleanup, cleanup)
    return await queued
  }

  let dosageSaveTimer: ReturnType<typeof setTimeout> | null = null

  function addDosage(bytes: number) {
    dosage.value += bytes
    if (!dosageSaveTimer) {
      dosageSaveTimer = setTimeout(() => {
        localStorage.setItem('dosage', String(dosage.value))
        dosageSaveTimer = null
      }, 1000)
    }
  }

  async function kickOtherDevices() {
    return await apiRequest('auth/kick', 'POST', { AccessToken: getToken() })
  }

  return {
    isLoggedIn,
    uin,
    username,
    avatar,
    token,
    dosage,
    rankData,
    isCheckingStatus,
    loginState,
    loginSession,
    loginQrImage,
    loginUrl,
    loginMessage,
    loginError,
    loginBusy,
    loginDots,
    apiRequest,
    checkStatus,
    getToken,
    requestLoginQr,
    stopLoginPolling,
    resetLoginState,
    bindQQ,
    loginWithToken,
    logout,
    uploadLog,
    addDosage,
    kickOtherDevices,
  }
})
