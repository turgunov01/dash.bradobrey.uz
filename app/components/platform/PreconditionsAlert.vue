<script setup lang="ts">
import { describeMultiCompanyPreconditions } from '~~/shared/auth/tenancy'

// 409 MULTI_COMPANY_PRECONDITIONS: what must be enabled on the API before a
// second active company is allowed (api MULTI_TENANCY.md 9.9).
const props = defineProps<{ failed: string[] }>()

const items = computed(() => describeMultiCompanyPreconditions(props.failed))
</script>

<template>
  <UAlert
    color="warning"
    variant="soft"
    icon="i-lucide-shield-alert"
    title="Вторую компанию пока нельзя включить"
  >
    <template #description>
      <p class="text-sm">
        Сначала администратор сервера должен выполнить условия безопасности:
      </p>
      <ul class="mt-2 list-disc space-y-1 ps-5 text-sm">
        <li v-for="item in items" :key="item">
          {{ item }}
        </li>
      </ul>
      <p class="mt-2 text-xs opacity-80">
        Перед этим обновите приложения киоска и барбера (ввод кода компании) и убедитесь, что сотрудники входят в панель с кодом компании.
      </p>
    </template>
  </UAlert>
</template>
