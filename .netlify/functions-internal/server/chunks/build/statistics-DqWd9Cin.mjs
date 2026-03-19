globalThis.__timing__.logStart('Load chunks/build/statistics-DqWd9Cin');import { _ as _sfc_main$2, a as _sfc_main$1$1, b as _sfc_main$7 } from './DashboardSidebarCollapse-eLpXibXg.mjs';
import { a as useBarbersApi, g as useUiStore, b as useAsyncData, c as _sfc_main$3, d as _sfc_main$a } from './server.mjs';
import { _ as _sfc_main$6 } from './Badge-CKFwwagy.mjs';
import { _ as _sfc_main$1 } from './FormField-BmHALMzS.mjs';
import { _ as _sfc_main$4 } from './Input-BrToCniw.mjs';
import { _ as _sfc_main$5 } from './SelectMenu-BfkNXmwg.mjs';
import { _ as __nuxt_component_9 } from './EmptyState-Db7zOMDl.mjs';
import { _ as __nuxt_component_5 } from './MetricCard-CDSLylAv.mjs';
import { defineComponent, ref, withAsyncContext, computed, watch, mergeProps, withCtx, unref, createVNode, isRef, openBlock, createBlock, createCommentVNode, createTextVNode, toDisplayString, Fragment, renderList, useSSRContext } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderStyle } from 'file://D:/projects/bradobrey-dashboard/node_modules/vue/server-renderer/index.mjs';
import { b as formatCount, a as formatMoney, c as formatPercent } from './format-DDcTL-sj.mjs';
import { f as formatPaymentMethod, b as formatScopeLabel } from './display-CyQec-Wd.mjs';
import { f as flattenServicesPayload } from './services-D0S0WuHG.mjs';
import { u as useBranchStore } from './branch-nC1tN9Zp.mjs';
import { u as useHistoryApi } from './useHistoryApi-XZUYGosn.mjs';
import { u as useKioskApi } from './useKioskApi-l3XfHmhL.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/reka-ui/dist/index.js';
import './index-qsfWWCYt.mjs';
import '../_/nitro.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/zod/index.js';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/utils/lib/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/consola/dist/index.mjs';
import 'node:fs';
import 'node:path';
import 'file://D:/projects/bradobrey-dashboard/node_modules/pinia/dist/pinia.prod.cjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-router/vue-router.node.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/perfect-debounce/dist/index.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@vue/shared/dist/shared.cjs.prod.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwindcss/dist/colors.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/vue/dist/iconify.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/tailwind-variants/dist/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/@iconify/utils/lib/css/icon.js';
import '../routes/renderer.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/server.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/devalue/index.js';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/plugins.mjs';
import 'file://D:/projects/bradobrey-dashboard/node_modules/unhead/dist/utils.mjs';
import '../_/index.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "statistics",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    function extractHistoryItems(response) {
      if (Array.isArray(response)) {
        return response;
      }
      if (!response || typeof response !== "object") {
        return [];
      }
      const payload = response;
      if (Array.isArray(payload.items)) {
        return payload.items;
      }
      if (Array.isArray(payload.data)) {
        return payload.data;
      }
      if (Array.isArray(payload.data?.items)) {
        return payload.data.items;
      }
      return [];
    }
    function extractBarberAccounts(response) {
      if (!response || typeof response !== "object") {
        return [];
      }
      const items = Array.isArray(response.items) ? response.items : [];
      return items.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return [];
        }
        const payload = item;
        return [{
          branch_id: payload.branch_id == null ? null : String(payload.branch_id),
          id: String(payload.id || ""),
          login: normalizeText(payload.login),
          role: normalizeText(payload.role)
        }];
      }).filter((item) => Boolean(item.id));
    }
    function normalizeText(value) {
      if (value === void 0 || value === null) {
        return null;
      }
      const text = String(value).trim();
      return text || null;
    }
    function normalizeTimestamp(value) {
      const normalizedValue = normalizeText(value);
      if (!normalizedValue) {
        return null;
      }
      const trimmedFraction = normalizedValue.replace(/(\.\d{3})\d+/, "$1");
      const date = new Date(trimmedFraction);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    function parseRangeDate(value) {
      const normalizedValue = normalizeText(value);
      if (!normalizedValue) {
        return null;
      }
      const date = /* @__PURE__ */ new Date(`${normalizedValue}T00:00:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    function toDateKey(timestamp) {
      return new Date(timestamp).toISOString().slice(0, 10);
    }
    function shortId(value) {
      const normalizedValue = normalizeText(value);
      if (!normalizedValue) {
        return "неизвестно";
      }
      return normalizedValue.slice(0, 8);
    }
    function normalizeStatus(value) {
      return String(value || "unknown").trim().toLowerCase();
    }
    function isCompletedStatus(status) {
      return ["completed", "done", "paid"].includes(status);
    }
    function isCancelledStatus(status) {
      return ["cancelled", "no_show", "not_in_time"].includes(status);
    }
    function getBranchId(item) {
      return normalizeText(item.branch_id || item.branch?.id);
    }
    function getBarberId(item) {
      return normalizeText(item.barber_id || item.barber?.id);
    }
    function getBarberName(item) {
      return normalizeText(item.barber?.name || item.barber_name || item.barber?.user?.name);
    }
    function getClientPhone(item) {
      return normalizeText(
        item.phone_number || item.phone || item.client?.phone || item.client?.phone_number || item.customer?.phone
      );
    }
    function getServiceIds(item) {
      const values = Array.isArray(item.service_ids) ? item.service_ids : item.service_id ? [item.service_id] : [];
      return values.map((value) => normalizeText(value)).filter((value) => Boolean(value));
    }
    function getServicePrice(service) {
      const amount = Number(service?.base_price ?? service?.price ?? 0);
      return Number.isFinite(amount) ? amount : 0;
    }
    function getServiceDuration(service) {
      const amount = Number(service?.duration_minutes ?? service?.duration ?? 0);
      return Number.isFinite(amount) ? amount : 0;
    }
    function average(values) {
      if (!values.length) {
        return 0;
      }
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    function toBarHeight(value, max) {
      if (!value || !max) {
        return 0;
      }
      return Math.max(value / max * 100, 8);
    }
    function formatMinutes(value) {
      const amount = Math.max(0, Math.round(value));
      return `${formatCount(amount)} мин`;
    }
    const shortDayFormatter = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short"
    });
    const branchStore = useBranchStore();
    const barbersApi = useBarbersApi();
    const historyApi = useHistoryApi();
    const kioskApi = useKioskApi();
    const uiStore = useUiStore();
    const scope = ref("global");
    const selectedBarberId = ref("");
    [__temp, __restore] = withAsyncContext(() => branchStore.ensureLoaded()), await __temp, __restore();
    const { data, pending, refresh } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData("statistics-dashboard-rich", async () => {
      const [historyResult, servicesResult, barbersResult] = await Promise.allSettled([
        historyApi.list(),
        kioskApi.services({ active: true, grouped: true }),
        barbersApi.list()
      ]);
      return {
        barberAccounts: barbersResult.status === "fulfilled" ? extractBarberAccounts(barbersResult.value) : [],
        historyItems: historyResult.status === "fulfilled" ? extractHistoryItems(historyResult.value) : [],
        services: servicesResult.status === "fulfilled" ? flattenServicesPayload(servicesResult.value) : []
      };
    })), __temp = await __temp, __restore(), __temp);
    const serviceMap = computed(
      () => new Map(
        (data.value?.services || []).map((service) => [String(service.id), service])
      )
    );
    const branchMap = computed(
      () => new Map(
        branchStore.branches.map((branch) => [branch.id, branch])
      )
    );
    const normalizedHistory = computed(
      () => (data.value?.historyItems || []).map((item, index) => {
        const createdAt = normalizeText(item.created_at || item.createdAt);
        const finishedAt = normalizeText(item.finished_at || item.completed_at || item.finishedAt || item.completedAt);
        const createdTimestamp = normalizeTimestamp(createdAt);
        const finishedTimestamp = normalizeTimestamp(finishedAt);
        const branchId = getBranchId(item);
        const barberId = getBarberId(item);
        const barberName = getBarberName(item);
        const clientPhone = getClientPhone(item);
        const serviceIds = getServiceIds(item);
        const status = normalizeStatus(item.status);
        const estimatedRevenue = serviceIds.reduce((sum, serviceId) => {
          return sum + getServicePrice(serviceMap.value.get(serviceId));
        }, 0);
        const estimatedServiceMinutes = serviceIds.reduce((sum, serviceId) => {
          return sum + getServiceDuration(serviceMap.value.get(serviceId));
        }, 0);
        let actualServiceMinutes = null;
        if (createdTimestamp !== null && finishedTimestamp !== null && finishedTimestamp >= createdTimestamp) {
          const diffMinutes = (finishedTimestamp - createdTimestamp) / 6e4;
          if (diffMinutes > 0 && diffMinutes <= 360) {
            actualServiceMinutes = diffMinutes;
          }
        }
        const fallbackId = [
          createdAt || finishedAt || "history",
          branchId || "branch",
          barberId || "barber",
          clientPhone || "client",
          serviceIds.join(",") || `item-${index + 1}`
        ].join(":");
        return {
          actualServiceMinutes,
          barberId,
          barberName,
          branchId,
          branchName: branchId ? branchMap.value.get(branchId)?.name || `Филиал ${shortId(branchId)}` : "Филиал не указан",
          clientPhone,
          createdAt,
          createdTimestamp,
          estimatedRevenue,
          estimatedServiceMinutes,
          finishedAt,
          finishedTimestamp,
          id: String(item.id || fallbackId),
          isCancelled: isCancelledStatus(status),
          isCompleted: isCompletedStatus(status),
          paymentMethod: normalizeText(item.payment_method),
          primaryTimestamp: createdTimestamp ?? finishedTimestamp,
          serviceIds,
          status
        };
      }).filter((item) => Boolean(item.id))
    );
    const barberOptions = computed(() => {
      const options = /* @__PURE__ */ new Map();
      for (const account of data.value?.barberAccounts || []) {
        const branchId = normalizeText(account.branch_id);
        const branchName = branchId ? branchMap.value.get(branchId)?.name || null : null;
        options.set(account.id, {
          branchId,
          branchName,
          label: account.login || `Барбер ${shortId(account.id)}`,
          login: account.login,
          value: account.id
        });
      }
      for (const item of normalizedHistory.value) {
        if (!item.barberId) {
          continue;
        }
        const existing = options.get(item.barberId);
        const branchId = existing?.branchId || item.branchId || null;
        const branchName = existing?.branchName || item.branchName || null;
        const label = item.barberName || existing?.label || `Барбер ${shortId(item.barberId)}`;
        options.set(item.barberId, {
          branchId,
          branchName,
          label,
          login: existing?.login || null,
          value: item.barberId
        });
      }
      return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "ru"));
    });
    watch(
      () => barberOptions.value.map((option) => option.value),
      (ids) => {
        if (!ids.length) {
          selectedBarberId.value = "";
          return;
        }
        if (!ids.includes(selectedBarberId.value)) {
          selectedBarberId.value = ids[0] || "";
        }
      },
      { immediate: true }
    );
    const selectedBarber = computed(
      () => barberOptions.value.find((option) => option.value === selectedBarberId.value) || null
    );
    const selectedRange = computed(() => {
      const start = parseRangeDate(uiStore.statisticsRange.start);
      const end = parseRangeDate(uiStore.statisticsRange.end);
      if (!start || !end) {
        return null;
      }
      if (start.getTime() <= end.getTime()) {
        return {
          end: end.getTime() + 86399999,
          start: start.getTime()
        };
      }
      return {
        end: start.getTime() + 86399999,
        start: end.getTime()
      };
    });
    const selectedPeriodDays = computed(() => {
      if (!selectedRange.value) {
        return 0;
      }
      return Math.max(1, Math.round((selectedRange.value.end - selectedRange.value.start) / 864e5));
    });
    const needsBranchSelection = computed(
      () => scope.value === "branch" && !branchStore.activeBranchId
    );
    const needsBarberSelection = computed(
      () => scope.value === "barber" && !selectedBarberId.value
    );
    const scopeHistory = computed(() => {
      return normalizedHistory.value.filter((item) => {
        if (scope.value === "branch") {
          return Boolean(branchStore.activeBranchId) && item.branchId === branchStore.activeBranchId;
        }
        if (scope.value === "barber") {
          return Boolean(selectedBarberId.value) && item.barberId === selectedBarberId.value;
        }
        return true;
      });
    });
    const filteredHistory = computed(() => {
      if (!selectedRange.value) {
        return [];
      }
      return scopeHistory.value.filter((item) => {
        if (item.primaryTimestamp === null) {
          return false;
        }
        return item.primaryTimestamp >= selectedRange.value.start && item.primaryTimestamp <= selectedRange.value.end;
      }).sort((left, right) => (left.primaryTimestamp || 0) - (right.primaryTimestamp || 0));
    });
    const completedHistory = computed(
      () => filteredHistory.value.filter((item) => item.isCompleted)
    );
    const mainMetrics = computed(() => {
      const revenue = completedHistory.value.reduce((sum, item) => sum + item.estimatedRevenue, 0);
      const orders = filteredHistory.value.length;
      const completed = completedHistory.value.length;
      const averageCheck = completed ? revenue / completed : 0;
      return {
        averageCheck,
        completed,
        orders,
        revenue
      };
    });
    const clientMetrics = computed(() => {
      const firstSeenByPhone = /* @__PURE__ */ new Map();
      for (const item of scopeHistory.value) {
        if (!item.clientPhone || item.primaryTimestamp === null) {
          continue;
        }
        const currentFirstSeen = firstSeenByPhone.get(item.clientPhone);
        if (currentFirstSeen === void 0 || item.primaryTimestamp < currentFirstSeen) {
          firstSeenByPhone.set(item.clientPhone, item.primaryTimestamp);
        }
      }
      const uniqueClientsInPeriod = /* @__PURE__ */ new Map();
      for (const item of filteredHistory.value) {
        if (!item.clientPhone || item.primaryTimestamp === null) {
          continue;
        }
        const currentFirstSeen = uniqueClientsInPeriod.get(item.clientPhone);
        if (currentFirstSeen === void 0 || item.primaryTimestamp < currentFirstSeen) {
          uniqueClientsInPeriod.set(item.clientPhone, item.primaryTimestamp);
        }
      }
      let newClients = 0;
      let repeatClients = 0;
      for (const [phone, firstInPeriod] of uniqueClientsInPeriod.entries()) {
        const firstOverall = firstSeenByPhone.get(phone);
        if (firstOverall !== void 0 && firstOverall < firstInPeriod) {
          repeatClients += 1;
        } else {
          newClients += 1;
        }
      }
      const uniqueClients = uniqueClientsInPeriod.size;
      const completionRate = mainMetrics.value.orders ? mainMetrics.value.completed / mainMetrics.value.orders * 100 : 0;
      return {
        completionRate,
        newClients,
        repeatClients,
        uniqueClients
      };
    });
    const operationsMetrics = computed(() => {
      const cancelled = filteredHistory.value.filter((item) => item.isCancelled).length;
      const noShow = filteredHistory.value.filter((item) => item.status === "no_show").length;
      const serviceMinutes = completedHistory.value.map((item) => {
        if (item.actualServiceMinutes !== null) {
          return item.actualServiceMinutes;
        }
        return item.estimatedServiceMinutes > 0 ? item.estimatedServiceMinutes : null;
      }).filter((value) => value !== null && value > 0);
      const waitMinutes = completedHistory.value.map((item) => {
        if (item.actualServiceMinutes === null || item.estimatedServiceMinutes <= 0) {
          return null;
        }
        return Math.max(item.actualServiceMinutes - item.estimatedServiceMinutes, 0);
      }).filter((value) => value !== null);
      return {
        averageServiceMinutes: average(serviceMinutes),
        averageWaitMinutes: average(waitMinutes),
        cancelled,
        noShow
      };
    });
    const timelineRows = computed(() => {
      if (!selectedRange.value) {
        return [];
      }
      const points = /* @__PURE__ */ new Map();
      for (let timestamp = selectedRange.value.start; timestamp <= selectedRange.value.end; timestamp += 864e5) {
        const dateKey = toDateKey(timestamp);
        points.set(dateKey, {
          cancelled: 0,
          completed: 0
        });
      }
      for (const item of filteredHistory.value) {
        if (item.primaryTimestamp === null) {
          continue;
        }
        const dateKey = toDateKey(item.primaryTimestamp);
        const current = points.get(dateKey);
        if (!current) {
          continue;
        }
        if (item.isCompleted) {
          current.completed += 1;
        }
        if (item.isCancelled) {
          current.cancelled += 1;
        }
      }
      const maxCompleted = Math.max(...[...points.values()].map((point) => point.completed), 0);
      const maxCancelled = Math.max(...[...points.values()].map((point) => point.cancelled), 0);
      const maxValue = Math.max(maxCompleted, maxCancelled, 4);
      return [...points.entries()].map(([dateKey, point]) => ({
        cancelled: point.cancelled,
        cancelledHeight: toBarHeight(point.cancelled, maxValue),
        completed: point.completed,
        completedHeight: toBarHeight(point.completed, maxValue),
        dateKey,
        label: shortDayFormatter.format(/* @__PURE__ */ new Date(`${dateKey}T00:00:00`))
      }));
    });
    const timelineScaleMax = computed(
      () => Math.max(
        ...timelineRows.value.flatMap((point) => [point.completed, point.cancelled]),
        4
      )
    );
    const timelineAxisTicks = computed(() => {
      const steps = 4;
      return Array.from({ length: steps + 1 }, (_, index) => {
        const ratio = (steps - index) / steps;
        const value = Math.round(timelineScaleMax.value * ratio);
        return {
          label: formatCount(value),
          value
        };
      });
    });
    const branchBreakdown = computed(() => {
      const rows = /* @__PURE__ */ new Map();
      for (const item of filteredHistory.value) {
        const id = item.branchId || "unknown";
        const current = rows.get(id) || {
          cancelled: 0,
          completed: 0,
          completionRate: 0,
          count: 0,
          id,
          label: item.branchName || "Филиал не указан",
          phones: /* @__PURE__ */ new Set(),
          revenue: 0,
          uniqueClients: 0
        };
        current.count += 1;
        if (item.clientPhone) {
          current.phones.add(item.clientPhone);
        }
        if (item.isCompleted) {
          current.completed += 1;
          current.revenue += item.estimatedRevenue;
        }
        if (item.isCancelled) {
          current.cancelled += 1;
        }
        rows.set(id, current);
      }
      return [...rows.values()].map((row) => ({
        cancelled: row.cancelled,
        completionRate: row.count ? row.completed / row.count * 100 : 0,
        count: row.count,
        id: row.id,
        label: row.label,
        revenue: row.revenue,
        uniqueClients: row.phones.size
      })).sort((left, right) => right.revenue - left.revenue || right.count - left.count);
    });
    const barberBreakdown = computed(() => {
      const rows = /* @__PURE__ */ new Map();
      for (const item of filteredHistory.value) {
        const id = item.barberId || "unknown";
        const current = rows.get(id) || {
          cancelled: 0,
          completed: 0,
          completionRate: 0,
          count: 0,
          id,
          label: item.barberName || `Барбер ${shortId(item.barberId)}`,
          phones: /* @__PURE__ */ new Set(),
          revenue: 0,
          uniqueClients: 0
        };
        current.count += 1;
        if (item.clientPhone) {
          current.phones.add(item.clientPhone);
        }
        if (item.isCompleted) {
          current.completed += 1;
          current.revenue += item.estimatedRevenue;
        }
        if (item.isCancelled) {
          current.cancelled += 1;
        }
        rows.set(id, current);
      }
      return [...rows.values()].map((row) => ({
        cancelled: row.cancelled,
        completionRate: row.count ? row.completed / row.count * 100 : 0,
        count: row.count,
        id: row.id,
        label: row.label,
        revenue: row.revenue,
        uniqueClients: row.phones.size
      })).sort((left, right) => right.revenue - left.revenue || right.count - left.count);
    });
    const serviceBreakdown = computed(() => {
      const rows = /* @__PURE__ */ new Map();
      for (const item of filteredHistory.value) {
        for (const serviceId of item.serviceIds) {
          const service = serviceMap.value.get(serviceId);
          const current = rows.get(serviceId) || {
            avgPrice: 0,
            category: normalizeText(service?.category_name || service?.category) || "Без категории",
            completed: 0,
            count: 0,
            id: serviceId,
            label: normalizeText(service?.name) || `Услуга ${shortId(serviceId)}`,
            revenue: 0
          };
          current.count += 1;
          if (item.isCompleted) {
            current.completed += 1;
            current.revenue += getServicePrice(service);
          }
          rows.set(serviceId, current);
        }
      }
      return [...rows.values()].map((row) => ({
        ...row,
        avgPrice: row.completed ? row.revenue / row.completed : row.revenue / Math.max(row.count, 1)
      })).sort((left, right) => right.count - left.count || right.revenue - left.revenue);
    });
    const paymentBreakdown = computed(() => {
      const rows = /* @__PURE__ */ new Map();
      for (const item of filteredHistory.value) {
        const key = normalizeText(item.paymentMethod) || "pending";
        const current = rows.get(key) || {
          count: 0,
          key,
          label: formatPaymentMethod(key),
          percent: 0,
          revenue: 0
        };
        current.count += 1;
        if (item.isCompleted) {
          current.revenue += item.estimatedRevenue;
        }
        rows.set(key, current);
      }
      return [...rows.values()].map((row) => ({
        ...row,
        percent: filteredHistory.value.length ? row.count / filteredHistory.value.length * 100 : 0
      })).sort((left, right) => right.count - left.count || right.revenue - left.revenue);
    });
    const topBranches = computed(() => branchBreakdown.value.slice(0, 3));
    const topBarbers = computed(() => barberBreakdown.value.slice(0, 3));
    const topServices = computed(() => serviceBreakdown.value.slice(0, 3));
    const primaryKpiCards = computed(() => [
      {
        description: "Оценка по стоимости услуг в завершённых записях.",
        icon: "i-lucide-wallet",
        label: "Выручка",
        value: formatMoney(mainMetrics.value.revenue)
      },
      {
        description: "Все записи за выбранный период и область.",
        icon: "i-lucide-ticket",
        label: "Заказы",
        value: formatCount(mainMetrics.value.orders)
      },
      {
        description: "Записи со статусом завершения.",
        icon: "i-lucide-check-check",
        label: "Завершено",
        value: formatCount(mainMetrics.value.completed)
      },
      {
        description: "Выручка, делённая на число завершённых записей.",
        icon: "i-lucide-receipt",
        label: "Средний чек",
        value: formatMoney(mainMetrics.value.averageCheck)
      }
    ]);
    const supportingKpiCards = computed(() => [
      {
        description: "Уникальные номера телефона в выбранном периоде.",
        icon: "i-lucide-users-round",
        label: "Всего клиентов",
        value: formatCount(clientMetrics.value.uniqueClients)
      },
      {
        description: "Новые и повторные клиенты в рамках выбранной области.",
        icon: "i-lucide-repeat-2",
        label: "Новые / повторные",
        value: `${formatCount(clientMetrics.value.newClients)} / ${formatCount(clientMetrics.value.repeatClients)}`
      },
      {
        description: "Доля завершённых записей от общего числа заказов.",
        icon: "i-lucide-gauge",
        label: "Completion rate",
        value: formatPercent(clientMetrics.value.completionRate)
      }
    ]);
    const operationsCards = computed(() => [
      {
        description: "Статусы cancelled, no_show и not_in_time.",
        icon: "i-lucide-ban",
        label: "Отмены",
        value: formatCount(operationsMetrics.value.cancelled)
      },
      {
        description: "Отдельно по статусу no_show.",
        icon: "i-lucide-user-x",
        label: "No-show",
        value: formatCount(operationsMetrics.value.noShow)
      },
      {
        description: "Приближение: фактический цикл минус длительность услуг.",
        icon: "i-lucide-hourglass",
        label: "Среднее ожидание",
        value: formatMinutes(operationsMetrics.value.averageWaitMinutes)
      },
      {
        description: "По completed-записям, от created_at до finished_at.",
        icon: "i-lucide-timer",
        label: "Среднее обслуживание",
        value: formatMinutes(operationsMetrics.value.averageServiceMinutes)
      }
    ]);
    const scopeContextLabel = computed(() => {
      if (scope.value === "branch") {
        return branchStore.activeBranch?.name || "Филиал не выбран";
      }
      if (scope.value === "barber") {
        return selectedBarber.value?.label || "Барбер не выбран";
      }
      return "Все филиалы";
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UDashboardPanel = _sfc_main$2;
      const _component_UDashboardNavbar = _sfc_main$1$1;
      const _component_UDashboardSidebarCollapse = _sfc_main$7;
      const _component_UButton = _sfc_main$a;
      const _component_UCard = _sfc_main$3;
      const _component_UBadge = _sfc_main$6;
      const _component_UFormField = _sfc_main$1;
      const _component_UInput = _sfc_main$4;
      const _component_USelectMenu = _sfc_main$5;
      const _component_SharedEmptyState = __nuxt_component_9;
      const _component_DashboardMetricCard = __nuxt_component_5;
      _push(ssrRenderComponent(_component_UDashboardPanel, mergeProps({ id: "statistics" }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UDashboardNavbar, {
              title: "Статистика",
              ui: { right: "gap-3" }
            }, {
              leading: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UDashboardSidebarCollapse, null, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UDashboardSidebarCollapse)
                  ];
                }
              }),
              right: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-refresh-cw",
                    loading: unref(pending),
                    variant: "outline",
                    onClick: ($event) => unref(refresh)()
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` Обновить `);
                      } else {
                        return [
                          createTextVNode(" Обновить ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UButton, {
                      color: "neutral",
                      icon: "i-lucide-refresh-cw",
                      loading: unref(pending),
                      variant: "outline",
                      onClick: ($event) => unref(refresh)()
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" Обновить ")
                      ]),
                      _: 1
                    }, 8, ["loading", "onClick"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UDashboardNavbar, {
                title: "Статистика",
                ui: { right: "gap-3" }
              }, {
                leading: withCtx(() => [
                  createVNode(_component_UDashboardSidebarCollapse)
                ]),
                right: withCtx(() => [
                  createVNode(_component_UButton, {
                    color: "neutral",
                    icon: "i-lucide-refresh-cw",
                    loading: unref(pending),
                    variant: "outline",
                    onClick: ($event) => unref(refresh)()
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Обновить ")
                    ]),
                    _: 1
                  }, 8, ["loading", "onClick"])
                ]),
                _: 1
              })
            ];
          }
        }),
        body: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
              header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Настройка среза </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Бизнес-аналитика по истории записей </h2><p class="text-sm text-charcoal-500"${_scopeId2}> Выручка и средний чек считаются по прайсу услуг в завершённых записях, так как backend не отдаёт отдельное поле revenue. </p></div><div class="flex flex-wrap items-center gap-3"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    size: "lg",
                    variant: "soft"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(formatScopeLabel)(unref(scope)))}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(formatScopeLabel)(unref(scope))), 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    variant: "outline"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(scopeContextLabel))}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(scopeContextLabel)), 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UBadge, {
                    color: "neutral",
                    variant: "outline"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(unref(formatCount)(unref(filteredHistory).length))} записей `);
                      } else {
                        return [
                          createTextVNode(toDisplayString(unref(formatCount)(unref(filteredHistory).length)) + " записей ", 1)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(`</div></div>`);
                } else {
                  return [
                    createVNode("div", { class: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Настройка среза "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Бизнес-аналитика по истории записей "),
                        createVNode("p", { class: "text-sm text-charcoal-500" }, " Выручка и средний чек считаются по прайсу услуг в завершённых записях, так как backend не отдаёт отдельное поле revenue. ")
                      ]),
                      createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          size: "lg",
                          variant: "soft"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(formatScopeLabel)(unref(scope))), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          variant: "outline"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(scopeContextLabel)), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          variant: "outline"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(formatCount)(unref(filteredHistory).length)) + " записей ", 1)
                          ]),
                          _: 1
                        })
                      ])
                    ])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="grid gap-4 xl:grid-cols-[0.26fr_0.26fr_0.18fr_0.3fr]"${_scopeId2}>`);
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Дата начала" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(uiStore).statisticsRange.start,
                          "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                          type: "date"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.start,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Дата окончания" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_UInput, {
                          modelValue: unref(uiStore).statisticsRange.end,
                          "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                          type: "date"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.end,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_UFormField, { label: "Область" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_USelectMenu, {
                          modelValue: unref(scope),
                          "onUpdate:modelValue": ($event) => isRef(scope) ? scope.value = $event : null,
                          items: [
                            { label: "Общая", value: "global" },
                            { label: "Филиал", value: "branch" },
                            { label: "Барбер", value: "barber" }
                          ],
                          "value-key": "value"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(scope),
                            "onUpdate:modelValue": ($event) => isRef(scope) ? scope.value = $event : null,
                            items: [
                              { label: "Общая", value: "global" },
                              { label: "Филиал", value: "branch" },
                              { label: "Барбер", value: "barber" }
                            ],
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  if (unref(scope) === "barber") {
                    _push3(ssrRenderComponent(_component_UFormField, { label: "Барбер" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_USelectMenu, {
                            modelValue: unref(selectedBarberId),
                            "onUpdate:modelValue": ($event) => isRef(selectedBarberId) ? selectedBarberId.value = $event : null,
                            items: unref(barberOptions),
                            "value-key": "value"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_USelectMenu, {
                              modelValue: unref(selectedBarberId),
                              "onUpdate:modelValue": ($event) => isRef(selectedBarberId) ? selectedBarberId.value = $event : null,
                              items: unref(barberOptions),
                              "value-key": "value"
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  _push3(`</div>`);
                } else {
                  return [
                    createVNode("div", { class: "grid gap-4 xl:grid-cols-[0.26fr_0.26fr_0.18fr_0.3fr]" }, [
                      createVNode(_component_UFormField, { label: "Дата начала" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.start,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Дата окончания" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.end,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Область" }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(scope),
                            "onUpdate:modelValue": ($event) => isRef(scope) ? scope.value = $event : null,
                            items: [
                              { label: "Общая", value: "global" },
                              { label: "Филиал", value: "branch" },
                              { label: "Барбер", value: "barber" }
                            ],
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      unref(scope) === "barber" ? (openBlock(), createBlock(_component_UFormField, {
                        key: 0,
                        label: "Барбер"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(selectedBarberId),
                            "onUpdate:modelValue": ($event) => isRef(selectedBarberId) ? selectedBarberId.value = $event : null,
                            items: unref(barberOptions),
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ]),
                        _: 1
                      })) : createCommentVNode("", true)
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (unref(needsBranchSelection)) {
              _push2(ssrRenderComponent(_component_SharedEmptyState, {
                description: "Для режима филиала выберите branch через BranchSelector в левой панели.",
                icon: "i-lucide-map-pinned",
                title: "Филиал не выбран"
              }, null, _parent2, _scopeId));
            } else if (unref(needsBarberSelection)) {
              _push2(ssrRenderComponent(_component_SharedEmptyState, {
                description: "Не найдено ни одного барбера для построения персональной статистики.",
                icon: "i-lucide-user-round-search",
                title: "Барбер не выбран"
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!--[--><div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2"${_scopeId}><!--[-->`);
              ssrRenderList(unref(primaryKpiCards), (card) => {
                _push2(ssrRenderComponent(_component_DashboardMetricCard, {
                  key: card.label,
                  description: card.description,
                  icon: card.icon,
                  label: card.label,
                  value: card.value
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div><div class="grid gap-4 xl:grid-cols-3 md:grid-cols-2"${_scopeId}><!--[-->`);
              ssrRenderList(unref(supportingKpiCards), (card) => {
                _push2(ssrRenderComponent(_component_DashboardMetricCard, {
                  key: card.label,
                  description: card.description,
                  icon: card.icon,
                  label: card.label,
                  value: card.value
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div><div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2"${_scopeId}><!--[-->`);
              ssrRenderList(unref(operationsCards), (card) => {
                _push2(ssrRenderComponent(_component_DashboardMetricCard, {
                  key: card.label,
                  description: card.description,
                  icon: card.icon,
                  label: card.label,
                  value: card.value
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div>`);
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"${_scopeId2}><div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Динамика </p><h2 class="barbershop-heading text-3xl text-charcoal-950"${_scopeId2}> Завершённые заказы и отказы по дням </h2></div><div class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-charcoal-500"${_scopeId2}><div class="flex items-center gap-2"${_scopeId2}><span class="size-3 rounded-full bg-emerald-400"${_scopeId2}></span> Завершено </div><div class="flex items-center gap-2"${_scopeId2}><span class="size-3 rounded-full bg-amber-400"${_scopeId2}></span> Отказы </div>`);
                    _push3(ssrRenderComponent(_component_UBadge, {
                      color: "neutral",
                      variant: "outline"
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(unref(formatCount)(unref(selectedPeriodDays)))} дн. `);
                        } else {
                          return [
                            createTextVNode(toDisplayString(unref(formatCount)(unref(selectedPeriodDays))) + " дн. ", 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between" }, [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Динамика "),
                          createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Завершённые заказы и отказы по дням ")
                        ]),
                        createVNode("div", { class: "flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-charcoal-500" }, [
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("span", { class: "size-3 rounded-full bg-emerald-400" }),
                            createTextVNode(" Завершено ")
                          ]),
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("span", { class: "size-3 rounded-full bg-amber-400" }),
                            createTextVNode(" Отказы ")
                          ]),
                          createVNode(_component_UBadge, {
                            color: "neutral",
                            variant: "outline"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(unref(formatCount)(unref(selectedPeriodDays))) + " дн. ", 1)
                            ]),
                            _: 1
                          })
                        ])
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(timelineRows).length && unref(filteredHistory).length) {
                      _push3(`<div class="overflow-x-auto pb-2"${_scopeId2}><div class="min-w-[64rem] rounded-[2rem] bg-charcoal-950 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-6"${_scopeId2}><div class="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-4"${_scopeId2}><div class="flex h-[24rem] flex-col justify-between pb-12 text-right text-xs font-medium text-sand-200/70"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(timelineAxisTicks), (tick) => {
                        _push3(`<span${_scopeId2}>${ssrInterpolate(tick.label)}</span>`);
                      });
                      _push3(`<!--]--></div><div class="relative"${_scopeId2}><div class="pointer-events-none absolute inset-0 flex h-[24rem] flex-col justify-between pb-12"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(timelineAxisTicks), (tick) => {
                        _push3(`<div class="border-t border-dashed border-white/10"${_scopeId2}></div>`);
                      });
                      _push3(`<!--]--></div><div class="relative flex h-[24rem] min-w-max items-end gap-3 pb-12"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(timelineRows), (point) => {
                        _push3(`<div class="flex w-14 shrink-0 flex-col items-center gap-3"${ssrRenderAttr("title", `${point.label}: ${unref(formatCount)(point.completed)} завершено, ${unref(formatCount)(point.cancelled)} отказов`)}${_scopeId2}><div class="flex h-full w-full items-end justify-center gap-1.5 rounded-[1.5rem] px-1"${_scopeId2}><div class="w-4 rounded-t-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.35)] transition-all" style="${ssrRenderStyle({ height: `${point.completedHeight}%` })}"${_scopeId2}></div><div class="w-4 rounded-t-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.28)] transition-all" style="${ssrRenderStyle({ height: `${point.cancelledHeight}%` })}"${_scopeId2}></div></div><div class="space-y-1 text-center"${_scopeId2}><p class="text-[11px] font-medium text-sand-50"${_scopeId2}>${ssrInterpolate(point.label)}</p><p class="text-[10px] text-sand-200/60"${_scopeId2}>${ssrInterpolate(unref(formatCount)(point.completed))} / ${ssrInterpolate(unref(formatCount)(point.cancelled))}</p></div></div>`);
                      });
                      _push3(`<!--]--></div></div></div></div></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "За выбранный диапазон нет записей для построения графика завершений и отказов.",
                        icon: "i-lucide-chart-no-axes-combined",
                        title: "Нет данных по периоду"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(timelineRows).length && unref(filteredHistory).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "overflow-x-auto pb-2"
                      }, [
                        createVNode("div", { class: "min-w-[64rem] rounded-[2rem] bg-charcoal-950 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-6" }, [
                          createVNode("div", { class: "grid grid-cols-[3.75rem_minmax(0,1fr)] gap-4" }, [
                            createVNode("div", { class: "flex h-[24rem] flex-col justify-between pb-12 text-right text-xs font-medium text-sand-200/70" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(timelineAxisTicks), (tick) => {
                                return openBlock(), createBlock("span", {
                                  key: `tick-${tick.value}`
                                }, toDisplayString(tick.label), 1);
                              }), 128))
                            ]),
                            createVNode("div", { class: "relative" }, [
                              createVNode("div", { class: "pointer-events-none absolute inset-0 flex h-[24rem] flex-col justify-between pb-12" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(timelineAxisTicks), (tick) => {
                                  return openBlock(), createBlock("div", {
                                    key: `grid-${tick.value}`,
                                    class: "border-t border-dashed border-white/10"
                                  });
                                }), 128))
                              ]),
                              createVNode("div", { class: "relative flex h-[24rem] min-w-max items-end gap-3 pb-12" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(timelineRows), (point) => {
                                  return openBlock(), createBlock("div", {
                                    key: point.dateKey,
                                    class: "flex w-14 shrink-0 flex-col items-center gap-3",
                                    title: `${point.label}: ${unref(formatCount)(point.completed)} завершено, ${unref(formatCount)(point.cancelled)} отказов`
                                  }, [
                                    createVNode("div", { class: "flex h-full w-full items-end justify-center gap-1.5 rounded-[1.5rem] px-1" }, [
                                      createVNode("div", {
                                        class: "w-4 rounded-t-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.35)] transition-all",
                                        style: { height: `${point.completedHeight}%` }
                                      }, null, 4),
                                      createVNode("div", {
                                        class: "w-4 rounded-t-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.28)] transition-all",
                                        style: { height: `${point.cancelledHeight}%` }
                                      }, null, 4)
                                    ]),
                                    createVNode("div", { class: "space-y-1 text-center" }, [
                                      createVNode("p", { class: "text-[11px] font-medium text-sand-50" }, toDisplayString(point.label), 1),
                                      createVNode("p", { class: "text-[10px] text-sand-200/60" }, toDisplayString(unref(formatCount)(point.completed)) + " / " + toDisplayString(unref(formatCount)(point.cancelled)), 1)
                                    ])
                                  ], 8, ["title"]);
                                }), 128))
                              ])
                            ])
                          ])
                        ])
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "За выбранный диапазон нет записей для построения графика завершений и отказов.",
                        icon: "i-lucide-chart-no-axes-combined",
                        title: "Нет данных по периоду"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`<div class="grid gap-6 2xl:grid-cols-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Разбивка </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> По филиалам </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По филиалам ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(branchBreakdown).length) {
                      _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(branchBreakdown), (row) => {
                        _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-start justify-between gap-4"${_scopeId2}><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs uppercase tracking-[0.16em] text-charcoal-500"${_scopeId2}>${ssrInterpolate(unref(formatCount)(row.count))} записей · ${ssrInterpolate(unref(formatCount)(row.uniqueClients))} клиентов </p></div><div class="space-y-1 text-right"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p><p class="text-xs text-charcoal-500"${_scopeId2}> Completion ${ssrInterpolate(unref(formatPercent)(row.completionRate))}</p></div></div><div class="mt-3 h-2 rounded-full bg-sand-100"${_scopeId2}><div class="h-full rounded-full bg-brass-400" style="${ssrRenderStyle({ width: `${row.completionRate}%` })}"${_scopeId2}></div></div></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "Нет записей для группировки по филиалам.",
                        icon: "i-lucide-map",
                        title: "Разбивка пуста"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(branchBreakdown).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(branchBreakdown), (row) => {
                          return openBlock(), createBlock("div", {
                            key: row.id,
                            class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей · " + toDisplayString(unref(formatCount)(row.uniqueClients)) + " клиентов ", 1)
                              ]),
                              createVNode("div", { class: "space-y-1 text-right" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1),
                                createVNode("p", { class: "text-xs text-charcoal-500" }, " Completion " + toDisplayString(unref(formatPercent)(row.completionRate)), 1)
                              ])
                            ]),
                            createVNode("div", { class: "mt-3 h-2 rounded-full bg-sand-100" }, [
                              createVNode("div", {
                                class: "h-full rounded-full bg-brass-400",
                                style: { width: `${row.completionRate}%` }
                              }, null, 4)
                            ])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Нет записей для группировки по филиалам.",
                        icon: "i-lucide-map",
                        title: "Разбивка пуста"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Разбивка </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> По барберам </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По барберам ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(barberBreakdown).length) {
                      _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(barberBreakdown), (row) => {
                        _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-start justify-between gap-4"${_scopeId2}><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs uppercase tracking-[0.16em] text-charcoal-500"${_scopeId2}>${ssrInterpolate(unref(formatCount)(row.count))} записей · ${ssrInterpolate(unref(formatCount)(row.uniqueClients))} клиентов </p></div><div class="space-y-1 text-right"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p><p class="text-xs text-charcoal-500"${_scopeId2}> Completion ${ssrInterpolate(unref(formatPercent)(row.completionRate))}</p></div></div><div class="mt-3 h-2 rounded-full bg-sand-100"${_scopeId2}><div class="h-full rounded-full bg-charcoal-700" style="${ssrRenderStyle({ width: `${row.completionRate}%` })}"${_scopeId2}></div></div></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "Нет записей для группировки по барберам.",
                        icon: "i-lucide-scissors",
                        title: "Разбивка пуста"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(barberBreakdown).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(barberBreakdown), (row) => {
                          return openBlock(), createBlock("div", {
                            key: row.id,
                            class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей · " + toDisplayString(unref(formatCount)(row.uniqueClients)) + " клиентов ", 1)
                              ]),
                              createVNode("div", { class: "space-y-1 text-right" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1),
                                createVNode("p", { class: "text-xs text-charcoal-500" }, " Completion " + toDisplayString(unref(formatPercent)(row.completionRate)), 1)
                              ])
                            ]),
                            createVNode("div", { class: "mt-3 h-2 rounded-full bg-sand-100" }, [
                              createVNode("div", {
                                class: "h-full rounded-full bg-charcoal-700",
                                style: { width: `${row.completionRate}%` }
                              }, null, 4)
                            ])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Нет записей для группировки по барберам.",
                        icon: "i-lucide-scissors",
                        title: "Разбивка пуста"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Разбивка </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> По услугам </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По услугам ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(serviceBreakdown).length) {
                      _push3(`<div class="max-h-[34rem] space-y-3 overflow-auto pr-1"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(serviceBreakdown), (row) => {
                        _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-start justify-between gap-4"${_scopeId2}><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs uppercase tracking-[0.16em] text-charcoal-500"${_scopeId2}>${ssrInterpolate(row.category)} · ${ssrInterpolate(unref(formatCount)(row.count))} использований </p></div><div class="space-y-1 text-right"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p><p class="text-xs text-charcoal-500"${_scopeId2}> Средняя цена ${ssrInterpolate(unref(formatMoney)(row.avgPrice))}</p></div></div></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "В истории нет услуг для разбивки.",
                        icon: "i-lucide-badge-dollar-sign",
                        title: "Разбивка пуста"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(serviceBreakdown).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "max-h-[34rem] space-y-3 overflow-auto pr-1"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(serviceBreakdown), (row) => {
                          return openBlock(), createBlock("div", {
                            key: row.id,
                            class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(row.category) + " · " + toDisplayString(unref(formatCount)(row.count)) + " использований ", 1)
                              ]),
                              createVNode("div", { class: "space-y-1 text-right" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1),
                                createVNode("p", { class: "text-xs text-charcoal-500" }, " Средняя цена " + toDisplayString(unref(formatMoney)(row.avgPrice)), 1)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "В истории нет услуг для разбивки.",
                        icon: "i-lucide-badge-dollar-sign",
                        title: "Разбивка пуста"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Разбивка </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> По способам оплаты </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По способам оплаты ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(paymentBreakdown).length) {
                      _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(paymentBreakdown), (row) => {
                        _push3(`<div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-start justify-between gap-4"${_scopeId2}><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs uppercase tracking-[0.16em] text-charcoal-500"${_scopeId2}>${ssrInterpolate(unref(formatCount)(row.count))} записей · ${ssrInterpolate(unref(formatPercent)(row.percent))}</p></div><div class="text-right"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p></div></div></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "Не найдено ни одного способа оплаты.",
                        icon: "i-lucide-credit-card",
                        title: "Разбивка пуста"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(paymentBreakdown).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(paymentBreakdown), (row) => {
                          return openBlock(), createBlock("div", {
                            key: row.key,
                            class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей · " + toDisplayString(unref(formatPercent)(row.percent)), 1)
                              ]),
                              createVNode("div", { class: "text-right" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Не найдено ни одного способа оплаты.",
                        icon: "i-lucide-credit-card",
                        title: "Разбивка пуста"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div><div class="grid gap-6 xl:grid-cols-3"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Top-лист </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Лучшие филиалы </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Top-лист "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Лучшие филиалы ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(topBranches).length) {
                      _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(topBranches), (row, index) => {
                        _push3(`<div class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-center gap-3"${_scopeId2}><div class="flex size-9 items-center justify-center rounded-2xl bg-brass-100 font-semibold text-brass-800"${_scopeId2}>${ssrInterpolate(index + 1)}</div><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs text-charcoal-500"${_scopeId2}>${ssrInterpolate(unref(formatCount)(row.count))} записей </p></div></div><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "Нет филиалов для ранжирования.",
                        icon: "i-lucide-trophy",
                        title: "Top-лист пуст"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(topBranches).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(topBranches), (row, index) => {
                          return openBlock(), createBlock("div", {
                            key: row.id,
                            class: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-center gap-3" }, [
                              createVNode("div", { class: "flex size-9 items-center justify-center rounded-2xl bg-brass-100 font-semibold text-brass-800" }, toDisplayString(index + 1), 1),
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей ", 1)
                              ])
                            ]),
                            createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Нет филиалов для ранжирования.",
                        icon: "i-lucide-trophy",
                        title: "Top-лист пуст"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Top-лист </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Лучшие барберы </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Top-лист "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Лучшие барберы ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(topBarbers).length) {
                      _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(topBarbers), (row, index) => {
                        _push3(`<div class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-center gap-3"${_scopeId2}><div class="flex size-9 items-center justify-center rounded-2xl bg-sand-100 font-semibold text-charcoal-900"${_scopeId2}>${ssrInterpolate(index + 1)}</div><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs text-charcoal-500"${_scopeId2}>${ssrInterpolate(unref(formatCount)(row.count))} записей </p></div></div><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "Нет барберов для ранжирования.",
                        icon: "i-lucide-award",
                        title: "Top-лист пуст"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(topBarbers).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(topBarbers), (row, index) => {
                          return openBlock(), createBlock("div", {
                            key: row.id,
                            class: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-center gap-3" }, [
                              createVNode("div", { class: "flex size-9 items-center justify-center rounded-2xl bg-sand-100 font-semibold text-charcoal-900" }, toDisplayString(index + 1), 1),
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей ", 1)
                              ])
                            ]),
                            createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Нет барберов для ранжирования.",
                        icon: "i-lucide-award",
                        title: "Top-лист пуст"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                header: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="space-y-2"${_scopeId2}><p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500"${_scopeId2}> Top-лист </p><h2 class="barbershop-heading text-2xl text-charcoal-950"${_scopeId2}> Частые услуги </h2></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Top-лист "),
                        createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Частые услуги ")
                      ])
                    ];
                  }
                }),
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (unref(topServices).length) {
                      _push3(`<div class="space-y-3"${_scopeId2}><!--[-->`);
                      ssrRenderList(unref(topServices), (row, index) => {
                        _push3(`<div class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"${_scopeId2}><div class="flex items-center gap-3"${_scopeId2}><div class="flex size-9 items-center justify-center rounded-2xl bg-charcoal-100 font-semibold text-charcoal-900"${_scopeId2}>${ssrInterpolate(index + 1)}</div><div class="space-y-1"${_scopeId2}><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(row.label)}</p><p class="text-xs text-charcoal-500"${_scopeId2}>${ssrInterpolate(row.category)} · ${ssrInterpolate(unref(formatCount)(row.count))} раз </p></div></div><p class="font-semibold text-charcoal-950"${_scopeId2}>${ssrInterpolate(unref(formatMoney)(row.revenue))}</p></div>`);
                      });
                      _push3(`<!--]--></div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_SharedEmptyState, {
                        description: "Нет услуг для ранжирования.",
                        icon: "i-lucide-list-ordered",
                        title: "Top-лист пуст"
                      }, null, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      unref(topServices).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "space-y-3"
                      }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(topServices), (row, index) => {
                          return openBlock(), createBlock("div", {
                            key: row.id,
                            class: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                          }, [
                            createVNode("div", { class: "flex items-center gap-3" }, [
                              createVNode("div", { class: "flex size-9 items-center justify-center rounded-2xl bg-charcoal-100 font-semibold text-charcoal-900" }, toDisplayString(index + 1), 1),
                              createVNode("div", { class: "space-y-1" }, [
                                createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.category) + " · " + toDisplayString(unref(formatCount)(row.count)) + " раз ", 1)
                              ])
                            ]),
                            createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                          ]);
                        }), 128))
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "Нет услуг для ранжирования.",
                        icon: "i-lucide-list-ordered",
                        title: "Top-лист пуст"
                      }))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div><!--]-->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                  header: withCtx(() => [
                    createVNode("div", { class: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between" }, [
                      createVNode("div", { class: "space-y-2" }, [
                        createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Настройка среза "),
                        createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Бизнес-аналитика по истории записей "),
                        createVNode("p", { class: "text-sm text-charcoal-500" }, " Выручка и средний чек считаются по прайсу услуг в завершённых записях, так как backend не отдаёт отдельное поле revenue. ")
                      ]),
                      createVNode("div", { class: "flex flex-wrap items-center gap-3" }, [
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          size: "lg",
                          variant: "soft"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(formatScopeLabel)(unref(scope))), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          variant: "outline"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(scopeContextLabel)), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_UBadge, {
                          color: "neutral",
                          variant: "outline"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(unref(formatCount)(unref(filteredHistory).length)) + " записей ", 1)
                          ]),
                          _: 1
                        })
                      ])
                    ])
                  ]),
                  default: withCtx(() => [
                    createVNode("div", { class: "grid gap-4 xl:grid-cols-[0.26fr_0.26fr_0.18fr_0.3fr]" }, [
                      createVNode(_component_UFormField, { label: "Дата начала" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.start,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.start = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Дата окончания" }, {
                        default: withCtx(() => [
                          createVNode(_component_UInput, {
                            modelValue: unref(uiStore).statisticsRange.end,
                            "onUpdate:modelValue": ($event) => unref(uiStore).statisticsRange.end = $event,
                            type: "date"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_UFormField, { label: "Область" }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(scope),
                            "onUpdate:modelValue": ($event) => isRef(scope) ? scope.value = $event : null,
                            items: [
                              { label: "Общая", value: "global" },
                              { label: "Филиал", value: "branch" },
                              { label: "Барбер", value: "barber" }
                            ],
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue"])
                        ]),
                        _: 1
                      }),
                      unref(scope) === "barber" ? (openBlock(), createBlock(_component_UFormField, {
                        key: 0,
                        label: "Барбер"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_USelectMenu, {
                            modelValue: unref(selectedBarberId),
                            "onUpdate:modelValue": ($event) => isRef(selectedBarberId) ? selectedBarberId.value = $event : null,
                            items: unref(barberOptions),
                            "value-key": "value"
                          }, null, 8, ["modelValue", "onUpdate:modelValue", "items"])
                        ]),
                        _: 1
                      })) : createCommentVNode("", true)
                    ])
                  ]),
                  _: 1
                }),
                unref(needsBranchSelection) ? (openBlock(), createBlock(_component_SharedEmptyState, {
                  key: 0,
                  description: "Для режима филиала выберите branch через BranchSelector в левой панели.",
                  icon: "i-lucide-map-pinned",
                  title: "Филиал не выбран"
                })) : unref(needsBarberSelection) ? (openBlock(), createBlock(_component_SharedEmptyState, {
                  key: 1,
                  description: "Не найдено ни одного барбера для построения персональной статистики.",
                  icon: "i-lucide-user-round-search",
                  title: "Барбер не выбран"
                })) : (openBlock(), createBlock(Fragment, { key: 2 }, [
                  createVNode("div", { class: "grid gap-4 xl:grid-cols-4 md:grid-cols-2" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(primaryKpiCards), (card) => {
                      return openBlock(), createBlock(_component_DashboardMetricCard, {
                        key: card.label,
                        description: card.description,
                        icon: card.icon,
                        label: card.label,
                        value: card.value
                      }, null, 8, ["description", "icon", "label", "value"]);
                    }), 128))
                  ]),
                  createVNode("div", { class: "grid gap-4 xl:grid-cols-3 md:grid-cols-2" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(supportingKpiCards), (card) => {
                      return openBlock(), createBlock(_component_DashboardMetricCard, {
                        key: card.label,
                        description: card.description,
                        icon: card.icon,
                        label: card.label,
                        value: card.value
                      }, null, 8, ["description", "icon", "label", "value"]);
                    }), 128))
                  ]),
                  createVNode("div", { class: "grid gap-4 xl:grid-cols-4 md:grid-cols-2" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(operationsCards), (card) => {
                      return openBlock(), createBlock(_component_DashboardMetricCard, {
                        key: card.label,
                        description: card.description,
                        icon: card.icon,
                        label: card.label,
                        value: card.value
                      }, null, 8, ["description", "icon", "label", "value"]);
                    }), 128))
                  ]),
                  createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                    header: withCtx(() => [
                      createVNode("div", { class: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between" }, [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Динамика "),
                          createVNode("h2", { class: "barbershop-heading text-3xl text-charcoal-950" }, " Завершённые заказы и отказы по дням ")
                        ]),
                        createVNode("div", { class: "flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-charcoal-500" }, [
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("span", { class: "size-3 rounded-full bg-emerald-400" }),
                            createTextVNode(" Завершено ")
                          ]),
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("span", { class: "size-3 rounded-full bg-amber-400" }),
                            createTextVNode(" Отказы ")
                          ]),
                          createVNode(_component_UBadge, {
                            color: "neutral",
                            variant: "outline"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(unref(formatCount)(unref(selectedPeriodDays))) + " дн. ", 1)
                            ]),
                            _: 1
                          })
                        ])
                      ])
                    ]),
                    default: withCtx(() => [
                      unref(timelineRows).length && unref(filteredHistory).length ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "overflow-x-auto pb-2"
                      }, [
                        createVNode("div", { class: "min-w-[64rem] rounded-[2rem] bg-charcoal-950 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-6" }, [
                          createVNode("div", { class: "grid grid-cols-[3.75rem_minmax(0,1fr)] gap-4" }, [
                            createVNode("div", { class: "flex h-[24rem] flex-col justify-between pb-12 text-right text-xs font-medium text-sand-200/70" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(timelineAxisTicks), (tick) => {
                                return openBlock(), createBlock("span", {
                                  key: `tick-${tick.value}`
                                }, toDisplayString(tick.label), 1);
                              }), 128))
                            ]),
                            createVNode("div", { class: "relative" }, [
                              createVNode("div", { class: "pointer-events-none absolute inset-0 flex h-[24rem] flex-col justify-between pb-12" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(timelineAxisTicks), (tick) => {
                                  return openBlock(), createBlock("div", {
                                    key: `grid-${tick.value}`,
                                    class: "border-t border-dashed border-white/10"
                                  });
                                }), 128))
                              ]),
                              createVNode("div", { class: "relative flex h-[24rem] min-w-max items-end gap-3 pb-12" }, [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(timelineRows), (point) => {
                                  return openBlock(), createBlock("div", {
                                    key: point.dateKey,
                                    class: "flex w-14 shrink-0 flex-col items-center gap-3",
                                    title: `${point.label}: ${unref(formatCount)(point.completed)} завершено, ${unref(formatCount)(point.cancelled)} отказов`
                                  }, [
                                    createVNode("div", { class: "flex h-full w-full items-end justify-center gap-1.5 rounded-[1.5rem] px-1" }, [
                                      createVNode("div", {
                                        class: "w-4 rounded-t-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.35)] transition-all",
                                        style: { height: `${point.completedHeight}%` }
                                      }, null, 4),
                                      createVNode("div", {
                                        class: "w-4 rounded-t-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.28)] transition-all",
                                        style: { height: `${point.cancelledHeight}%` }
                                      }, null, 4)
                                    ]),
                                    createVNode("div", { class: "space-y-1 text-center" }, [
                                      createVNode("p", { class: "text-[11px] font-medium text-sand-50" }, toDisplayString(point.label), 1),
                                      createVNode("p", { class: "text-[10px] text-sand-200/60" }, toDisplayString(unref(formatCount)(point.completed)) + " / " + toDisplayString(unref(formatCount)(point.cancelled)), 1)
                                    ])
                                  ], 8, ["title"]);
                                }), 128))
                              ])
                            ])
                          ])
                        ])
                      ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                        key: 1,
                        description: "За выбранный диапазон нет записей для построения графика завершений и отказов.",
                        icon: "i-lucide-chart-no-axes-combined",
                        title: "Нет данных по периоду"
                      }))
                    ]),
                    _: 1
                  }),
                  createVNode("div", { class: "grid gap-6 2xl:grid-cols-2" }, [
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По филиалам ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(branchBreakdown).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(branchBreakdown), (row) => {
                            return openBlock(), createBlock("div", {
                              key: row.id,
                              class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей · " + toDisplayString(unref(formatCount)(row.uniqueClients)) + " клиентов ", 1)
                                ]),
                                createVNode("div", { class: "space-y-1 text-right" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1),
                                  createVNode("p", { class: "text-xs text-charcoal-500" }, " Completion " + toDisplayString(unref(formatPercent)(row.completionRate)), 1)
                                ])
                              ]),
                              createVNode("div", { class: "mt-3 h-2 rounded-full bg-sand-100" }, [
                                createVNode("div", {
                                  class: "h-full rounded-full bg-brass-400",
                                  style: { width: `${row.completionRate}%` }
                                }, null, 4)
                              ])
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "Нет записей для группировки по филиалам.",
                          icon: "i-lucide-map",
                          title: "Разбивка пуста"
                        }))
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По барберам ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(barberBreakdown).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(barberBreakdown), (row) => {
                            return openBlock(), createBlock("div", {
                              key: row.id,
                              class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей · " + toDisplayString(unref(formatCount)(row.uniqueClients)) + " клиентов ", 1)
                                ]),
                                createVNode("div", { class: "space-y-1 text-right" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1),
                                  createVNode("p", { class: "text-xs text-charcoal-500" }, " Completion " + toDisplayString(unref(formatPercent)(row.completionRate)), 1)
                                ])
                              ]),
                              createVNode("div", { class: "mt-3 h-2 rounded-full bg-sand-100" }, [
                                createVNode("div", {
                                  class: "h-full rounded-full bg-charcoal-700",
                                  style: { width: `${row.completionRate}%` }
                                }, null, 4)
                              ])
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "Нет записей для группировки по барберам.",
                          icon: "i-lucide-scissors",
                          title: "Разбивка пуста"
                        }))
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По услугам ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(serviceBreakdown).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "max-h-[34rem] space-y-3 overflow-auto pr-1"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(serviceBreakdown), (row) => {
                            return openBlock(), createBlock("div", {
                              key: row.id,
                              class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(row.category) + " · " + toDisplayString(unref(formatCount)(row.count)) + " использований ", 1)
                                ]),
                                createVNode("div", { class: "space-y-1 text-right" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1),
                                  createVNode("p", { class: "text-xs text-charcoal-500" }, " Средняя цена " + toDisplayString(unref(formatMoney)(row.avgPrice)), 1)
                                ])
                              ])
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "В истории нет услуг для разбивки.",
                          icon: "i-lucide-badge-dollar-sign",
                          title: "Разбивка пуста"
                        }))
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Разбивка "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " По способам оплаты ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(paymentBreakdown).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(paymentBreakdown), (row) => {
                            return openBlock(), createBlock("div", {
                              key: row.key,
                              class: "rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-start justify-between gap-4" }, [
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs uppercase tracking-[0.16em] text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей · " + toDisplayString(unref(formatPercent)(row.percent)), 1)
                                ]),
                                createVNode("div", { class: "text-right" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                                ])
                              ])
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "Не найдено ни одного способа оплаты.",
                          icon: "i-lucide-credit-card",
                          title: "Разбивка пуста"
                        }))
                      ]),
                      _: 1
                    })
                  ]),
                  createVNode("div", { class: "grid gap-6 xl:grid-cols-3" }, [
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Top-лист "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Лучшие филиалы ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(topBranches).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(topBranches), (row, index) => {
                            return openBlock(), createBlock("div", {
                              key: row.id,
                              class: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "flex size-9 items-center justify-center rounded-2xl bg-brass-100 font-semibold text-brass-800" }, toDisplayString(index + 1), 1),
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей ", 1)
                                ])
                              ]),
                              createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "Нет филиалов для ранжирования.",
                          icon: "i-lucide-trophy",
                          title: "Top-лист пуст"
                        }))
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Top-лист "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Лучшие барберы ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(topBarbers).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(topBarbers), (row, index) => {
                            return openBlock(), createBlock("div", {
                              key: row.id,
                              class: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "flex size-9 items-center justify-center rounded-2xl bg-sand-100 font-semibold text-charcoal-900" }, toDisplayString(index + 1), 1),
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(unref(formatCount)(row.count)) + " записей ", 1)
                                ])
                              ]),
                              createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "Нет барберов для ранжирования.",
                          icon: "i-lucide-award",
                          title: "Top-лист пуст"
                        }))
                      ]),
                      _: 1
                    }),
                    createVNode(_component_UCard, { class: "warm-card rounded-[1.9rem] border border-charcoal-200" }, {
                      header: withCtx(() => [
                        createVNode("div", { class: "space-y-2" }, [
                          createVNode("p", { class: "text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500" }, " Top-лист "),
                          createVNode("h2", { class: "barbershop-heading text-2xl text-charcoal-950" }, " Частые услуги ")
                        ])
                      ]),
                      default: withCtx(() => [
                        unref(topServices).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "space-y-3"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(topServices), (row, index) => {
                            return openBlock(), createBlock("div", {
                              key: row.id,
                              class: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                            }, [
                              createVNode("div", { class: "flex items-center gap-3" }, [
                                createVNode("div", { class: "flex size-9 items-center justify-center rounded-2xl bg-charcoal-100 font-semibold text-charcoal-900" }, toDisplayString(index + 1), 1),
                                createVNode("div", { class: "space-y-1" }, [
                                  createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(row.label), 1),
                                  createVNode("p", { class: "text-xs text-charcoal-500" }, toDisplayString(row.category) + " · " + toDisplayString(unref(formatCount)(row.count)) + " раз ", 1)
                                ])
                              ]),
                              createVNode("p", { class: "font-semibold text-charcoal-950" }, toDisplayString(unref(formatMoney)(row.revenue)), 1)
                            ]);
                          }), 128))
                        ])) : (openBlock(), createBlock(_component_SharedEmptyState, {
                          key: 1,
                          description: "Нет услуг для ранжирования.",
                          icon: "i-lucide-list-ordered",
                          title: "Top-лист пуст"
                        }))
                      ]),
                      _: 1
                    })
                  ])
                ], 64))
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/statistics.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };;globalThis.__timing__.logEnd('Load chunks/build/statistics-DqWd9Cin');
//# sourceMappingURL=statistics-DqWd9Cin.mjs.map
