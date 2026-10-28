import dayjs from "dayjs";

/** Zone for every time shown on the status page. */
export const STATUS_PAGE_TIMEZONE = "America/New_York";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const UTC_STAMP = /\[([A-Z][a-z]{2}) (\d{1,2}), (\d{2}):(\d{2}) UTC\]/g;

/**
 * Format a UTC time in the status page zone, e.g. "2026-10-28 10:08:56 EDT".
 * @param {string|number|Date|dayjs.Dayjs} value UTC time (DB strings carry no zone suffix)
 * @returns {string} Formatted time, "" when empty or invalid
 */
export function formatStatusTime(value) {
    const time = dayjs.utc(value).tz(STATUS_PAGE_TIMEZONE);
    if (!value || !time.isValid()) {
        return "";
    }
    return `${time.format("YYYY-MM-DD HH:mm:ss")} ${time.offsetName()}`;
}

/**
 * Value for an <input type="datetime-local"> showing a UTC time in the status page zone.
 * Minute precision matches the value the browser reports back, so re-renders don't reset the input.
 * @param {string} value UTC time
 * @returns {string} "YYYY-MM-DDTHH:mm", "" when empty or invalid
 */
export function toStatusInputTime(value) {
    const time = dayjs.utc(value).tz(STATUS_PAGE_TIMEZONE);
    if (!value || !time.isValid()) {
        return "";
    }
    return time.format("YYYY-MM-DDTHH:mm");
}

/**
 * Inverse of toStatusInputTime.
 * @param {string} value "YYYY-MM-DDTHH:mm" in the status page zone
 * @returns {string} UTC "YYYY-MM-DD HH:mm:ss", "" when empty
 */
export function fromStatusInputTime(value) {
    if (!value) {
        return "";
    }
    return dayjs.tz(value, STATUS_PAGE_TIMEZONE).utc().format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Show "[Oct 28, 13:40 UTC]" stamps in incident markdown in the status page zone.
 * Stamps carry no year; the incident's created year is used, which only matters for DST.
 * @param {string} content Incident markdown
 * @param {string} createdDate Incident created date (UTC)
 * @returns {string} Markdown with converted stamps
 */
export function localizeIncidentStamps(content, createdDate) {
    const year = createdDate ? dayjs.utc(createdDate).year() : dayjs.utc().year();
    return content.replace(UTC_STAMP, (stamp, mon, day, hour, minute) => {
        const month = MONTHS.indexOf(mon);
        if (month < 0 || Number.isNaN(year)) {
            return stamp;
        }
        const time = dayjs.utc(Date.UTC(year, month, day, hour, minute)).tz(STATUS_PAGE_TIMEZONE);
        return `[${time.format("MMM D, HH:mm")} ${time.offsetName()}]`;
    });
}

/**
 * Remove an incident from the local history list.
 * @param {object[]} history Current incident list
 * @param {number|string} incidentId Incident id to drop
 * @returns {object[]} Updated list
 */
export function removeIncident(history, incidentId) {
    const list = history || [];
    if (incidentId == null) {
        return list;
    }
    return list.filter((item) => item.id !== incidentId);
}

/**
 * Banner incidents are active and pinned. Resolve/status=resolved must fail this.
 * @param {object} incident Incident from history
 * @returns {boolean} True if it belongs on the top banner
 */
export function isActivePinned(incident) {
    return Boolean(incident?.active && incident?.pin);
}
