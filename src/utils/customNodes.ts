export interface CustomNodeLike {
  label: string
  value: string
}

export type CustomNodeDuplicate = 'label' | 'url' | null

export function normalizeNodeLabel(label: string) {
  return label.trim().replace(/\s+/g, ' ')
}

export function normalizeNodeUrl(url: string) {
  const text = url.trim()
  try {
    const parsed = new URL(text)
    parsed.protocol = parsed.protocol.toLowerCase()
    parsed.hostname = parsed.hostname.toLowerCase()
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '')
    }
    return parsed.toString()
  } catch {
    return text.replace(/\/+$/, '')
  }
}

export function findCustomNodeDuplicate(
  nodes: CustomNodeLike[],
  label: string,
  url: string,
): CustomNodeDuplicate {
  const nextLabel = normalizeNodeLabel(label)
  const nextUrl = normalizeNodeUrl(url)

  if (nodes.some(node => normalizeNodeLabel(node.label) === nextLabel)) {
    return 'label'
  }

  if (nodes.some(node => normalizeNodeUrl(node.value) === nextUrl)) {
    return 'url'
  }

  return null
}

export function getCustomNodeDuplicateMessage(duplicate: CustomNodeDuplicate) {
  return duplicate ? '已有数据' : ''
}
