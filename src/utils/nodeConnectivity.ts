export interface SpeedNodeValidationResult {
  status: boolean
  info: string
}

export interface SpeedNodeValidationEnv {
  fetch?: typeof fetch
  setTimeout?: typeof setTimeout
  clearTimeout?: typeof clearTimeout
  AbortController?: typeof AbortController
}

const blockList = ['gov.cn', 'arsn.cn', 'edu.cn']

export function checkBlockList(url: string): SpeedNodeValidationResult {
  if (!url) return { status: false, info: '请先选择测速节点' }
  try {
    const structUrl = new URL(url)
    if (structUrl.protocol !== 'http:' && structUrl.protocol !== 'https:') {
      return { status: false, info: '测速节点仅支持 HTTP 或 HTTPS 链接' }
    }
    if (blockList.some(item => structUrl.host.endsWith(item))) {
      return { status: false, info: '该链接不允许作为测速节点' }
    }
    return { status: true, info: '' }
  } catch {
    return { status: false, info: '无效的链接格式' }
  }
}

export async function validateSpeedNodeUrl(
  url: string,
  env: SpeedNodeValidationEnv = {},
): Promise<SpeedNodeValidationResult> {
  if (!url) return { status: false, info: '请先选择测速节点' }

  try {
    const structUrl = new URL(url)
    if (structUrl.protocol !== 'http:' && structUrl.protocol !== 'https:') {
      throw new Error('测速节点仅支持 HTTP 或 HTTPS 链接')
    }
    if (blockList.some(item => structUrl.host.endsWith(item))) {
      throw new Error('该链接不允许作为测速节点')
    }

    const fetchImpl = env.fetch || globalThis.fetch
    const AbortControllerImpl = env.AbortController || globalThis.AbortController
    const setTimeoutImpl = env.setTimeout || globalThis.setTimeout
    const clearTimeoutImpl = env.clearTimeout || globalThis.clearTimeout
    const controller = new AbortControllerImpl()
    const timer = setTimeoutImpl(() => controller.abort(), 5000)

    try {
      const response = await fetchImpl(url, {
        cache: 'no-store',
        mode: 'cors',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      })
      if (response.status === 404) throw new Error(`资源响应异常 ${response.status}`)
      if (!response.body) throw new Error('资源响应异常 Nobody')

      const reader = response.body.getReader()
      const { value } = await reader.read()
      await reader.cancel()
      if (!value || value.length <= 0) throw new Error('资源响应异常 Nobody')
      return { status: true, info: '' }
    } finally {
      clearTimeoutImpl(timer)
    }
  } catch (err) {
    return { status: false, info: err instanceof Error ? err.message : String(err) }
  }
}
