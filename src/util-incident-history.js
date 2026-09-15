/**
 * Merge a saved incident into the local history list.
 * Used so admin UI updates from the socket payload without waiting on the
 * cached public GET /incident-history.
 * @param {object[]} history Current incident list
 * @param {object} incident Saved incident (must have id)
 * @returns {object[]} Updated list
 */
export function upsertIncident(history, incident) {
    const list = history || [];
    if (!incident?.id) {
        return list;
    }
    const idx = list.findIndex((item) => item.id === incident.id);
    if (idx >= 0) {
        const next = list.slice();
        next[idx] = incident;
        return next;
    }
    return [incident, ...list];
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
