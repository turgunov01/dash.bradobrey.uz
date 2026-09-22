<script setup lang="ts">
import { useCalculatorModal } from '#imports'

type Operator = '+' | '-' | '×' | '÷'

type CalculatorButton = {
  color: 'error' | 'neutral' | 'primary'
  kind: 'action' | 'decimal' | 'digit' | 'equals' | 'operator'
  label: string
  value?: string
  variant: 'outline' | 'soft' | 'solid'
}

withDefaults(defineProps<{
  collapsed?: boolean
  showModal?: boolean
  showTrigger?: boolean
}>(), {
  collapsed: false,
  showModal: true,
  showTrigger: true
})

const ERROR_VALUE = 'Ошибка'

const { calculatorOpen, openCalculator } = useCalculatorModal()

const currentValue = ref('0')
const previousValue = ref<number | null>(null)
const operator = ref<Operator | null>(null)
const waitingForOperand = ref(false)
const lastExpression = ref('')

const buttonRows: CalculatorButton[][] = [
  [
    { color: 'error', kind: 'action', label: 'AC', variant: 'soft' },
    { color: 'neutral', kind: 'action', label: '⌫', value: 'backspace', variant: 'outline' },
    { color: 'neutral', kind: 'action', label: '%', value: 'percent', variant: 'outline' },
    { color: 'primary', kind: 'operator', label: '÷', value: '÷', variant: 'outline' }
  ],
  [
    { color: 'neutral', kind: 'digit', label: '7', value: '7', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '8', value: '8', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '9', value: '9', variant: 'outline' },
    { color: 'primary', kind: 'operator', label: '×', value: '×', variant: 'outline' }
  ],
  [
    { color: 'neutral', kind: 'digit', label: '4', value: '4', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '5', value: '5', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '6', value: '6', variant: 'outline' },
    { color: 'primary', kind: 'operator', label: '-', value: '-', variant: 'outline' }
  ],
  [
    { color: 'neutral', kind: 'digit', label: '1', value: '1', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '2', value: '2', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '3', value: '3', variant: 'outline' },
    { color: 'primary', kind: 'operator', label: '+', value: '+', variant: 'outline' }
  ],
  [
    { color: 'neutral', kind: 'action', label: '+/-', value: 'sign', variant: 'outline' },
    { color: 'neutral', kind: 'digit', label: '0', value: '0', variant: 'outline' },
    { color: 'neutral', kind: 'decimal', label: ',', value: '.', variant: 'outline' },
    { color: 'primary', kind: 'equals', label: '=', variant: 'solid' }
  ]
]

const buttons = buttonRows.flat()

const hasError = computed(() => currentValue.value === ERROR_VALUE)

const displayValue = computed(() => {
  if (hasError.value) {
    return ERROR_VALUE
  }

  return formatDisplay(currentValue.value)
})

const secondaryValue = computed(() => {
  if (hasError.value) {
    return 'Сбросьте вычисление и попробуйте снова'
  }

  if (previousValue.value !== null && operator.value) {
    const leftValue = formatDisplay(serializeNumber(previousValue.value))
    const rightValue = waitingForOperand.value ? '' : ` ${formatDisplay(currentValue.value)}`

    return `${leftValue} ${operator.value}${rightValue}`
  }

  if (lastExpression.value) {
    return lastExpression.value
  }

  return 'Быстрые вычисления прямо в панели'
})

function clearAll() {
  currentValue.value = '0'
  previousValue.value = null
  operator.value = null
  waitingForOperand.value = false
  lastExpression.value = ''
}

function setError() {
  currentValue.value = ERROR_VALUE
  previousValue.value = null
  operator.value = null
  waitingForOperand.value = false
}

function serializeNumber(value: number) {
  if (!Number.isFinite(value)) {
    return ERROR_VALUE
  }

  const normalized = Math.abs(value) < 1e-10
    ? 0
    : Number(value.toFixed(10))

  return String(normalized)
}

function formatDisplay(value: string) {
  if (!value || value === ERROR_VALUE) {
    return ERROR_VALUE
  }

  if (value.includes('e')) {
    return value.replace('.', ',')
  }

  const negative = value.startsWith('-')
  const normalized = negative ? value.slice(1) : value
  const [integerPart, decimalPart] = normalized.split('.')
  const groupedInteger = (integerPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return `${negative ? '-' : ''}${groupedInteger}${decimalPart !== undefined ? `,${decimalPart}` : ''}`
}

function performCalculation(left: number, right: number, currentOperator: Operator) {
  switch (currentOperator) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '×':
      return left * right
    case '÷':
      if (right === 0) {
        return null
      }

      return left / right
  }
}

