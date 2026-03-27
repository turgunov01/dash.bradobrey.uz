import { z } from 'zod'

const identifierSchema = z.union([z.string(), z.number()]).transform(value => String(value))
const optionalTextSchema = z.string().trim().optional().nullable()
const numberLikeSchema = z.union([z.number(), z.string()]).transform(value => Number(value || 0))

export const branchSchema = z.object({
  id: identifierSchema,
  name: z.string().catch('Неизвестный филиал'),
  address: optionalTextSchema,
  is_active: z.boolean().optional().nullable()
}).passthrough()

export const barberUserSchema = z.object({
  id: identifierSchema.optional(),
  login: optionalTextSchema,
  name: z.string().catch('Неизвестный барбер'),
  phone: optionalTextSchema,
  role: optionalTextSchema
}).passthrough()

export const barberSchema = z.object({
  id: identifierSchema,
  user_id: identifierSchema.optional(),
  branch_id: identifierSchema.optional(),
  name: optionalTextSchema,
  phone: optionalTextSchema,
  specialization: optionalTextSchema,
  photo_url: optionalTextSchema,
  avatar_url: optionalTextSchema,
  is_on_break: z.boolean().optional().nullable(),
  is_on_shift: z.boolean().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  current_clients: z.number().optional().nullable(),
  estimated_waiting_time: z.number().optional().nullable(),
  user: barberUserSchema.optional().nullable()
}).passthrough()

export const serviceSchema = z.object({
  id: identifierSchema,
  name: z.string().catch('Услуга без названия'),
  price: z.union([z.string(), z.number()]).optional().nullable(),
  base_price: z.union([z.string(), z.number()]).optional().nullable(),
  duration: z.union([z.string(), z.number()]).optional().nullable(),
  duration_minutes: z.union([z.string(), z.number()]).optional().nullable(),
  category_id: identifierSchema.optional().nullable(),
  category: optionalTextSchema,
  category_name: optionalTextSchema,
  image: optionalTextSchema,
  is_active: z.boolean().optional().nullable()
}).passthrough()

export const serviceCategorySchema = z.object({
  id: identifierSchema.optional().nullable(),
  name: optionalTextSchema,
  title: optionalTextSchema,
  services: z.array(serviceSchema).default([])
}).passthrough()

export const queueItemSchema = z.object({
  id: identifierSchema,
  branch_id: identifierSchema.optional().nullable(),
  barber_id: identifierSchema.optional().nullable(),
  customer_name: optionalTextSchema,
  phone_number: optionalTextSchema,
  status: optionalTextSchema,
  payment_method: optionalTextSchema,
  amount: z.union([z.number(), z.string()]).optional().nullable(),
  price_override: z.union([z.number(), z.string()]).optional().nullable(),
  price_override_reason: optionalTextSchema,
  no_show: z.boolean().optional().nullable(),
  swapped_flag: z.boolean().optional().nullable(),
  certificate_code: optionalTextSchema,
  created_at: optionalTextSchema,
  updated_at: optionalTextSchema,
  called_at: optionalTextSchema,
  completed_at: optionalTextSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: z.array(identifierSchema).optional().nullable(),
  service: serviceSchema.optional().nullable(),
  services: z.array(serviceSchema).optional().nullable(),
  barber: barberSchema.optional().nullable()
}).passthrough()

export const historyItemSchema = queueItemSchema.extend({
  user_name: optionalTextSchema,
  order_total: z.union([z.string(), z.number()]).optional().nullable()
}).passthrough()

export const statisticsSchema = z.record(z.string(), z.any())

export const promoCodeSchema = z.object({
  id: identifierSchema.optional(),
  code: z.string().catch(''),
  status: optionalTextSchema,
  used_count: z.number().optional().nullable(),
  usage_limit: z.union([z.number(), z.string()]).optional().nullable(),
  is_unlimited: z.boolean().optional().nullable(),
  created_at: optionalTextSchema,
  discount: optionalTextSchema,
  remaining: z.union([z.number(), z.string()]).optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  usage_count: z.number().optional().nullable(),
  expires_at: optionalTextSchema,
  discount_type: optionalTextSchema,
  discount_value: z.union([z.number(), z.string()]).optional().nullable()
}).passthrough()

export const bannerSchema = z.object({
  id: identifierSchema,
  title: optionalTextSchema,
  description: optionalTextSchema,
  image_url: optionalTextSchema,
  locale: optionalTextSchema,
  is_active: z.boolean().optional().nullable(),
  created_at: optionalTextSchema
}).passthrough()

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
  branch_id: z.union([z.string(), z.number()]).transform(value => String(value)).optional().nullable()
})

export const loginResponseSchema = z.object({
  authenticated: z.boolean(),
  user: barberUserSchema.nullable(),
  token: z.string().optional()
})

export const barberRegisterSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(6),
  name: z.string().trim().min(2),
  branch_id: identifierSchema,
  phone: optionalTextSchema,
  specialization: optionalTextSchema
})

export const queueUpdateSchema = z.object({
  status: optionalTextSchema,
  payment_method: optionalTextSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: z.array(identifierSchema).optional().nullable()
}).refine(
  value => Boolean(value.status || value.payment_method || value.service_id || value.service_ids?.length),
  { message: 'Укажите хотя бы одно поле для обновления очереди.' }
)

