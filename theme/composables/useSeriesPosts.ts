import { useSiteStore } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useSeriesPosts() {
  const route = useRoute() as ReturnType<typeof useRoute> | undefined
  const site = useSiteStore()

  const frontmatter = computed(() => (route?.meta?.frontmatter || {}) as any)
  const seriesName = computed(() => frontmatter.value.series as string | undefined)

  const seriesPosts = computed(() => {
    if (!seriesName.value)
      return []

    return (site.postList || [])
      .filter((p: any) => p.series === seriesName.value)
      .sort((a: any, b: any) => {
        const orderA = (a as any).seriesOrder ?? Number.MAX_SAFE_INTEGER
        const orderB = (b as any).seriesOrder ?? Number.MAX_SAFE_INTEGER
        return orderA - orderB
      })
  })

  const currentIndex = computed(() => {
    if (!seriesName.value)
      return -1
    return seriesPosts.value.findIndex((p: any) => p.path === route?.path)
  })

  return {
    seriesName,
    seriesPosts,
    currentIndex,
  }
}
