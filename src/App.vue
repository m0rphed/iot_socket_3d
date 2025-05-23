<script setup lang="ts">
import RoomEditor from './components/editor/RoomEditor.vue'
</script>

<template>
  <div class="app">
    <RoomEditor />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', Arial, sans-serif;
  background-color: #f5f5f5;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

html, body, #app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
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