export const queueEditBeforeCompleteSchema = z.object({
  amount: numberLikeSchema,
  reason: z.string().trim().min(1, 'Укажите причину')
})

export const breakSchema = z.object({
  minutes: numberLikeSchema.refine(value => value > 0, 'Количество минут должно быть больше нуля')
})

export const kioskRegisterSchema = z.object({
  branch_id: identifierSchema,
  device_name: z.string().trim().min(1, 'Введите имя устройства')
})

export const kioskBookingSchema = z.object({
  branch_id: identifierSchema,
  barber_id: identifierSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: z.array(identifierSchema).optional().nullable(),
  customer_name: z.string().trim().min(1, 'Введите имя клиента'),
  phone_number: z.string().trim().min(1, 'Введите номер телефона'),
  source: optionalTextSchema,
  payment_method: optionalTextSchema,
  certificate_code: optionalTextSchema
}).refine(
  value => Boolean(value.service_id || value.service_ids?.length),
  { message: 'Выберите хотя бы одну услугу.' }
)

export const certificateCreateSchema = z.object({
  code: z.string().trim().min(1, 'Введите код'),
  service_ids: z.array(identifierSchema).min(1, 'Выберите хотя бы одну услугу'),
  expires_at: optionalTextSchema,
  metadata: z.record(z.string(), z.any()).optional().nullable()
})

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, 'Введите название услуги'),
  image: optionalTextSchema,
  price: z.union([z.string(), z.number()]).optional().nullable(),
  duration: z.union([z.string(), z.number()]).optional().nullable(),
  category_id: identifierSchema.optional().nullable(),
  category_name: optionalTextSchema,
  is_active: z.boolean().optional().nullable()
})

export const promoValidateSchema = z.object({
  code: z.string().trim().min(1),
  user_id: identifierSchema.optional().nullable(),
  order_total: z.union([z.string(), z.number()]).optional().nullable()
})

export const promoUseSchema = z.object({
  promo_code: z.string().trim().min(1),
  user_id: identifierSchema.optional().nullable(),
  user_name: optionalTextSchema,
  phone: optionalTextSchema,
  order_id: optionalTextSchema
})

export const promoCreateSchema = z.object({
  code: z.string().trim().min(1, 'Введите код'),
  discount_type: z.string().trim().min(1, 'Выберите тип скидки').transform((value) => {
    const normalized = value.toLowerCase()

    if (normalized === 'percent') {
      return 'percentage'
    }

    if (normalized === 'amount') {
      return 'fixed'
    }

    return normalized
  }).refine(value => ['percentage', 'fixed'].includes(value), 'Тип скидки должен быть percentage или fixed'),
  discount_value: z.union([z.string(), z.number()]).refine(
    value => Number(value) > 0,
    'Размер скидки должен быть больше нуля'
  ),
  usage_limit: z.union([z.string(), z.number()]).optional().nullable(),
  is_unlimited: z.boolean().optional().nullable(),
  status: z.string().trim().optional().nullable().transform(
    value => String(value || 'active').toLowerCase()
  ).refine(
    value => ['active', 'inactive'].includes(value),
    'Статус должен быть active или inactive'
  )
}).superRefine((value, ctx) => {
  if (value.is_unlimited) {
    return
  }

  if (!Number(value.usage_limit || 0) || Number(value.usage_limit) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Укажите лимит использований',
      path: ['usage_limit']
    })
  }
}).passthrough()

export const bannerFormSchema = z.object({
  title: optionalTextSchema,
  description: optionalTextSchema,
  locale: z.string().trim().min(1, 'Укажите локаль'),
  is_active: z.boolean().optional().nullable()
}).passthrough()

export type Branch = z.infer<typeof branchSchema>
export type BarberUser = z.infer<typeof barberUserSchema>
export type BarberProfile = z.infer<typeof barberSchema>
export type ServiceItem = z.infer<typeof serviceSchema>
export type ServiceCategory = z.infer<typeof serviceCategorySchema>
export type QueueItem = z.infer<typeof queueItemSchema>
export type HistoryItem = z.infer<typeof historyItemSchema>
export type PromoCode = z.infer<typeof promoCodeSchema>
export type BannerItem = z.infer<typeof bannerSchema>
export type LoginPayload = z.infer<typeof loginSchema>
export type BarberRegisterPayload = z.infer<typeof barberRegisterSchema>
export type QueueUpdatePayload = z.infer<typeof queueUpdateSchema>
export type QueueEditBeforeCompletePayload = z.infer<typeof queueEditBeforeCompleteSchema>
export type BreakPayload = z.infer<typeof breakSchema>
export type KioskRegisterPayload = z.infer<typeof kioskRegisterSchema>
export type KioskBookingPayload = z.infer<typeof kioskBookingSchema>
export type CertificateCreatePayload = z.infer<typeof certificateCreateSchema>
export type ServiceFormPayload = z.infer<typeof serviceFormSchema>
export type PromoValidatePayload = z.infer<typeof promoValidateSchema>
export type PromoUsePayload = z.infer<typeof promoUseSchema>
export type PromoCreatePayload = z.infer<typeof promoCreateSchema>
export type BannerFormPayload = z.infer<typeof bannerFormSchema>
