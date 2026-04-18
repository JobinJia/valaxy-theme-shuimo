<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeConfig } from '../composables'

const { t } = useI18n()
const themeConfig = useThemeConfig()
const tocConfig = computed(() => themeConfig.value?.toc)
const maxDepth = computed(() => tocConfig.value?.maxDepth ?? 3)

interface TocItem {
  id: string
  text: string
  level: number
}

const headings = ref<TocItem[]>([])
const activeId = ref('')
const mobileOpen = ref(false)

function extractHeadings() {
  const selector = maxDepth.value >= 3 ? 'h2, h3' : 'h2'
  const article = document.querySelector('.shuimo-post-page__content')
  if (!article)
    return

  const els = article.querySelectorAll(selector)
  const items: TocItem[] = []
  els.forEach((el) => {
    if (!el.id) {
      el.id = el.textContent?.trim().replace(/\s+/g, '-').toLowerCase() || ''
    }
    items.push({
      id: el.id,
      text: el.textContent?.trim() || '',
      level: Number.parseInt(el.tagName[1]),
    })
  })
  headings.value = items
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
          break
        }
      }
    },
    { rootMargin: '-60px 0px -80% 0px' },
  )

  headings.value.forEach((h) => {
    const el = document.getElementById(h.id)
    if (el)
      observer!.observe(el)
  })
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
    mobileOpen.value = false
  }
}

let timerId: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  timerId = setTimeout(() => {
    extractHeadings()
    if (headings.value.length)
      setupObserver()
  }, 300)
})

onBeforeUnmount(() => {
  if (timerId)
    clearTimeout(timerId)
  observer?.disconnect()
})
</script>

<template>
  <template v-if="tocConfig?.enable !== false && headings.length > 0">
    <!-- Desktop: floating sidebar -->
    <nav class="shuimo-toc shuimo-toc--desktop">
      <div class="shuimo-toc__title">
        {{ t('shuimo.toc_title') }}
      </div>
      <ul class="shuimo-toc__list">
        <li
          v-for="h in headings"
          :key="h.id"
          class="shuimo-toc__item"
          :class="{
            'shuimo-toc__item--h3': h.level === 3,
            'shuimo-toc__item--active': activeId === h.id,
          }"
        >
          <a :href="`#${h.id}`" @click.prevent="scrollTo(h.id)">{{ h.text }}</a>
        </li>
      </ul>
    </nav>

    <!-- Mobile: collapsible button + panel -->
    <div class="shuimo-toc shuimo-toc--mobile">
      <button class="shuimo-toc__toggle" @click="mobileOpen = !mobileOpen">
        {{ t('shuimo.toc_title') }}
        <span class="shuimo-toc__arrow" :class="{ 'shuimo-toc__arrow--open': mobileOpen }">▾</span>
      </button>
      <Transition name="shuimo-toc-slide">
        <ul v-if="mobileOpen" class="shuimo-toc__list">
          <li
            v-for="h in headings"
            :key="h.id"
            class="shuimo-toc__item"
            :class="{
              'shuimo-toc__item--h3': h.level === 3,
              'shuimo-toc__item--active': activeId === h.id,
            }"
          >
            <a :href="`#${h.id}`" @click.prevent="scrollTo(h.id)">{{ h.text }}</a>
          </li>
        </ul>
      </Transition>
    </div>
  </template>
</template>

<style lang="scss" scoped>
.shuimo-toc--desktop {
  display: none;
}

@media (min-width: 1200px) {
  .shuimo-toc--desktop {
    display: block;
    position: fixed;
    top: 120px;
    right: calc((100vw - 680px) / 2 - 220px);
    width: 180px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .shuimo-toc--mobile {
    display: none;
  }
}

@media (min-width: 1200px) and (max-width: 1400px) {
  .shuimo-toc--desktop {
    right: 20px;
    width: 160px;
  }
}

.shuimo-toc__title {
  font-size: 15px;
  color: var(--sm-ink-light);
  letter-spacing: 2px;
  margin-bottom: 12px;
  font-family: var(--sm-font-kai);
  border-bottom: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.08));
  padding-bottom: 8px;
}

.shuimo-toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.shuimo-toc__item {
  margin-bottom: 6px;

  a {
    display: block;
    font-size: 12px;
    color: var(--sm-ink-light);
    text-decoration: none;
    line-height: 1.6;
    padding: 3px 0 3px 12px;
    border-left: 2px solid transparent;
    transition:
      color 0.2s,
      border-color 0.2s;

    &:hover {
      color: var(--sm-ink-dark);
    }
  }

  &--h3 a {
    padding-left: 24px;
    font-size: 12px;
  }

  &--active a {
    color: var(--sm-accent);
    border-left-color: var(--sm-accent);
  }
}

// Mobile
.shuimo-toc--mobile {
  margin-bottom: 20px;
  width: 100%;
}

.shuimo-toc__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.08));
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 16px;
  color: var(--sm-ink-light);
  font-family: var(--sm-font-kai);
  letter-spacing: 2px;
  cursor: pointer;
  width: 100%;
  justify-content: center;

  &:hover {
    border-color: var(--sm-accent);
    color: var(--sm-ink-medium);
  }
}

.shuimo-toc__arrow {
  transition: transform 0.2s;

  &--open {
    transform: rotate(180deg);
  }
}

.shuimo-toc-slide-enter-active,
.shuimo-toc-slide-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}

.shuimo-toc-slide-enter-from,
.shuimo-toc-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.shuimo-toc-slide-enter-to,
.shuimo-toc-slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

.shuimo-toc--mobile .shuimo-toc__list {
  margin-top: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.08));
}

@media (min-width: 1200px) {
  .shuimo-toc--mobile {
    display: none;
  }
}
</style>
