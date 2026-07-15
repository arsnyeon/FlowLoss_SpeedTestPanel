export interface ClipboardLike {
  navigator?: {
    clipboard?: {
      writeText(text: string): Promise<void>
    }
  }
  document?: {
    body: {
      appendChild(node: any): void
      removeChild(node: any): void
    }
    createElement(tagName: string): any
    execCommand?(command: string): boolean
  }
}

export async function copyText(text: string, env: ClipboardLike = globalThis as ClipboardLike): Promise<boolean> {
  if (!text) return false

  const clipboard = env.navigator?.clipboard
  if (clipboard?.writeText) {
    await clipboard.writeText(text)
    return true
  }

  const doc = env.document
  if (!doc) return false

  const textarea = doc.createElement('textarea')
  textarea.value = text
  textarea.setAttribute?.('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  textarea.style.opacity = '0'

  doc.body.appendChild(textarea)
  try {
    textarea.focus?.()
    textarea.select?.()
    textarea.setSelectionRange?.(0, textarea.value.length)
    return Boolean(doc.execCommand?.('copy'))
  } finally {
    doc.body.removeChild(textarea)
  }
}
