import { defineStore } from 'pinia'

type StatisticsRange = {
  end: string
  start: string
}

type UiState = {
  apiDebugEntries: DebugEntry[]
  barberHistoryStatus: string
  statisticsRange: StatisticsRange
}

export type DebugEntry = {
  at: string
  error?: any
  method: string
  request?: any
  response?: any
  status: 'error' | 'success'
  url: string
}

function getDefaultRange(): StatisticsRange {
  const end = new Date()
  const start = new Date()

  start.setDate(end.getDate() - 30)

  return {
    end: end.toISOString().slice(0, 10),
    start: start.toISOString().slice(0, 10)
  }
}

export const useUiStore = defineStore('ui', {
  actions: {
    clearDebug() {
      this.apiDebugEntries = []
    },
    pushDebug(entry: DebugEntry) {
      this.apiDebugEntries = [entry, ...this.apiDebugEntries].slice(0, 40)
    },
    setHistoryStatus(value: string) {
      this.barberHistoryStatus = value
    },
    setStatisticsRange(range: StatisticsRange) {
      this.statisticsRange = range
    }
  },
  state: (): UiState => ({
    apiDebugEntries: [] as DebugEntry[],
    barberHistoryStatus: '',
    statisticsRange: getDefaultRange()
  })
})
