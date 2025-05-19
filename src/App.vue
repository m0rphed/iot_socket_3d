<script setup lang="ts">
import RoomEditor from './components/RoomEditor.vue'
</script>

<template>
  <div class="app">
    <RoomEditor />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
