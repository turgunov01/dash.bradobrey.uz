<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { PlatformOwner, PlatformOwnersSource } from '~/composables/usePlatformApi'
import {
  describePlatformError,
  getApiErrorCode,
  getApiErrorStatus,
  PLATFORM_PASSWORD_MAX_LENGTH,
  PLATFORM_PASSWORD_MIN_LENGTH
} from '~~/shared/auth/tenancy'

// Platform-owner accounts: GET/POST /api/platform/owners. Used in the platform
// area (platform session) and in the default company's settings (company session).
const props = defineProps<{ source: PlatformOwnersSource }>()

const ownersApi = usePlatformOwnersApi(props.source)

const { data, pending, error: loadError, refresh } = await useAsyncData(`platform-owners-${props.source}`, async () => {
  const response = await ownersApi.list()
  return Array.isArray(response?.owners) ? response.owners : []
}, { lazy: true })

const owners = computed<PlatformOwner[]>(() => data.value || [])
const loadMessage = computed(() => {
  if (!loadError.value) return ''
  return getApiErrorStatus(loadError.value) === 403
    ? 'Список доступен только владельцу платформы и администраторам сети основной компании.'
    : describePlatformError(loadError.value)
})

const form = reactive({ login: '', password: '', confirm: '' })
const errors = reactive({ login: '', password: '', confirm: '' })
const submitError = ref('')
const createdLogin = ref('')
const saving = ref(false)

const columns: TableColumn<PlatformOwner>[] = [
  { accessorKey: 'login', header: 'Логин' },
  { accessorKey: 'created_at', header: 'Создан' }
]

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

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
  createdLogin.value = ''
  if (!validate()) return

  saving.value = true

  try {
    const { owner } = await ownersApi.create({ login: form.login.trim(), password: form.password })
    createdLogin.value = owner?.login || form.login.trim()
    Object.assign(form, { login: '', password: '', confirm: '' })
    await refresh()
  }
  catch (error) {
    if (getApiErrorCode(error) === 'LOGIN_TAKEN') errors.login = 'Этот логин уже занят.'
    else submitError.value = describePlatformError(error)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <section class="space-y-3" aria-label="Владельцы платформы">
      <p class="max-w-3xl text-sm text-charcoal-600">
        Владелец платформы создаёт компании-франчайзи, их первых администраторов и включает или приостанавливает доступ.
        Данные компаний (клиенты, статистика, финансы) ему недоступны.
      </p>

      <UAlert v-if="loadMessage" color="error" variant="soft" icon="i-lucide-triangle-alert" title="Не удалось загрузить список" :description="loadMessage" />

      <SharedSkeletonRows v-else-if="pending && !data" :rows="3" :columns="2" />

      <UTable
        v-else-if="owners.length"
        :columns="columns"
        :data="owners"
        :get-row-id="(row) => row.id"
        :ui="{
          thead: 'bg-charcoal-50/90',
          tbody: 'divide-y divide-charcoal-100',
          th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
          td: 'px-4 py-3 text-sm text-charcoal-700 align-middle'
        }"
      >
        <template #login-cell="{ row }">
          <span class="font-medium text-charcoal-950">{{ row.original.login }}</span>
        </template>
        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>
      </UTable>

      <SharedEmptyState
        v-else
        description="Создайте учётную запись владельца платформы в форме справа."
        icon="i-lucide-shield-user"
        title="Владельцев пока нет"
      />
    </section>

    <UCard class="h-fit">
      <form class="space-y-4" autocomplete="off" @submit.prevent="submit">
        <div>
          <h2 class="text-base font-semibold text-charcoal-950">
            Новый владелец платформы
          </h2>
          <p class="text-xs text-charcoal-500">
            Входит через «Вход для владельца платформы» без кода компании.
          </p>
        </div>

        <UFormField label="Логин" name="login" required :error="errors.login">
          <UInput v-model="form.login" class="w-full" autocomplete="off" />
        </UFormField>
        <UFormField label="Пароль" name="password" required :error="errors.password">
          <UInput v-model="form.password" class="w-full" autocomplete="new-password" type="password" />
        </UFormField>
        <UFormField label="Повторите пароль" name="confirm" required :error="errors.confirm">
          <UInput v-model="form.confirm" class="w-full" autocomplete="new-password" type="password" />
        </UFormField>

        <p v-if="submitError" class="text-sm text-error" role="alert">
          {{ submitError }}
        </p>
        <p v-if="createdLogin" class="text-sm text-success" role="status">
          Владелец «{{ createdLogin }}» создан.
        </p>

        <UButton block color="primary" type="submit" :loading="saving">
          Создать владельца
        </UButton>
      </form>
    </UCard>
  </div>
</template>
