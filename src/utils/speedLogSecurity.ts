interface SessionResponse {
  status: number
  ticket: string
  encryptionKey: string
  signatureKey: string
  serverTime: number
  expiresAt: number
  message?: string
  msg?: string
}

export interface SignedSpeedLogEnvelope {
  ticket: string
  sequence: number
  timestamp: number
  nonce: string
  payload: string
  signature: string
}

type ApiRequest = (action: string, method: string, args: Record<string, unknown>) => Promise<any>

export class SpeedLogSigner {
  private sequence = 1
  private readonly ticket: string
  private readonly encryptionKey: CryptoKey
  private readonly signatureKey: CryptoKey
  private readonly clockOffset: number
  private readonly expiresAt: number

  private constructor(
    ticket: string,
    encryptionKey: CryptoKey,
    signatureKey: CryptoKey,
    clockOffset: number,
    expiresAt: number,
  ) {
    this.ticket = ticket
    this.encryptionKey = encryptionKey
    this.signatureKey = signatureKey
    this.clockOffset = clockOffset
    this.expiresAt = expiresAt
  }

  static async create(
    request: ApiRequest,
    accessToken: string,
    sessionId: string,
    clientType: 'WEB' | 'APP',
  ): Promise<SpeedLogSigner> {
    const response = await request('speed/log/session', 'POST', {
      AccessToken: accessToken,
      sessionId,
      clientType,
    }) as SessionResponse
    if (response?.status !== 0 || !response.ticket || !response.encryptionKey || !response.signatureKey) {
      throw new Error(response?.message || response?.msg || '无法建立日志安全会话')
    }

    const encryptionKey = await crypto.subtle.importKey(
      'raw',
      decodeBase64Url(response.encryptionKey),
      { name: 'AES-GCM' },
      false,
      ['encrypt'],
    )
    const signatureKey = await crypto.subtle.importKey(
      'raw',
      decodeBase64Url(response.signatureKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    return new SpeedLogSigner(
      response.ticket,
      encryptionKey,
      signatureKey,
      response.serverTime - Date.now(),
      response.expiresAt,
    )
  }

  async seal(data: Record<string, unknown>): Promise<SignedSpeedLogEnvelope> {
    if (Date.now() + this.clockOffset >= this.expiresAt) throw new Error('日志安全会话已过期')
    const nonceBytes = crypto.getRandomValues(new Uint8Array(12))
    const nonce = encodeBase64Url(nonceBytes)
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBytes },
      this.encryptionKey,
      new TextEncoder().encode(JSON.stringify(data)),
    )
    const payload = encodeBase64Url(new Uint8Array(encrypted))
    const timestamp = Math.round(Date.now() + this.clockOffset)
    const message = `v1.${this.ticket}.${this.sequence}.${timestamp}.${nonce}.${payload}`
    const signature = await crypto.subtle.sign(
      'HMAC',
      this.signatureKey,
      new TextEncoder().encode(message),
    )
    return {
      ticket: this.ticket,
      sequence: this.sequence,
      timestamp,
      nonce,
      payload,
      signature: encodeBase64Url(new Uint8Array(signature)),
    }
  }

  commit(sequence: number) {
    if (sequence === this.sequence) this.sequence += 1
  }
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer as ArrayBuffer
}
