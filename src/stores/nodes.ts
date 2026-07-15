import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PublicNodesEnvelope } from '@/api/public'
import { useSettingsStore } from '@/stores/settings'

export interface NodeItem {
  title: string
  url: string
  status: boolean
  group?: string
  method?: CustomNodeMethod
  postData?: string
  headers?: string
  httpProtocol?: CustomNodeHttpProtocol
  enhanced?: boolean
}

export interface NodeGroup {
  [groupName: string]: NodeItem[]
}

export interface CustomNode {
  label: string
  value: string
  time: string
  group?: string
  sharedBy?: {
    uin: string
    avatar: string
    nickname: string
  }
  method?: CustomNodeMethod
  postData?: string
  httpProtocol?: CustomNodeHttpProtocol
  enhanced?: boolean
}

export type CustomNodeMethod = 'GET' | 'POST' | 'HEAD'
export type CustomNodeHttpProtocol = 'AUTO' | 'HTTP_1_1' | 'HTTP_2'

type RawNode = PublicNodesEnvelope['list'][string][string]

function loadCustomNodes(): CustomNode[] {
  const stored = JSON.parse(localStorage.getItem('customNodes') || '[]') as Array<CustomNode & { testMode?: unknown; headers?: unknown }>
  return stored.map(({ testMode: _legacyDirection, headers: _legacyHeaders, ...node }) => node)
}

