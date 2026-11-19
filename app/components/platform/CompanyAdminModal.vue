<script setup lang="ts">
import type { PlatformCompany } from '~/composables/usePlatformApi'
import { describePlatformError, getApiErrorCode, PLATFORM_PASSWORD_MAX_LENGTH, PLATFORM_PASSWORD_MIN_LENGTH } from '~~/shared/auth/tenancy'

// First administrator of a company (role admin): POST /api/platform/companies/:id/admins.
const props = defineProps<{ open: boolean, company: PlatformCompany | null }>()
const emit = defineEmits<{ 'update:open': [boolean], created: [string] }>()

const platformApi = usePlatformApi()

const form = reactive({ login: '', password: '', confirm: '' })
const errors = reactive({ login: '', password: '', confirm: '' })
const submitError = ref('')
const saving = ref(false)

const description = computed(() => props.company
  ? `Учётная запись с ролью «Администратор» для компании ${props.company.name} (код ${props.company.code}).`
  : '')

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, { login: '', password: '', confirm: '' })
  Object.assign(errors, { login: '', password: '', confirm: '' })
  submitError.value = ''
})

function validate() {
  const login = form.login.trim()
  errors.login = !login || login.length > 64 || /\s/.test(login) ? 'Логин: до 64 символов, без пробелов.' : ''
  errors.password = form.password.length < PLATFORM_PASSWORD_MIN_LENGTH || form.password.length > PLATFORM_PASSWORD_MAX_LENGTH
    ? `Пароль: от ${PLATFORM_PASSWORD_MIN_LENGTH} до ${PLATFORM_PASSWORD_MAX_LENGTH} символов.`
    : ''
  errors.confirm = form.confirm !== form.password ? 'Пароли не совпадают.' : ''
  return !errors.login && !errors.password && !errors.confirm
}

async function submit() {
  submitError.value = ''
  if (!props.company || !validate()) return

  saving.value = true

  try {
    const { user } = await platformApi.createCompanyAdmin(props.company.id, { login: form.login.trim(), password: form.password })
    emit('created', user.login)
    emit('update:open', false)
  }
  catch (error) {
    if (getApiErrorCode(error) === 'LOGIN_TAKEN') errors.login = 'Этот логин уже занят в компании.'
    else submitError.value = describePlatformError(error)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal :open="props.open" title="Администратор компании" :description="description" @update:open="emit('update:open', $event)">
    <template #body>
      <form id="platform-company-admin-form" class="space-y-4" autocomplete="off" @submit.prevent="submit">
        <UFormField label="Логин" name="login" required :error="errors.login">
          <UInput v-model="form.login" class="w-full" autocomplete="off" placeholder="admin" />
        </UFormField>
        <UFormField label="Пароль" name="password" required :error="errors.password">
          <UInput v-model="form.password" class="w-full" autocomplete="new-password" type="password" />
        </UFormField>
        <UFormField label="Повторите пароль" name="confirm" required :error="errors.confirm">
          <UInput v-model="form.confirm" class="w-full" autocomplete="new-password" type="password" />
        </UFormField>
        <p class="text-xs text-charcoal-500">
          Передайте администратору код компании, логин и пароль. Остальных сотрудников он создаст сам.
        </p>
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
        <UButton color="primary" form="platform-company-admin-form" type="submit" :loading="saving">
          Создать администратора
        </UButton>
      </div>
    </template>
  </UModal>
</template>
