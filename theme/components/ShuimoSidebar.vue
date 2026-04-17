<script setup lang="ts">
import { useCategories, usePostList, useTags } from 'valaxy'
import { computed } from 'vue'
import { useThemeConfig } from '../composables'

const themeConfig = useThemeConfig()
const categories = useCategories()
const tags = useTags()
const postList = usePostList()

const recentPosts = computed(() => {
  return (postList.value || []).slice(0, 5)
})
</script>

<template>
  <aside class="shuimo-sidebar">
    <!-- 竖向墨线分隔 -->
    <ShuimoBrushLine
      direction="vertical"
      variant="light"
      :length="400"
      :width="2"
      class="shuimo-sidebar__border"
    />

    <!-- 印章头像 -->
    <div class="shuimo-sidebar__author">
      <ShuimoStamp
        :text="themeConfig?.sidebar?.author?.stamp || themeConfig?.stamp?.author || themeConfig?.sidebar?.author?.name || '墨'"
        :type="themeConfig?.stamp?.type || 'yin'"
        :shape="themeConfig?.stamp?.shape || 'auto'"
        class="shuimo-sidebar__stamp"
      />
      <div class="shuimo-sidebar__author-name">
        {{ themeConfig?.sidebar?.author?.name || '笔者' }}
      </div>
      <div v-if="themeConfig?.sidebar?.author?.motto" class="shuimo-sidebar__author-motto">
        {{ themeConfig.sidebar.author.motto }}
      </div>
    </div>

    <!-- 分类 -->
    <div
      v-if="themeConfig?.sidebar?.showCategories !== false && categories?.children?.size"
      class="shuimo-sidebar__section"
    >
      <div class="shuimo-sidebar__section-title">
        类目
      </div>
      <div class="shuimo-sidebar__category-list">
        <div
          v-for="[name, cat] in categories.children"
          :key="name"
          class="shuimo-sidebar__category-item"
        >
          <router-link :to="`/categories/${name}`">
            · {{ name }}
          </router-link>
          <span class="shuimo-sidebar__count">({{ cat.total }})</span>
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div
      v-if="themeConfig?.sidebar?.showTags !== false && tags?.size"
      class="shuimo-sidebar__section"
    >
      <div class="shuimo-sidebar__section-title">
        标签
      </div>
      <div class="shuimo-sidebar__tag-list">
        <router-link
          v-for="[name] in tags"
          :key="name"
          :to="`/tags/${name}`"
          class="shuimo-sidebar__tag"
        >
          {{ name }}
        </router-link>
      </div>
    </div>

    <!-- 近作 -->
    <div
      v-if="themeConfig?.sidebar?.showRecent !== false && recentPosts.length"
      class="shuimo-sidebar__section"
    >
      <div class="shuimo-sidebar__section-title">
        近作
      </div>
      <div class="shuimo-sidebar__recent-list">
        <router-link
          v-for="post in recentPosts"
          :key="post.path"
          :to="post.path || ''"
          class="shuimo-sidebar__recent-item"
        >
          {{ post.title }}
        </router-link>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.shuimo-sidebar {
  position: relative;
  padding: 16px;
  overflow: hidden;
  background: var(--sm-sidebar-bg);
  border-radius: 3px;

  &__border {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
  }

  &__author {
    text-align: center;
    margin-bottom: 24px;
  }

  &__stamp {
    margin: 0 auto 8px;
  }

  &__author-name {
    font-size: 13px;
    color: var(--sm-ink-dark);
    letter-spacing: 2px;
  }

  &__author-motto {
    font-size: 10px;
    color: var(--sm-ink-light);
    margin-top: 2px;
  }

  &__section {
    margin-bottom: 20px;
  }

  &__section-title {
    font-size: 12px;
    color: var(--sm-ink-dark);
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--sm-c-border);
  }

  &__category-list {
    font-size: 12px;
    color: var(--sm-ink-medium);
    line-height: 2;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--sm-accent);
      }
    }
  }

  &__count {
    color: var(--sm-ink-light);
    font-size: 10px;
    margin-left: 4px;
  }

  &__tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  &__tag {
    background: var(--sm-paper-card);
    padding: 2px 8px;
    border-radius: 2px;
    font-size: 11px;
    color: var(--sm-ink-medium);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--sm-accent);
    }
  }

  &__recent-list {
    font-size: 11px;
    line-height: 2;
  }

  &__recent-item {
    display: block;
    color: var(--sm-ink-medium);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      color: var(--sm-accent);
    }
  }
}

@media (max-width: 767px) {
  .shuimo-sidebar {
    padding-left: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    &__border {
      display: none;
    }

    &__author {
      grid-column: 1 / -1;
    }
  }
}
</style>
