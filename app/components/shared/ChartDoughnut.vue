<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

type DoughnutDataset = {
  data: number[]
  backgroundColor: string[]
  label?: string
}

const props = defineProps<{
  labels: string[]
  dataset: DoughnutDataset
  title?: string
  tooltipLabels?: string[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: any = null

async function render() {
  if (!process.client || !canvasRef.value) return

  const { default: Chart } = await import('chart.js/auto')

  chart?.destroy()

  chart = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [props.dataset]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              if (props.tooltipLabels?.[context.dataIndex]) {
                return props.tooltipLabels[context.dataIndex]
              }
              const label = context.label || ''
              const value = context.parsed
              return `${label}: ${value}`
            }
          }
        },
        title: props.title
          ? {
              display: true,
              text: props.title
            }
          : undefined
      },
      animation: false
    }
  })
}

watch(() => [props.labels, props.dataset], render, { deep: true })

onMounted(render)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <canvas ref="canvasRef" class="w-full" aria-label="doughnut chart" />
</template>
