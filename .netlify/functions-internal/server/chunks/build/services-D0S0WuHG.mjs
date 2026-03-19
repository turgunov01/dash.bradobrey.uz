globalThis.__timing__.logStart('Load chunks/build/services-D0S0WuHG');function asCategoryName(value, fallback) {
  const normalized = String(value || "").trim();
  return normalized || fallback || null;
}
function normalizeService(service, fallbackCategory) {
  const category = asCategoryName(service?.category ?? service?.category_name, fallbackCategory);
  const price = service?.base_price ?? service?.price ?? 0;
  const duration = service?.duration_minutes ?? service?.duration ?? 0;
  return {
    ...service,
    base_price: price,
    category,
    category_name: category,
    duration,
    duration_minutes: duration,
    price
  };
}
function flattenCategoryList(categories) {
  return categories.flatMap((category, index) => {
    const categoryName = asCategoryName(category?.name ?? category?.title ?? category?.category, `Категория ${index + 1}`);
    const services = Array.isArray(category?.services) ? category.services : [];
    return services.map((service) => normalizeService(service, categoryName));
  });
}
function flattenServicesPayload(payload) {
  const normalizedPayload = payload;
  if (Array.isArray(normalizedPayload)) {
    const containsCategories = normalizedPayload.some((item) => Array.isArray(item?.services));
    return containsCategories ? flattenCategoryList(normalizedPayload) : normalizedPayload.map((service) => normalizeService(service));
  }
  if (Array.isArray(normalizedPayload?.services)) {
    return normalizedPayload.services.map((service) => normalizeService(service));
  }
  if (Array.isArray(normalizedPayload?.categories)) {
    return flattenCategoryList(normalizedPayload.categories);
  }
  if (Array.isArray(normalizedPayload?.data?.services)) {
    return normalizedPayload.data.services.map((service) => normalizeService(service));
  }
  if (Array.isArray(normalizedPayload?.data?.categories)) {
    return flattenCategoryList(normalizedPayload.data.categories);
  }
  if (Array.isArray(normalizedPayload?.data)) {
    return normalizedPayload.data.map((service) => normalizeService(service));
  }
  return [];
}

export { flattenServicesPayload as f };;globalThis.__timing__.logEnd('Load chunks/build/services-D0S0WuHG');
//# sourceMappingURL=services-D0S0WuHG.mjs.map
