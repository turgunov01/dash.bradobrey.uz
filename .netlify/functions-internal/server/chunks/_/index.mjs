globalThis.__timing__.logStart('Load chunks/_/index');import { N as object, O as union, P as string, Q as number, R as boolean, S as array, T as record, Z as ZodIssueCode, U as any } from './nitro.mjs';

const identifierSchema = union([string(), number()]).transform((value) => String(value));
const optionalTextSchema = string().trim().optional().nullable();
const numberLikeSchema = union([number(), string()]).transform((value) => Number(value || 0));
const branchSchema = object({
  id: identifierSchema,
  name: string().catch("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0444\u0438\u043B\u0438\u0430\u043B"),
  address: optionalTextSchema,
  is_active: boolean().optional().nullable()
}).passthrough();
const barberUserSchema = object({
  id: identifierSchema.optional(),
  login: optionalTextSchema,
  name: string().catch("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0431\u0430\u0440\u0431\u0435\u0440"),
  phone: optionalTextSchema,
  role: optionalTextSchema
}).passthrough();
const barberSchema = object({
  id: identifierSchema,
  user_id: identifierSchema.optional(),
  branch_id: identifierSchema.optional(),
  name: optionalTextSchema,
  phone: optionalTextSchema,
  specialization: optionalTextSchema,
  photo_url: optionalTextSchema,
  avatar_url: optionalTextSchema,
  is_on_break: boolean().optional().nullable(),
  is_on_shift: boolean().optional().nullable(),
  is_active: boolean().optional().nullable(),
  current_clients: number().optional().nullable(),
  estimated_waiting_time: number().optional().nullable(),
  user: barberUserSchema.optional().nullable()
}).passthrough();
const serviceSchema = object({
  id: identifierSchema,
  name: string().catch("\u0423\u0441\u043B\u0443\u0433\u0430 \u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F"),
  price: union([string(), number()]).optional().nullable(),
  base_price: union([string(), number()]).optional().nullable(),
  duration: union([string(), number()]).optional().nullable(),
  duration_minutes: union([string(), number()]).optional().nullable(),
  category_id: identifierSchema.optional().nullable(),
  category: optionalTextSchema,
  category_name: optionalTextSchema,
  image: optionalTextSchema,
  is_active: boolean().optional().nullable()
}).passthrough();
object({
  id: identifierSchema.optional().nullable(),
  name: optionalTextSchema,
  title: optionalTextSchema,
  services: array(serviceSchema).default([])
}).passthrough();
const queueItemSchema = object({
  id: identifierSchema,
  branch_id: identifierSchema.optional().nullable(),
  barber_id: identifierSchema.optional().nullable(),
  customer_name: optionalTextSchema,
  phone_number: optionalTextSchema,
  status: optionalTextSchema,
  payment_method: optionalTextSchema,
  amount: union([number(), string()]).optional().nullable(),
  price_override: union([number(), string()]).optional().nullable(),
  price_override_reason: optionalTextSchema,
  no_show: boolean().optional().nullable(),
  swapped_flag: boolean().optional().nullable(),
  certificate_code: optionalTextSchema,
  created_at: optionalTextSchema,
  updated_at: optionalTextSchema,
  called_at: optionalTextSchema,
  completed_at: optionalTextSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: array(identifierSchema).optional().nullable(),
  service: serviceSchema.optional().nullable(),
  services: array(serviceSchema).optional().nullable(),
  barber: barberSchema.optional().nullable()
}).passthrough();
queueItemSchema.extend({
  user_name: optionalTextSchema,
  order_total: union([string(), number()]).optional().nullable()
}).passthrough();
record(string(), any());
const promoCodeSchema = object({
  id: identifierSchema.optional(),
  code: string().catch(""),
  status: optionalTextSchema,
  used_count: number().optional().nullable(),
  usage_limit: union([number(), string()]).optional().nullable(),
  is_unlimited: boolean().optional().nullable(),
  created_at: optionalTextSchema,
  discount: optionalTextSchema,
  remaining: union([number(), string()]).optional().nullable(),
  is_active: boolean().optional().nullable(),
  usage_count: number().optional().nullable(),
  expires_at: optionalTextSchema,
  discount_type: optionalTextSchema,
  discount_value: union([number(), string()]).optional().nullable()
}).passthrough();
object({
  id: identifierSchema,
  title: optionalTextSchema,
  description: optionalTextSchema,
  image_url: optionalTextSchema,
  locale: optionalTextSchema,
  is_active: boolean().optional().nullable(),
  created_at: optionalTextSchema
}).passthrough();
const loginSchema = object({
  login: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043B\u043E\u0433\u0438\u043D"),
  password: string().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C"),
  branch_id: union([string(), number()]).transform((value) => String(value)).optional().nullable()
});
object({
  authenticated: boolean(),
  user: barberUserSchema.nullable(),
  token: string().optional()
});
object({
  login: string().trim().min(1),
  password: string().min(6),
  name: string().trim().min(2),
  branch_id: identifierSchema,
  phone: optionalTextSchema,
  specialization: optionalTextSchema
});
const queueUpdateSchema = object({
  status: optionalTextSchema,
  payment_method: optionalTextSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: array(identifierSchema).optional().nullable()
}).refine(
  (value) => {
    var _a;
    return Boolean(value.status || value.payment_method || value.service_id || ((_a = value.service_ids) == null ? void 0 : _a.length));
  },
  { message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u043F\u043E\u043B\u0435 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u0438." }
);
const queueEditBeforeCompleteSchema = object({
  amount: numberLikeSchema,
  reason: string().trim().min(1, "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0443")
});
object({
  minutes: numberLikeSchema.refine((value) => value > 0, "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043C\u0438\u043D\u0443\u0442 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F")
});
const kioskRegisterSchema = object({
  branch_id: identifierSchema,
  device_name: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430")
});
const kioskBookingSchema = object({
  branch_id: identifierSchema,
  barber_id: identifierSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: array(identifierSchema).optional().nullable(),
  customer_name: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u0430"),
  phone_number: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430"),
  source: optionalTextSchema,
  payment_method: optionalTextSchema,
  certificate_code: optionalTextSchema
}).refine(
  (value) => {
    var _a;
    return Boolean(value.service_id || ((_a = value.service_ids) == null ? void 0 : _a.length));
  },
  { message: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u0443 \u0443\u0441\u043B\u0443\u0433\u0443." }
);
const certificateCreateSchema = object({
  code: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434"),
  service_ids: array(identifierSchema).min(1, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u0443 \u0443\u0441\u043B\u0443\u0433\u0443"),
  expires_at: optionalTextSchema,
  metadata: record(string(), any()).optional().nullable()
});
const serviceFormSchema = object({
  name: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438"),
  price: union([string(), number()]).optional().nullable(),
  duration: union([string(), number()]).optional().nullable(),
  category_id: identifierSchema.optional().nullable(),
  category_name: optionalTextSchema,
  is_active: boolean().optional().nullable()
});
object({
  code: string().trim().min(1),
  user_id: identifierSchema.optional().nullable(),
  order_total: union([string(), number()]).optional().nullable()
});
object({
  promo_code: string().trim().min(1),
  user_id: identifierSchema.optional().nullable(),
  user_name: optionalTextSchema,
  phone: optionalTextSchema,
  order_id: optionalTextSchema
});
const promoCreateSchema = object({
  code: string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434"),
  discount_type: string().trim().min(1, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043F \u0441\u043A\u0438\u0434\u043A\u0438").transform((value) => {
    const normalized = value.toLowerCase();
    if (normalized === "percent") {
      return "percentage";
    }
    if (normalized === "amount") {
      return "fixed";
    }
    return normalized;
  }).refine((value) => ["percentage", "fixed"].includes(value), "\u0422\u0438\u043F \u0441\u043A\u0438\u0434\u043A\u0438 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C percentage \u0438\u043B\u0438 fixed"),
  discount_value: union([string(), number()]).refine(
    (value) => Number(value) > 0,
    "\u0420\u0430\u0437\u043C\u0435\u0440 \u0441\u043A\u0438\u0434\u043A\u0438 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F"
  ),
  usage_limit: union([string(), number()]).optional().nullable(),
  is_unlimited: boolean().optional().nullable(),
  status: string().trim().optional().nullable().transform(
    (value) => String(value || "active").toLowerCase()
  ).refine(
    (value) => ["active", "inactive"].includes(value),
    "\u0421\u0442\u0430\u0442\u0443\u0441 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C active \u0438\u043B\u0438 inactive"
  )
}).superRefine((value, ctx) => {
  if (value.is_unlimited) {
    return;
  }
  if (!Number(value.usage_limit || 0) || Number(value.usage_limit) <= 0) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043B\u0438\u043C\u0438\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0439",
      path: ["usage_limit"]
    });
  }
}).passthrough();
object({
  title: optionalTextSchema,
  description: optionalTextSchema,
  locale: string().trim().min(1, "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043B\u043E\u043A\u0430\u043B\u044C"),
  is_active: boolean().optional().nullable()
}).passthrough();

export { queueEditBeforeCompleteSchema as a, barberSchema as b, branchSchema as c, certificateCreateSchema as d, kioskRegisterSchema as e, promoCreateSchema as f, kioskBookingSchema as k, loginSchema as l, promoCodeSchema as p, queueUpdateSchema as q, serviceFormSchema as s };;globalThis.__timing__.logEnd('Load chunks/_/index');
//# sourceMappingURL=index.mjs.map
