export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface RequestJsonOptions {
  authenticated?: boolean
}

export async function requestJson<T>(path: string, init: RequestInit = {}, options: RequestJsonOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  const response = await fetch(path, {
    credentials: options.authenticated ? 'include' : 'same-origin',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
    ...init,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message || response.statusText || 'Request failed'
    throw new ApiError(message, response.status, data)
  }

  return data as T
}
