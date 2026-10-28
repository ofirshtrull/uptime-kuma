const { BeanModel } = require("redbean-node/dist/bean-model");
const { R } = require("redbean-node");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const VALID_INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"];

/**
 * Mutate incident fields for a public status change.
 * resolved → inactive + unpinned. Leaving resolved → active again.
 * Other transitions leave pin/active alone so a null-status past incident
 * is not reactivated just because the form defaulted a status.
 * @param {object} bean Incident bean or plain object
 * @param {string} newStatus Status from the UI
 * @returns {object} Same bean
 */
function applyIncidentStatus(bean, newStatus) {
    if (!newStatus || !VALID_INCIDENT_STATUSES.includes(newStatus)) {
        return bean;
    }

    const oldStatus = bean.status;
    bean.status = newStatus;

    if (oldStatus && oldStatus !== newStatus) {
        // Parsed by localizeIncidentStamps (src/util-incident-history.js); keep the format in sync.
        const timestamp = dayjs.utc().format("MMM D, HH:mm [UTC]");
        const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        bean.content += `\n\n---\n**[${timestamp}] ${label}**`;
    }

    if (newStatus === "resolved") {
        bean.active = false;
        bean.pin = false;
    } else if (oldStatus === "resolved") {
        bean.active = true;
    }

    return bean;
}

/**
 * Parse an admin-supplied created date for an incident.
 * @param {unknown} value UTC date from the edit form, empty to keep the current one
 * @returns {string|null} DB datetime, or null when empty
 * @throws {Error} If the date is malformed or in the future
 */
function parseIncidentCreatedDate(value) {
    if (!value) {
        return null;
    }
    const date = typeof value === "string" ? dayjs.utc(value) : null;
    // Agentic Rule (ARNIE_INPUT_PARAMETER_VALIDATION): only a real, non-future date string is stored.
    if (!date?.isValid() || date.isAfter(dayjs.utc().add(5, "minute"))) {
        throw new Error("Created time must be a valid date, not in the future");
    }
    return R.isoDateTime(date);
}

class Incident extends BeanModel {
    /**
     * Set created_date from the edit form; empty keeps the current value.
     * @param {unknown} value UTC date from the edit form
     * @returns {void}
     * @throws {Error} If the date is malformed or in the future
     */
    applyCreatedDate(value) {
        const createdDate = parseIncidentCreatedDate(value);
        if (createdDate) {
            this.created_date = createdDate;
        }
    }

    /**
     * Apply a public incident status and keep pin/active in sync.
     * @param {string} newStatus Status value from the UI
     * @returns {void}
     */
    applyStatus(newStatus) {
        applyIncidentStatus(this, newStatus);
    }

    /**
     * Resolve the incident and mark it as inactive
     * @returns {Promise<void>}
     */
    async resolve() {
        this.applyStatus("resolved");
        this.last_updated_date = R.isoDateTime(dayjs.utc());
        await R.store(this);
    }

    /**
     * Return an object that ready to parse to JSON for public
     * @returns {object} Object ready to parse
     */
    toPublicJSON() {
        return {
            id: this.id,
            style: this.style,
            title: this.title,
            content: this.content,
            pin: !!this.pin,
            active: !!this.active,
            createdDate: this.created_date,
            lastUpdatedDate: this.last_updated_date,
            status_page_id: this.status_page_id,
            status: this.status || null,
        };
    }
}

Incident.applyIncidentStatus = applyIncidentStatus;
Incident.parseCreatedDate = parseIncidentCreatedDate;
Incident.VALID_STATUSES = VALID_INCIDENT_STATUSES;

module.exports = Incident;
