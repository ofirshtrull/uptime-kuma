/** Groups whose outages are partner-owned, not Arnica-owned. */
export const EXTERNAL_GROUP_PATTERN = /external|3rd.?party|third.?party|integrations/i;

export const EXTERNAL_GROUP_DISPLAY_NAME = "Arnica Integrations";

export const EXTERNAL_GROUP_DESCRIPTION =
    "Much of Arnica's functionality requires interactions with third party services via integrations. To ensure a complete picture, below are the current status reports for the most commonly used Arnica integrations. These represent the status pages maintained by each of the integration partners.";

const INTEGRATION_STATUS_URLS = {
    github: "https://www.githubstatus.com/",
    gitlab: "https://status.gitlab.com/",
    bitbucket: "https://bitbucket.status.atlassian.com/",
    jira: "https://jira-software.status.atlassian.com/",
    slack: "https://slack-status.com/",
    stripe: "https://status.stripe.com/",
    azure: "https://azure.status.microsoft/",
    openai: "https://status.openai.com/",
};

/**
 * Determine whether a status-page group represents external / 3rd-party
 * services. Matches the group name, or every monitor carrying an
 * "external" / "3rd-party" / "integrations" tag.
 * @param {object} group Group object ({ name, monitorList })
 * @returns {boolean} True if the group is external
 */
export function isExternalGroup(group) {
    if (!group) {
        return false;
    }
    if (group.name && EXTERNAL_GROUP_PATTERN.test(group.name)) {
        return true;
    }
    const monitorList = group.monitorList || [];
    if (monitorList.length === 0) {
        return false;
    }
    return monitorList.every((monitor) =>
        (monitor.tags || []).some((tag) => EXTERNAL_GROUP_PATTERN.test(tag.name))
    );
}

/**
 * Official partner status-page URL for a monitor name, if known.
 * @param {string} name Monitor / integration name
 * @returns {string|null} Status page URL or null
 */
export function integrationStatusUrl(name) {
    if (!name) {
        return null;
    }
    const key = String(name).toLowerCase().replace(/\s+/g, "");
    return INTEGRATION_STATUS_URLS[key] || null;
}
