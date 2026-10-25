/**
 * True while a page has nothing to show yet: the first request is in flight,
 * or the page fetches after mount and has not mounted (SSR / hydration).
 * Refreshes with data already present return false, so old values stay visible.
 */
export function isFirstLoad(pending: boolean, hasData: boolean, isMounted = true): boolean {
  if (hasData) return false
  return pending || !isMounted
}
