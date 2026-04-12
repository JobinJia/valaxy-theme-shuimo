<template>
  <div class="shuimo-app">
    <ShuimoHeroLandscape />

    <div class="shuimo-app__paper">
      <ShuimoHeader />

      <slot name="main">
        <router-view />
      </slot>

      <ShuimoHelper />
      <ShuimoFooter />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shuimo-app {
  min-height: 100vh;
  position: relative;

  &__paper {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: rgba(245, 240, 230, 0.55);
  }
}
</style>
