<template>
  <ShuimoLayout vertical-nav>
    <div class="shuimo-main-layout">
      <div class="shuimo-content">
        <slot>
          <RouterView />
        </slot>
      </div>
    </div>
  </ShuimoLayout>
</template>
