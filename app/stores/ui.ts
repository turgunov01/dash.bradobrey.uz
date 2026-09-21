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
  const parts = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    timeZone: 'Asia/Tashkent',
    year: 'numeric'
  }).formatToParts(new Date())
  const year = parts.find(part => part.type === 'year')?.value || '2000'
  const month = parts.find(part => part.type === 'month')?.value || '01'
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()

  return {
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    start: `${year}-${month}-01`
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
