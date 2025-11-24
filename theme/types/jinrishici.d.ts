declare module 'jinrishici' {
  interface JinrishiciOrigin {
    title: string
    dynasty: string
    author: string
    content: string[]
    translate?: string[]
  }

  interface JinrishiciData {
    id: string
    content: string
    popularity: number
    origin: JinrishiciOrigin
    matchTags: string[]
    cacheAt: string
  }

  interface JinrishiciResponse {
    status: 'success' | 'error'
    data: JinrishiciData
    token?: string
    ipAddress?: string
    errCode?: number
    errMessage?: string
  }

  export function load(
    onSuccess: (result: JinrishiciResponse) => void,
    onError?: (error: Error) => void
  ): void
}
