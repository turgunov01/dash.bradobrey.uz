<script setup lang="ts">
import type { PlatformCompany } from '~/composables/usePlatformApi'
import { buildCompanyPayload, emptyCompanyForm, validateCompanyForm, type CompanyFormState } from '~/utils/platformCompany'
import { describePlatformError, getApiErrorBody, getApiErrorCode } from '~~/shared/auth/tenancy'

// Create (company = null) or edit a company's name, code and branding.
const props = defineProps<{ open: boolean, company: PlatformCompany | null }>()
const emit = defineEmits<{ 'update:open': [boolean], saved: [PlatformCompany] }>()

const platformApi = usePlatformApi()

const form = reactive<CompanyFormState>(emptyCompanyForm())
const errors = ref<Partial<Record<keyof CompanyFormState, string>>>({})
const submitError = ref('')
const failedPreconditions = ref<string[]>([])
const saving = ref(false)

const isEdit = computed(() => Boolean(props.company))
const colorPreview = computed(() => /^#[0-9A-Fa-f]{6}$/.test(form.primary_color.trim()) ? form.primary_color.trim() : 'transparent')

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, emptyCompanyForm(props.company))
  errors.value = {}
  submitError.value = ''
  failedPreconditions.value = []
}, { immediate: true })

async function submit() {
  submitError.value = ''
  failedPreconditions.value = []
  errors.value = validateCompanyForm(form)
  if (Object.keys(errors.value).length) return

  const payload = buildCompanyPayload(form, props.company)

  if (isEdit.value && !Object.keys(payload).length) {
    emit('update:open', false)
    return
  }

  saving.value = true

  try {
    const response = props.company
      ? await platformApi.updateCompany(props.company.id, payload)
      : await platformApi.createCompany(payload as { name: string, code: string })
    emit('saved', response.company)
    emit('update:open', false)
  }
  catch (error) {
    const code = getApiErrorCode(error)

    if (code === 'MULTI_COMPANY_PRECONDITIONS') {
      const failed = getApiErrorBody(error)?.failed
      failedPreconditions.value = Array.isArray(failed) ? failed.map(String) : []
    }
    else if (code === 'COMPANY_CODE_TAKEN') {
      errors.value = { code: describePlatformError(error) }
    }
    else {
      submitError.value = describePlatformError(error)
    }
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="isEdit ? 'Изменить компанию' : 'Новая компания'"
    :description="isEdit ? 'Название, код и оформление компании.' : 'Компания получит свой код для входа в панель, киоск и приложение барбера.'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form id="platform-company-form" class="space-y-4" @submit.prevent="submit">
        <PlatformPreconditionsAlert v-if="failedPreconditions.length" :failed="failedPreconditions" />

        <UFormField label="Название" name="name" required :error="errors.name">
          <UInput v-model="form.name" class="w-full" placeholder="Например, President" />
        </UFormField>

        <UFormField
          label="Код компании"
          name="code"
          required
          :error="errors.code"
          :help="isEdit ? 'После смены кода его нужно будет вводить заново при входе и на устройствах.' : 'Его вводят сотрудники при входе и при подключении киосков.'"
        >
          <UInput v-model="form.code" class="w-full" placeholder="PRESIDENT" spellcheck="false" :ui="{ base: 'uppercase tracking-wide' }" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Валюта" name="currency" :error="errors.currency" help="Пусто — значение по умолчанию.">
            <UInput v-model="form.currency" class="w-full" placeholder="UZS" maxlength="3" :ui="{ base: 'uppercase' }" />
          </UFormField>

          <UFormField label="Часовой пояс" name="timezone" :error="errors.timezone" help="IANA, например Asia/Tashkent.">
            <UInput v-model="form.timezone" class="w-full" placeholder="Asia/Tashkent" />
          </UFormField>
        </div>

        <UFormField label="Логотип (ссылка)" name="logo_url" :error="errors.logo_url">
          <UInput v-model="form.logo_url" class="w-full" placeholder="https://…" type="url" />
        </UFormField>

        <UFormField label="Основной цвет" name="primary_color" :error="errors.primary_color">
          <div class="flex items-center gap-2">
            <UInput v-model="form.primary_color" class="w-full" placeholder="#1F2937" />
            <span class="size-8 shrink-0 rounded-md border border-charcoal-200" :style="{ backgroundColor: colorPreview }" aria-hidden="true" />
          </div>
        </UFormField>

        <p v-if="submitError" class="text-sm text-error" role="alert">
          {{ submitError }}
        </p>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="emit('update:open', false)">
          Отмена
        </UButton>
        <UButton color="primary" form="platform-company-form" type="submit" :loading="saving">
          {{ isEdit ? 'Сохранить' : 'Создать компанию' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
