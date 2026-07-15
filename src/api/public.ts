import { requestJson } from './http'

const NET_API_BASE = 'https://net.arsn.cn/api'

export interface PublicNodesEnvelope {
  list: Record<string, Record<string, {
    link: string
    status: boolean
    appVisible?: boolean
    webVisible?: boolean
    method?: 'GET' | 'POST' | 'HEAD'
    postData?: string
    headers?: string
    httpProtocol?: 'AUTO' | 'HTTP_1_1' | 'HTTP_2'
    enhanced?: boolean
    testMode?: 'DOWNLOAD' | 'UPLOAD' | 'BIDIRECTIONAL'
  }>>
}

export interface DailyUsageResponse {
  usedBytes: number
  dailyLimitBytes: number | null
  maxTestDurationSec: number | null
}

export interface AppReleasePublic {
  version: string
  downloadUrl: string
}

export interface AppReleasePublicEnvelope {
  appRelease: AppReleasePublic | null
}

export function getSpeedDailyUsage() {
  return requestJson<DailyUsageResponse>(`${NET_API_BASE}/speed/daily-usage`)
}

export function getAppRelease() {
  return requestJson<AppReleasePublicEnvelope>(`${NET_API_BASE}/app-release`)
}
