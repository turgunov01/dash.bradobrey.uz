<template>
  <div class="u-loader">
    <div class="u-loader__spinner"></div>
  </div>
</template>

<style scoped>
.u-loader {
  width: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.u-loader__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(120, 120, 120, 0.25);
  border-top-color: rgba(120, 120, 120, 0.9);
  border-radius: 999px;
  animation: u-loader-spin 0.8s linear infinite;
}

@keyframes u-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
