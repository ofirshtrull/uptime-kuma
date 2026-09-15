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

class Incident extends BeanModel {
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
Incident.VALID_STATUSES = VALID_INCIDENT_STATUSES;

module.exports = Incident;
