/**
 * Paths that render a public status page (same set used to skip socket.io
 * for anonymous visitors). Logged-in admins still connect, so heartbeat
 * toasts must be scoped to monitors actually listed on the page.
 */
export const STATUS_PAGE_PATHS = [/^\/status-page$/, /^\/status/, /^\/$/];

/**
 * @param {string} pathname location.pathname
 * @returns {boolean} True if this path is a status page
 */
export function isStatusPagePath(pathname) {
    return STATUS_PAGE_PATHS.some((page) => (pathname || "").match(page));
}

/**
 * Dashboard toasts every monitor. Status page toasts only monitors in
 * publicMonitorList (Dev/canary/internal checks stay silent there).
 * @param {string} pathname location.pathname
 * @param {object} publicMonitorList map of monitor id -> public monitor
 * @param {string|number} monitorID heartbeat monitor id
 * @returns {boolean} Whether to show the heartbeat toast
 */
export function shouldToastHeartbeat(pathname, publicMonitorList, monitorID) {
    if (!isStatusPagePath(pathname)) {
        return true;
    }
    const list = publicMonitorList || {};
    return list[monitorID] !== undefined || list[String(monitorID)] !== undefined;
}
