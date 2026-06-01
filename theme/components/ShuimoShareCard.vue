<script setup lang="ts">
import type { ThemeConfig } from '../types'
import { nextTick, onUnmounted, ref } from 'vue'
import { useShareCard } from '../composables/useShareCard'

const props = defineProps<{
  slug: string
  frontmatter: Record<string, unknown>
  themeConfig: ThemeConfig | Record<string, unknown>
}>()

const open = ref(false)
const closeBtn = ref<HTMLButtonElement | null>(null)
const { available, generating, previewUrl, error, render, download, copyToClipboard } = useShareCard({
  slug: props.slug,
  frontmatter: props.frontmatter,
  themeConfig: props.themeConfig as Record<string, unknown>,
})

async function onOpen() {
  open.value = true
  await nextTick()
  closeBtn.value?.focus()
  await render('portrait')
}

function onClose() {
  open.value = false
}

onUnmounted(() => {
  if (previewUrl.value)
    URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <!-- available === false (checked, no shuimo-core) → hide entry entirely -->
  <button
    v-if="available !== false"
    type="button"
    class="shuimo-share-card__trigger"
    aria-label="生成分享卡片"
    @click="onOpen"
  >
    分享
  </button>

  <div
    v-if="open"
    class="shuimo-share-card__overlay"
    role="dialog"
    aria-modal="true"
    aria-label="分享卡片预览"
    @keydown.esc="onClose"
    @click.self="onClose"
  >
    <div class="shuimo-share-card__panel">
      <p v-if="generating" class="shuimo-share-card__status">
        生成中…
      </p>
      <p v-else-if="error" class="shuimo-share-card__status">
        生成失败
      </p>
      <img v-else-if="previewUrl" :src="previewUrl" alt="分享卡片预览" class="shuimo-share-card__preview">
      <div class="shuimo-share-card__actions">
        <button type="button" :disabled="generating || !previewUrl" @click="download('portrait')">
          下载
        </button>
        <button type="button" :disabled="generating || !previewUrl" @click="copyToClipboard('portrait')">
          复制
        </button>
        <button ref="closeBtn" type="button" @click="onClose">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shuimo-share-card__trigger {
  border: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.08));
  border-radius: 4px;
  background: none;
  padding: 6px 16px;
  font-size: 13px;
  color: var(--sm-ink-light);
  font-family: var(--sm-font-kai);
  letter-spacing: 2px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;

  &:hover {
    color: var(--sm-ink-medium);
    border-color: var(--sm-accent);
  }
}

.shuimo-share-card__overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.shuimo-share-card__panel {
  max-width: min(92vw, 420px);
  padding: 1.5rem;
  background: var(--sm-paper-card, var(--shuimo-paper, #f5efe1));
  border-radius: 4px;
}

.shuimo-share-card__preview {
  display: block;
  width: 100%;
  height: auto;
}

.shuimo-share-card__status {
  text-align: center;
  margin: 2rem 0;
  color: var(--sm-ink-light);
  font-size: 14px;
  letter-spacing: 1px;
}

.shuimo-share-card__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1rem;

  button {
    border: 1px solid var(--sm-c-border, rgba(0, 0, 0, 0.08));
    border-radius: 4px;
    background: none;
    padding: 5px 14px;
    font-size: 13px;
    color: var(--sm-ink-light);
    font-family: var(--sm-font-kai);
    letter-spacing: 1px;
    cursor: pointer;
    transition:
      color 0.2s,
      border-color 0.2s;

    &:hover:not(:disabled) {
      color: var(--sm-ink-medium);
      border-color: var(--sm-accent);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
