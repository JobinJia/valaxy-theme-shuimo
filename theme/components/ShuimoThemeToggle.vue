<script setup lang="ts">
import { useValaxyDark } from 'valaxy'

const { isDark, toggleDarkWithTransition } = useValaxyDark({ circleTransition: true })
</script>

<template>
  <button
    class="shuimo-theme-toggle"
    :title="isDark ? '切换亮色' : '切换暗色'"
    @click="toggleDarkWithTransition($event)"
  >
    <div class="shuimo-theme-toggle__icons">
      <!-- 亮色模式：太阳 -->
      <svg viewBox="0 0 48 48" class="shuimo-theme-toggle__icon shuimo-theme-toggle__sun" :class="{ active: !isDark }">
        <line x1="24" y1="4" x2="24" y2="10" class="ray" />
        <line x1="24" y1="38" x2="24" y2="44" class="ray" />
        <line x1="4" y1="24" x2="10" y2="24" class="ray" />
        <line x1="38" y1="24" x2="44" y2="24" class="ray" />
        <line x1="10" y1="10" x2="14" y2="14" class="ray" />
        <line x1="34" y1="34" x2="38" y2="38" class="ray" />
        <line x1="10" y1="38" x2="14" y2="34" class="ray" />
        <line x1="34" y1="14" x2="38" y2="10" class="ray" />
        <circle cx="24" cy="24" r="9" class="sun" />
      </svg>

      <!-- 暗色模式：弯月 -->
      <svg viewBox="0 0 48 48" class="shuimo-theme-toggle__icon shuimo-theme-toggle__moon" :class="{ active: isDark }">
        <circle cx="24" cy="24" r="12" class="moon" />
        <circle cx="30" cy="20" r="10" class="moon-mask" />
        <circle cx="12" cy="12" r="1.2" class="star" />
        <circle cx="8" cy="28" r="0.9" class="star" />
        <circle cx="38" cy="10" r="1" class="star" />
      </svg>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.shuimo-theme-toggle {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 100;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.15);
  }

  &:active {
    transform: scale(0.95);
  }

  &__icons {
    position: relative;
    width: 100%;
    height: 100%;
  }

  &__icon {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.4s ease;

    &.active {
      opacity: 1;
    }

    .sun {
      fill: none;
      stroke: var(--sm-ink-light);
      stroke-width: 1.5;
    }

    .ray {
      stroke: var(--sm-ink-light);
      stroke-width: 1.2;
      stroke-linecap: round;
    }

    .moon {
      fill: #E8E0C8;
    }

    .moon-mask {
      fill: var(--sm-paper, #151210);
    }

    .star {
      fill: #E8E0C8;
      opacity: 0.7;
    }
  }
}

@media (max-width: 767px) {
  .shuimo-theme-toggle {
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
  }
}
</style>