export const useNodesStore = defineStore('nodes', () => {
  const rawNodes = ref<PublicNodesEnvelope['list']>({})
  const customNodes = ref<CustomNode[]>(loadCustomNodes())
  const customNodeGroups = ref<string[]>(normalizeCustomGroups(JSON.parse(localStorage.getItem('customNodeGroups') || '[]'), customNodes.value))
  const lastNodeSwitchReason = ref('')
  let fetchPromise: Promise<void> | null = null

  const groupedNodes = computed<NodeGroup>(() => {
    const grouped: NodeGroup = {}
    const customGroups: Record<string, Record<string, RawNode>> = {}
    const customUrls = new Set(customNodes.value.map(node => node.value))

    if (customNodes.value.length > 0) {
      customNodes.value.forEach(node => {
        const groupName = `自定义 / ${normalizeCustomGroup(node.group)}`
        if (!customGroups[groupName]) customGroups[groupName] = {}
        customGroups[groupName][node.label] = {
          link: node.value,
          status: true,
          group: normalizeCustomGroup(node.group),
          method: node.method || 'GET',
          postData: node.postData || '',
          httpProtocol: node.httpProtocol || 'AUTO',
          enhanced: Boolean(node.enhanced),
        } as RawNode
      })
    }

    const merged = { ...customGroups, ...rawNodes.value }

    for (const group in merged) {
      const isCustomGroup = group === '自定义' || group.startsWith('自定义 /')
      grouped[group] = []
      for (const item in merged[group]) {
        const node = merged[group][item]
        if (!isCustomGroup && customUrls.has(node.link)) continue
        if (!isCustomGroup && node.webVisible === false) continue
        if ((node as any).testMode === 'UPLOAD') continue
        grouped[group].push({
          title: item,
          url: node.link,
          status: node.status,
          group: (node as any).group || '',
          method: (node as any).method || 'GET',
          postData: (node as any).postData || '',
          headers: (node as any).headers || '',
          httpProtocol: (node as any).httpProtocol || 'AUTO',
          enhanced: Boolean((node as any).enhanced),
        })
      }
    }

    return grouped
  })

  function saveCustomNodes() {
    localStorage.setItem('customNodes', JSON.stringify(customNodes.value))
  }

  function saveCustomNodeGroups() {
    localStorage.setItem('customNodeGroups', JSON.stringify(customNodeGroups.value))
  }

  function normalizeCustomGroup(group?: string) {
    const text = (group || '').trim().replace(/\s+/g, ' ')
    return text || '默认'
  }

  function normalizeCustomGroups(groups: unknown, nodes: CustomNode[] = []) {
    const next = new Set<string>(['默认'])
    if (Array.isArray(groups)) {
      groups.forEach(group => next.add(normalizeCustomGroup(String(group || ''))))
    }
    nodes.forEach(node => next.add(normalizeCustomGroup(node.group)))
    return Array.from(next).sort((a, b) => (a === '默认' ? -1 : b === '默认' ? 1 : a.localeCompare(b, 'zh-CN')))
  }

  function syncCustomNodeGroups() {
    customNodeGroups.value = normalizeCustomGroups(customNodeGroups.value, customNodes.value)
    saveCustomNodeGroups()
  }

  function addCustomNodeGroup(group: string) {
    const nextGroup = normalizeCustomGroup(group)
    if (customNodeGroups.value.includes(nextGroup)) return false
    customNodeGroups.value = normalizeCustomGroups([...customNodeGroups.value, nextGroup], customNodes.value)
    saveCustomNodeGroups()
    return true
  }

  function removeCustomNodeGroup(group: string) {
    const nextGroup = normalizeCustomGroup(group)
    if (nextGroup === '默认') return false
    customNodeGroups.value = customNodeGroups.value.filter(item => item !== nextGroup)
    customNodes.value = customNodes.value.map(node => (
      normalizeCustomGroup(node.group) === nextGroup ? { ...node, group: '默认' } : node
    ))
    saveCustomNodeGroups()
    saveCustomNodes()
    return true
  }

  function addCustomNode(label: string, value: string, method: CustomNodeMethod = 'GET', postData = '', group = '默认') {
    const now = new Date()
    const time = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    customNodes.value.push({
      label,
      value,
      time,
      group: normalizeCustomGroup(group),
      method,
      postData: method === 'POST' ? postData : '',
      httpProtocol: 'AUTO',
      enhanced: false,
    })
    syncCustomNodeGroups()
    saveCustomNodes()
  }

  function addCustomNodes(nodes: CustomNode[]) {
    if (nodes.length === 0) return
    customNodes.value.push(...nodes.map(node => ({
      ...node,
      group: normalizeCustomGroup(node.group),
      httpProtocol: node.httpProtocol || 'AUTO',
      enhanced: Boolean(node.enhanced),
    })))
    syncCustomNodeGroups()
    saveCustomNodes()
  }

  function updateCustomNode(original: CustomNode, next: Omit<CustomNode, 'time'>) {
    const index = customNodes.value.findIndex(
      n => n.label === original.label && n.value === original.value && n.time === original.time
    )
    if (index === -1) return false
    customNodes.value[index] = {
      ...customNodes.value[index],
      ...next,
      group: normalizeCustomGroup(next.group),
      method: next.method || 'GET',
      postData: next.method === 'POST' ? next.postData || '' : '',
    }
    syncCustomNodeGroups()
    saveCustomNodes()
    return true
  }

  function removeCustomNode(node: CustomNode) {
    customNodes.value = customNodes.value.filter(
      n => n.label !== node.label || n.value !== node.value
    )
    saveCustomNodes()
  }

  function getCustomNodeByUrl(url: string) {
    return customNodes.value.find(node => node.value === url) || null
  }

  async function fetchNodes() {
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}nodes.json`, { cache: 'no-store' })
          if (!response.ok) throw new Error(`nodes.json ${response.status}`)
          const nodesData = await response.json() as PublicNodesEnvelope
          rawNodes.value = nodesData.list
          selectDefaultNode()
        } catch {
          console.error('Failed to fetch local nodes.json')
        }
      })()
    }
    return fetchPromise
  }

  function waitForNodes() {
    return fetchPromise ?? Promise.resolve()
  }

  function selectDefaultNode() {
    const settings = useSettingsStore()
    const availableGroups = Object.entries(groupedNodes.value)
      .filter(([, nodes]) => nodes.some(node => node.status !== false))
      .map(([name]) => name)
    if (!availableGroups.includes(settings.groupValue)) {
      settings.groupValue = availableGroups[0] || ''
    }
    const groups = Object.values(groupedNodes.value)
    const flat = groups.flat()
    const current = flat.find(node => node.url === settings.urlValue && node.status !== false)
    if (current) return

    const first = flat.find(node => node.status !== false)

    const unavailable = flat.find(node => node.url === settings.urlValue && node.status === false)
    if (unavailable) {
      lastNodeSwitchReason.value = `节点「${unavailable.title}」当前不可用`
    }

    settings.urlValue = first ? first.url : ''
  }

  return { rawNodes, customNodes, customNodeGroups, lastNodeSwitchReason, groupedNodes, addCustomNodeGroup, removeCustomNodeGroup, addCustomNode, addCustomNodes, updateCustomNode, removeCustomNode, getCustomNodeByUrl, fetchNodes, selectDefaultNode, waitForNodes }
})
