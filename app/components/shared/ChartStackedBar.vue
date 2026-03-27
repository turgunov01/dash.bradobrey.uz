<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

type BarDataset = {
  label: string
  data: number[]
  backgroundColor: string
}

const props = defineProps<{
  labels: string[]
  datasets: BarDataset[]
  title?: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: any = null

async function render() {
  if (!process.client || !canvasRef.value) return

  const { default: Chart } = await import('chart.js/auto')

  chart?.destroy()

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: props.datasets
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        title: props.title
          ? { display: true, text: props.title }
          : undefined
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
      },
      animation: false
    }
  })
}

watch(() => [props.labels, props.datasets], render, { deep: true })

onMounted(render)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="h-[320px] w-full">
    <canvas ref="canvasRef" class="w-full h-full" aria-label="stacked bar chart" />
  </div>
</template>