function inputDigit(digit: string) {
  if (hasError.value) {
    clearAll()
  }

  const digitsCount = currentValue.value.replace(/[-.]/g, '').length

  if (!waitingForOperand.value && digitsCount >= 14) {
    return
  }

  if (waitingForOperand.value) {
    currentValue.value = digit
    waitingForOperand.value = false
    return
  }

  if (currentValue.value === '0') {
    currentValue.value = digit
    return
  }

  if (currentValue.value === '-0') {
    currentValue.value = `-${digit}`
    return
  }

  currentValue.value += digit
}

function inputDecimal() {
  if (hasError.value) {
    clearAll()
  }

  if (waitingForOperand.value) {
    currentValue.value = '0.'
    waitingForOperand.value = false
    return
  }

  if (!currentValue.value.includes('.')) {
    currentValue.value += '.'
  }
}

function toggleSign() {
  if (hasError.value) {
    clearAll()
    return
  }

  if (currentValue.value === '0') {
    return
  }

  currentValue.value = currentValue.value.startsWith('-')
    ? currentValue.value.slice(1)
    : `-${currentValue.value}`
}

function applyPercent() {
  if (hasError.value) {
    clearAll()
    return
  }

  currentValue.value = serializeNumber(Number(currentValue.value) / 100)
  waitingForOperand.value = false
}

function backspace() {
  if (hasError.value) {
    clearAll()
    return
  }

  if (waitingForOperand.value) {
    return
  }

  const nextValue = currentValue.value.slice(0, -1)

  if (!nextValue || nextValue === '-') {
    currentValue.value = '0'
    return
  }

  currentValue.value = nextValue
}

function applyOperator(nextOperator: Operator) {
  if (hasError.value) {
    clearAll()
  }

  const inputValue = Number(currentValue.value)

  if (previousValue.value === null) {
    previousValue.value = inputValue
  } else if (operator.value && !waitingForOperand.value) {
    const result = performCalculation(previousValue.value, inputValue, operator.value)

    if (result === null) {
      setError()
      return
    }

    previousValue.value = result
    currentValue.value = serializeNumber(result)
  }

  operator.value = nextOperator
  waitingForOperand.value = true
  lastExpression.value = ''
}

function applyEquals() {
  if (hasError.value || previousValue.value === null || operator.value === null || waitingForOperand.value) {
    return
  }

  const leftValue = previousValue.value
  const rightValue = Number(currentValue.value)
  const currentOperator = operator.value
  const result = performCalculation(leftValue, rightValue, currentOperator)

  if (result === null) {
    setError()
    return
  }

  lastExpression.value = `${formatDisplay(serializeNumber(leftValue))} ${currentOperator} ${formatDisplay(serializeNumber(rightValue))}`
  currentValue.value = serializeNumber(result)
  previousValue.value = null
  operator.value = null
  waitingForOperand.value = false
}

function handleAction(action?: string) {
  switch (action) {
    case 'backspace':
      backspace()
      return
    case 'percent':
      applyPercent()
      return
    case 'sign':
      toggleSign()
      return
    default:
      clearAll()
  }
}

function handleButtonPress(button: CalculatorButton) {
  switch (button.kind) {
    case 'digit':
      inputDigit(button.value || button.label)
      return
    case 'decimal':
      inputDecimal()
      return
    case 'operator':
      applyOperator((button.value || button.label) as Operator)
      return
    case 'equals':
      applyEquals()
      return
    case 'action':
      handleAction(button.value)
  }
}
</script>

<template>
  <div v-if="showTrigger" class="mt-3">
    <UTooltip :disabled="!collapsed" text="Калькулятор">
      <UButton
        :block="!collapsed"
        :icon="collapsed ? 'i-lucide-calculator' : undefined"
        :label="collapsed ? undefined : 'Калькулятор'"
        :square="collapsed"
        class="justify-start"
        color="neutral"
        title="Калькулятор"
        variant="outline"
        @click="openCalculator"
      />
    </UTooltip>
  </div>

  <UModal
    v-if="showModal"
    v-model:open="calculatorOpen"
    class="sm:max-w-md"
    description="Быстрые вычисления без перехода на другую страницу."
    title="Калькулятор"
  >
    <template #body>
      <div class="space-y-4">
        <div class="rounded-[1.5rem] border border-charcoal-200 bg-[var(--dashboard-shell)] p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal-500">
            {{ secondaryValue }}
          </p>
          <p class="mt-4 break-all text-right text-4xl font-semibold text-charcoal-950">
            {{ displayValue }}
          </p>
        </div>

        <div class="grid grid-cols-4 gap-3">
          <UButton
            v-for="button in buttons"
            :key="button.label"
            :color="button.color"
            :label="button.label"
            :variant="button.variant"
            class="h-12 justify-center text-base font-semibold sm:h-14 sm:text-lg"
            @click="handleButtonPress(button)"
          />
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full items-center justify-between gap-3">
        <UButton color="neutral" variant="outline" @click="clearAll">
          Сбросить
        </UButton>
        <UButton color="neutral" variant="ghost" @click="close">
          Закрыть
        </UButton>
      </div>
    </template>
  </UModal>
</template>
