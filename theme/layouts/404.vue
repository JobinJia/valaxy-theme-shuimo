<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <ShuimoClickPetals />
  <ShuimoLayout>
    <div class="shuimo-404">
      <!-- 迷雾山水背景 -->
      <ShuimoDecoration
        type="mountain"
        position="bottom-left"
        size="lg"
        :opacity="0.15"
        name="404-misty-mountain"
      />

      <div class="shuimo-404__icon">
        <ShuimoStamp text="迷" type="yin" :size="80" />
      </div>
      <h1 class="shuimo-404__title">
        迷途
      </h1>
      <p class="shuimo-404__desc">
        此路不通，山水之间，尚需寻觅。
      </p>
      <RouterView />
      <button class="shuimo-404__btn" @click="router.back()">
        归去来兮 ←
      </button>
    </div>
  </ShuimoLayout>
</template>

<style lang="scss" scoped>
.shuimo-404 {
  text-align: center;
  padding: 80px 20px;
  position: relative;
  overflow: hidden;

  &__icon {
    margin: 0 auto 24px;
    width: 80px;
  }

  &__title {
    font-size: 28px;
    color: var(--sm-ink-dark);
    letter-spacing: 8px;
    margin-bottom: 12px;
  }

  &__desc {
    font-size: 14px;
    color: var(--sm-ink-light);
    letter-spacing: 2px;
    margin-bottom: 32px;
  }

  &__btn {
    font-family: var(--va-font-family-base);
    font-size: 13px;
    color: var(--sm-ink-medium);
    background: none;
    border: 1px solid var(--sm-c-border-medium);
    padding: 8px 20px;
    border-radius: 3px;
    cursor: pointer;
    letter-spacing: 2px;
    transition: all 0.2s;

    &:hover {
      color: var(--sm-accent);
      border-color: var(--sm-accent);
    }
  }
}

@media (max-width: 767px) {
  .shuimo-404 {
    padding: 48px 16px;

    &__icon {
      margin-bottom: 16px;
    }

    &__title {
      font-size: 22px;
      letter-spacing: 4px;
    }

    &__desc {
      font-size: 13px;
      letter-spacing: 1px;
    }
  }
}
</style>
