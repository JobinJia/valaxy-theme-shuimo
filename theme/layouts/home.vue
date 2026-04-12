<template>
  <ShuimoLayout>
    <template #main>
      <div class="shuimo-main-layout">
        <div class="shuimo-content">
          <slot>
            <RouterView />
          </slot>
        </div>
        <ShuimoSidebar />
      </div>
    </template>
  </ShuimoLayout>
</template>
