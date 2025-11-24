/**
 * 今日诗词 Composable
 * 使用今日诗词官方 SDK 获取古诗词
 * @see https://www.jinrishici.com/doc/#npm
 */

import { ref, shallowRef } from 'vue'
import { load as jinrishiciLoad } from 'jinrishici'

export interface JinrishiciOrigin {
  /** 诗词标题 */
  title: string
  /** 朝代 */
  dynasty: string
  /** 作者 */
  author: string
  /** 完整诗词内容 */
  content: string[]
  /** 诗词翻译 */
  translate?: string[]
}

export interface JinrishiciData {
  /** 诗词 ID */
  id: string
  /** 推荐的诗句 */
  content: string
  /** 热度 */
  popularity: number
  /** 诗词来源信息 */
  origin: JinrishiciOrigin
  /** 匹配的标签（如季节、时间等） */
  matchTags: string[]
  /** 缓存时间 */
  cacheAt: string
}

export interface JinrishiciResponse {
  status: 'success' | 'error'
  data: JinrishiciData
  token?: string
  ipAddress?: string
  errCode?: number
  errMessage?: string
}

/**
 * 今日诗词 Composable
 * 根据时间、地点、天气等智能推荐古诗词
 */
export function useJinrishici() {
  const data = shallowRef<JinrishiciData | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 加载诗词
   * 使用官方 SDK，自动处理 Token 和智能推荐
   * @param forceRefresh - 是否强制刷新（获取新诗词）
   */
  function load(forceRefresh = false): Promise<JinrishiciData | null> {
    // 如果已有数据且不强制刷新，直接返回
    if (data.value && !forceRefresh) {
      return Promise.resolve(data.value)
    }

    loading.value = true
    error.value = null

    return new Promise((resolve) => {
      jinrishiciLoad(
        (result: JinrishiciResponse) => {
          loading.value = false
          if (result.status === 'success') {
            data.value = result.data
            resolve(result.data)
          }
          else {
            error.value = new Error(result.errMessage || '获取诗词失败')
            resolve(null)
          }
        },
        (err: Error) => {
          loading.value = false
          error.value = err instanceof Error ? err : new Error(String(err))
          resolve(null)
        },
      )
    })
  }

  /**
   * 重置状态
   */
  function reset() {
    data.value = null
    error.value = null
    loading.value = false
  }

  return {
    /** 诗词数据 */
    data,
    /** 加载状态 */
    loading,
    /** 错误信息 */
    error,
    /** 加载诗词 */
    load,
    /** 重置状态 */
    reset,
  }
}
