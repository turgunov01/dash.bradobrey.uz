globalThis.__timing__.logStart('Load chunks/_/index');import { z } from 'file://D:/projects/bradobrey-dashboard/node_modules/zod/index.js';

const identifierSchema = z.union([z.string(), z.number()]).transform((value) => String(value));
const optionalTextSchema = z.string().trim().optional().nullable();
const numberLikeSchema = z.union([z.number(), z.string()]).transform((value) => Number(value || 0));
const branchSchema = z.object({
  id: identifierSchema,
  name: z.string().catch("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0444\u0438\u043B\u0438\u0430\u043B"),
  address: optionalTextSchema,
  is_active: z.boolean().optional().nullable()
}).passthrough();
const barberUserSchema = z.object({
  id: identifierSchema.optional(),
  login: optionalTextSchema,
  name: z.string().catch("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0431\u0430\u0440\u0431\u0435\u0440"),
  phone: optionalTextSchema,
  role: optionalTextSchema
}).passthrough();
const barberSchema = z.object({
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
}).passthrough();
const serviceSchema = z.object({
  id: identifierSchema,
  name: z.string().catch("\u0423\u0441\u043B\u0443\u0433\u0430 \u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F"),
  price: z.union([z.string(), z.number()]).optional().nullable(),
  base_price: z.union([z.string(), z.number()]).optional().nullable(),
  duration: z.union([z.string(), z.number()]).optional().nullable(),
  duration_minutes: z.union([z.string(), z.number()]).optional().nullable(),
  category_id: identifierSchema.optional().nullable(),
  category: optionalTextSchema,
  category_name: optionalTextSchema,
  image: optionalTextSchema,
  is_active: z.boolean().optional().nullable()
}).passthrough();
z.object({
  id: identifierSchema.optional().nullable(),
  name: optionalTextSchema,
  title: optionalTextSchema,
  services: z.array(serviceSchema).default([])
}).passthrough();
const queueItemSchema = z.object({
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
}).passthrough();
queueItemSchema.extend({
  user_name: optionalTextSchema,
  order_total: z.union([z.string(), z.number()]).optional().nullable()
}).passthrough();
z.record(z.string(), z.any());
const promoCodeSchema = z.object({
  id: identifierSchema.optional(),
  code: z.string().catch(""),
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
}).passthrough();
z.object({
  id: identifierSchema,
  title: optionalTextSchema,
  description: optionalTextSchema,
  image_url: optionalTextSchema,
  locale: optionalTextSchema,
  is_active: z.boolean().optional().nullable(),
  created_at: optionalTextSchema
}).passthrough();
const loginSchema = z.object({
  login: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043B\u043E\u0433\u0438\u043D"),
  password: z.string().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C"),
  branch_id: z.union([z.string(), z.number()]).transform((value) => String(value)).optional().nullable()
});
z.object({
  authenticated: z.boolean(),
  user: barberUserSchema.nullable(),
  token: z.string().optional()
});
z.object({
  login: z.string().trim().min(1),
  password: z.string().min(6),
  name: z.string().trim().min(2),
  branch_id: identifierSchema,
  phone: optionalTextSchema,
  specialization: optionalTextSchema
});
const queueUpdateSchema = z.object({
  status: optionalTextSchema,
  payment_method: optionalTextSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: z.array(identifierSchema).optional().nullable()
}).refine(
  (value) => {
    var _a;
    return Boolean(value.status || value.payment_method || value.service_id || ((_a = value.service_ids) == null ? void 0 : _a.length));
  },
  { message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u043F\u043E\u043B\u0435 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u0438." }
);
const queueEditBeforeCompleteSchema = z.object({
  amount: numberLikeSchema,
  reason: z.string().trim().min(1, "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0443")
});
z.object({
  minutes: numberLikeSchema.refine((value) => value > 0, "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043C\u0438\u043D\u0443\u0442 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F")
});
const kioskRegisterSchema = z.object({
  branch_id: identifierSchema,
  device_name: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430")
});
const kioskBookingSchema = z.object({
  branch_id: identifierSchema,
  barber_id: identifierSchema,
  service_id: identifierSchema.optional().nullable(),
  service_ids: z.array(identifierSchema).optional().nullable(),
  customer_name: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u0430"),
  phone_number: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430"),
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
const certificateCreateSchema = z.object({
  code: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434"),
  service_ids: z.array(identifierSchema).min(1, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u0443 \u0443\u0441\u043B\u0443\u0433\u0443"),
  expires_at: optionalTextSchema,
  metadata: z.record(z.string(), z.any()).optional().nullable()
});
const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438"),
  price: z.union([z.string(), z.number()]).optional().nullable(),
  duration: z.union([z.string(), z.number()]).optional().nullable(),
  category_id: identifierSchema.optional().nullable(),
  category_name: optionalTextSchema,
  is_active: z.boolean().optional().nullable()
});
z.object({
  code: z.string().trim().min(1),
  user_id: identifierSchema.optional().nullable(),
  order_total: z.union([z.string(), z.number()]).optional().nullable()
});
z.object({
  promo_code: z.string().trim().min(1),
  user_id: identifierSchema.optional().nullable(),
  user_name: optionalTextSchema,
  phone: optionalTextSchema,
  order_id: optionalTextSchema
});
const promoCreateSchema = z.object({
  code: z.string().trim().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434"),
  discount_type: z.string().trim().min(1, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043F \u0441\u043A\u0438\u0434\u043A\u0438").transform((value) => {
    const normalized = value.toLowerCase();
    if (normalized === "percent") {
      return "percentage";
    }
    if (normalized === "amount") {
      return "fixed";
    }
    return normalized;
  }).refine((value) => ["percentage", "fixed"].includes(value), "\u0422\u0438\u043F \u0441\u043A\u0438\u0434\u043A\u0438 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C percentage \u0438\u043B\u0438 fixed"),
  discount_value: z.union([z.string(), z.number()]).refine(
    (value) => Number(value) > 0,
    "\u0420\u0430\u0437\u043C\u0435\u0440 \u0441\u043A\u0438\u0434\u043A\u0438 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F"
  ),
  usage_limit: z.union([z.string(), z.number()]).optional().nullable(),
  is_unlimited: z.boolean().optional().nullable(),
  status: z.string().trim().optional().nullable().transform(
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
      code: z.ZodIssueCode.custom,
      message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043B\u0438\u043C\u0438\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0439",
      path: ["usage_limit"]
    });
  }
}).passthrough();
z.object({
  title: optionalTextSchema,
  description: optionalTextSchema,
  locale: z.string().trim().min(1, "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043B\u043E\u043A\u0430\u043B\u044C"),
  is_active: z.boolean().optional().nullable()
}).passthrough();

export { queueEditBeforeCompleteSchema as a, barberSchema as b, branchSchema as c, certificateCreateSchema as d, kioskRegisterSchema as e, promoCreateSchema as f, kioskBookingSchema as k, loginSchema as l, promoCodeSchema as p, queueUpdateSchema as q, serviceFormSchema as s };;globalThis.__timing__.logEnd('Load chunks/_/index');
//# sourceMappingURL=index.mjs.map
