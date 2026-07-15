import type { CustomNode } from '@/stores/nodes'
import {
  findCustomNodeDuplicate,
  normalizeNodeLabel,
  normalizeNodeUrl,
} from '@/utils/customNodes'

export interface CustomNodeProfileUser {
  uin: string
  avatar: string
  nickname: string
}

export interface CustomNodeProfileFile {
  type: 'flowloss_speed_profiles'
  version: 1 | 2
  exportedAt: string
  user: CustomNodeProfileUser
  nodes: CustomNode[]
}

export interface ParsedCustomNodeProfile {
  profile: CustomNodeProfileFile
  importableNodes: CustomNode[]
  skippedCount: number
}

function nowText() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
}

function getAvatarUrl(avatar: string, uin: string) {
  const nextAvatar = avatar.trim()
  const nextUin = uin.trim()
  return nextAvatar || (nextUin ? `https://q.qlogo.cn/headimg_dl?dst_uin=${encodeURIComponent(nextUin)}&spec=640` : '')
}

export function maskUin(uin: string) {
  const text = uin.trim()
  if (text.length <= 4) return text
  const maskLength = text.length >= 8 ? 5 : text.length >= 6 ? 4 : 3
  const start = Math.floor((text.length - maskLength) / 2)
  return `${text.slice(0, start)}${'*'.repeat(maskLength)}${text.slice(start + maskLength)}`
}

function sanitizeNode(node: Partial<CustomNode>, sharedBy?: CustomNodeProfileUser): CustomNode | null {
  const label = normalizeNodeLabel(String(node.label || ''))
  const value = normalizeNodeUrl(String(node.value || ''))
  const group = String(node.group || '').trim().replace(/\s+/g, ' ') || '默认'
  const method = node.method === 'POST' || node.method === 'HEAD' ? node.method : 'GET'
  const httpProtocol = node.httpProtocol === 'HTTP_1_1' || node.httpProtocol === 'HTTP_2' ? node.httpProtocol : 'AUTO'
  if (!label || !/^https?:\/\/([\w-]+\.)+[\w-]+(:[0-9]+)?(\/\S*)?/.test(value)) return null
  const sanitized: CustomNode = {
    label,
    value,
    time: String(node.time || nowText()),
    group,
    method,
    postData: method === 'POST' ? String(node.postData || '') : '',
    httpProtocol,
    enhanced: Boolean(node.enhanced),
  }
  if (sharedBy) sanitized.sharedBy = sharedBy
  return sanitized
}

function serializeNode(node: CustomNode): CustomNode {
  const { sharedBy, ...safeNode } = node
  const method = safeNode.method === 'POST' || safeNode.method === 'HEAD' ? safeNode.method : 'GET'
  return {
    ...safeNode,
    method,
    postData: method === 'POST' ? safeNode.postData || '' : '',
    httpProtocol: safeNode.httpProtocol || 'AUTO',
    enhanced: Boolean(safeNode.enhanced),
  }
}

export function createCustomNodeProfile(
  nodes: CustomNode[],
  user: CustomNodeProfileUser,
): CustomNodeProfileFile {
  return {
    type: 'flowloss_speed_profiles',
    version: 2,
    exportedAt: new Date().toISOString(),
    user: {
      uin: maskUin(user.uin),
      avatar: getAvatarUrl(user.avatar, user.uin),
      nickname: user.nickname,
    },
    nodes: nodes.map(serializeNode),
  }
}

export function getCustomNodeProfileFilename() {
  return `flowloss_speed_profiles_${Date.now()}.conf`
}

export function isCustomNodeProfileFilename(fileName: string) {
  return /\.conf$/i.test(fileName.trim())
}

export function downloadCustomNodeProfile(profile: CustomNodeProfileFile) {
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = getCustomNodeProfileFilename()
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function parseCustomNodeProfileFile(raw: string, existingNodes: CustomNode[]): ParsedCustomNodeProfile {
  const parsed = JSON.parse(raw) as Partial<CustomNodeProfileFile>
  if (parsed.type !== 'flowloss_speed_profiles' || (parsed.version !== 1 && parsed.version !== 2) || !Array.isArray(parsed.nodes)) {
    throw new Error('配置文件格式不正确')
  }

  const profile: CustomNodeProfileFile = {
    type: 'flowloss_speed_profiles',
    version: parsed.version,
    exportedAt: String(parsed.exportedAt || ''),
    user: {
      uin: String(parsed.user?.uin || ''),
      avatar: getAvatarUrl(String(parsed.user?.avatar || ''), String(parsed.user?.uin || '')),
      nickname: String(parsed.user?.nickname || '匿名用户'),
    },
    nodes: [],
  }

  const seen: CustomNode[] = [...existingNodes]
  let skippedCount = 0

  for (const node of parsed.nodes) {
    const sanitized = sanitizeNode(node, profile.user)
    if (!sanitized || findCustomNodeDuplicate(seen, sanitized.label, sanitized.value)) {
      skippedCount += 1
      continue
    }
    profile.nodes.push(sanitized)
    seen.push(sanitized)
  }

  return {
    profile,
    importableNodes: profile.nodes,
    skippedCount,
  }
}
