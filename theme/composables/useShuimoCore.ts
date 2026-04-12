import { ref, shallowRef } from 'vue'

/**
 * 动态导入 shuimo-core 主模块
 * 包含 PaintingGenerator、SceneManager 等顶层 API
 */
export function useShuimoCore() {
  const loaded = ref(false)
  const module = shallowRef<any>(null)

  const load = async () => {
    if (module.value)
      return module.value
    try {
      const mod = await import('@jobinjia/shuimo-core')
      module.value = mod
      loaded.value = true
      return mod
    }
    catch {
      loaded.value = false
      return null
    }
  }

  return { loaded, module, load }
}

/**
 * 动态导入 shuimo-core/drawing 模块
 * 包含 Stroke, Brush, Blob, Stamp, Texture 等绘制工具
 */
export function useShuimoDrawing() {
  const loaded = ref(false)
  const module = shallowRef<any>(null)

  const load = async () => {
    if (module.value)
      return module.value
    try {
      const mod = await import('@jobinjia/shuimo-core/drawing')
      module.value = mod
      loaded.value = true
      return mod
    }
    catch {
      loaded.value = false
      return null
    }
  }

  return { loaded, module, load }
}

/**
 * 动态导入 shuimo-core/elements 模块
 * 包含 XuanPaper, Mount, Water, Tree, Bamboo, Orchid 等画面元素
 */
export function useShuimoElements() {
  const loaded = ref(false)
  const module = shallowRef<any>(null)

  const load = async () => {
    if (module.value)
      return module.value
    try {
      const mod = await import('@jobinjia/shuimo-core/elements')
      module.value = mod
      loaded.value = true
      return mod
    }
    catch {
      loaded.value = false
      return null
    }
  }

  return { loaded, module, load }
}

/**
 * 动态导入 shuimo-core/foundation 模块
 * 包含 noise, PRNG, geometry 等基础工具
 */
export function useShuimoFoundation() {
  const loaded = ref(false)
  const module = shallowRef<any>(null)

  const load = async () => {
    if (module.value)
      return module.value
    try {
      const mod = await import('@jobinjia/shuimo-core/foundation')
      module.value = mod
      loaded.value = true
      return mod
    }
    catch {
      loaded.value = false
      return null
    }
  }

  return { loaded, module, load }
}
