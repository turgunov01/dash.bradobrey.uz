<script setup lang="ts">
import { generateEnrollmentCode, validateEnrollmentCode } from '~/utils/platformCompany'
import { getApiErrorStatus } from '~~/shared/auth/tenancy'

// PUT /api/kiosk/enrollment-code { enrollment_code }: the company's network
// admins rotate their own company's kiosk code (api MULTI_TENANCY 9.10 H1).
// The backend stores a hash only, so the code is shown once, right after saving.
const kioskApi = useKioskApi()
const companyContext = useCompanyContext()

const code = ref('')
const error = ref('')
const savedCode = ref('')
const saving = ref(false)

async function save() {
  error.value = validateEnrollmentCode(code.value)
  savedCode.value = ''
  if (error.value) return

  if (import.meta.client && !window.confirm('Заменить код подключения киосков? Старый код перестанет работать.')) return

  saving.value = true

  try {
    await kioskApi.rotateEnrollmentCode(code.value.trim())
    savedCode.value = code.value.trim()
    code.value = ''
  }
  catch (saveError) {
    error.value = getApiErrorStatus(saveError) === 403
      ? 'Менять код могут только администраторы сети компании.'
      : 'Не удалось сохранить код. Повторите попытку.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UCard>
    <form class="space-y-4" autocomplete="off" @submit.prevent="save">
      <div>
        <h2 class="text-base font-semibold text-charcoal-950">
          Код подключения киосков
        </h2>
        <p class="mt-1 max-w-3xl text-sm text-charcoal-600">
          При регистрации нового киоска на устройстве вводят код компании<template v-if="companyContext.current.value">
            (<span class="font-mono">{{ companyContext.current.value.code }}</span>)</template>
          и этот код подключения. Код хранится в зашифрованном виде и после сохранения больше не показывается.
          Уже подключённые киоски продолжают работать.
        </p>
      </div>

      <UAlert v-if="savedCode" color="success" variant="soft" icon="i-lucide-check" title="Новый код сохранён">
        <template #description>
          <p class="text-sm">
            Запишите его — повторно код не показывается:
          </p>
          <p class="mt-1 select-all font-mono text-base font-semibold tracking-wider">
            {{ savedCode }}
          </p>
        </template>
      </UAlert>

      <UFormField label="Новый код" name="enrollment_code" :error="error" help="От 8 до 128 символов.">
        <div class="flex flex-wrap gap-2">
          <UInput v-model="code" class="min-w-56 flex-1 font-mono" autocomplete="off" spellcheck="false" />
          <UButton color="neutral" variant="outline" icon="i-lucide-dices" @click="code = generateEnrollmentCode()">
            Сгенерировать
          </UButton>
          <UButton color="primary" type="submit" icon="i-lucide-key-round" :loading="saving">
            Сохранить код
          </UButton>
        </div>
      </UFormField>
    </form>
  </UCard>
</template>
