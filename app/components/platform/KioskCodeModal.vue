<script setup lang="ts">
import type { PlatformApiSource, PlatformCompany } from '~/composables/usePlatformApi'
import { generateEnrollmentCode, validateEnrollmentCode } from '~/utils/platformCompany'
import { describePlatformError } from '~~/shared/auth/tenancy'

// Kiosk enrollment code of a company: set/rotate or clear. The API stores a
// hash and never returns the code, so it is shown only right after saving.
const props = defineProps<{ open: boolean, company: PlatformCompany | null, source?: PlatformApiSource }>()
const emit = defineEmits<{ 'update:open': [boolean], saved: [PlatformCompany] }>()

const platformApi = usePlatformApi(props.source ?? 'platform')

const code = ref('')
const error = ref('')
const savedCode = ref('')
const saving = ref(false)

const description = computed(() => props.company
  ? `${props.company.name}: код вводят на киоске при регистрации устройства.`
  : '')

watch(() => props.open, (open) => {
  if (!open) return
  code.value = ''
  error.value = ''
  savedCode.value = ''
})

async function save(value: string | null) {
  error.value = ''

  if (value !== null) {
    error.value = validateEnrollmentCode(value)
    if (error.value) return
  }
  else if (import.meta.client && !window.confirm('Сбросить код подключения? Новые киоски компании смогут подключаться только через сотрудника.')) {
    return
  }

  if (!props.company) return
  saving.value = true

  try {
    const { company } = await platformApi.updateCompany(props.company.id, { kiosk_enrollment_code: value === null ? null : value.trim() })
    emit('saved', company)
    if (value === null) emit('update:open', false)
    else savedCode.value = value.trim()
  }
  catch (saveError) {
    error.value = describePlatformError(saveError)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal :open="props.open" title="Код подключения киосков" :description="description" @update:open="emit('update:open', $event)">
    <template #body>
      <UAlert v-if="savedCode" color="success" variant="soft" icon="i-lucide-check" title="Код сохранён">
        <template #description>
          <p class="text-sm">
            Запишите и передайте его компании — после закрытия окна код больше не будет показан.
          </p>
          <p class="mt-2 select-all font-mono text-base font-semibold tracking-wider">
            {{ savedCode }}
          </p>
        </template>
      </UAlert>

      <form v-else id="platform-kiosk-code-form" class="space-y-4" autocomplete="off" @submit.prevent="save(code)">
        <p class="text-sm text-charcoal-600">
          {{ props.company?.has_kiosk_enrollment_code
            ? 'Код уже задан. Новый код заменит его — старый перестанет работать.'
            : 'Код не задан: киоски компании подключаются только через сотрудника.' }}
        </p>

        <UFormField label="Новый код" name="kiosk_enrollment_code" :error="error" help="От 8 до 128 символов.">
          <div class="flex gap-2">
            <UInput v-model="code" class="w-full font-mono" autocomplete="off" spellcheck="false" />
            <UButton color="neutral" variant="outline" icon="i-lucide-dices" @click="code = generateEnrollmentCode()">
              Сгенерировать
            </UButton>
          </div>
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          v-if="!savedCode && props.company?.has_kiosk_enrollment_code"
          color="error"
          variant="ghost"
          icon="i-lucide-eraser"
          :loading="saving"
          @click="save(null)"
        >
          Сбросить код
        </UButton>
        <span v-else />
        <div class="flex gap-2">
          <UButton color="neutral" variant="ghost" @click="emit('update:open', false)">
            {{ savedCode ? 'Готово' : 'Отмена' }}
          </UButton>
          <UButton v-if="!savedCode" color="primary" form="platform-kiosk-code-form" type="submit" :loading="saving">
            Сохранить код
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
