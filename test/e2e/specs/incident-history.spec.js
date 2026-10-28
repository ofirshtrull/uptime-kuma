import { expect, test } from "@playwright/test";
import { login, restoreSqliteSnapshot, screenshot } from "../util-test";

test.describe("Incident History", () => {
    test.beforeEach(async ({ page }) => {
        await restoreSqliteSnapshot(page);
    });

    test("past incidents section is hidden when no incidents exist", async ({ page }, testInfo) => {
        test.setTimeout(60000);

        await page.goto("./add");
        await login(page);
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();

        await page.goto("./add-status-page");
        await page.getByTestId("name-input").fill("Empty Test");
        await page.getByTestId("slug-input").fill("empty-test");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/empty-test?edit");

        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        const pastIncidentsSection = page.locator(".past-incidents-section");
        await expect(pastIncidentsSection).toHaveCount(0);

        await screenshot(testInfo, page);
    });

    test("active pinned incidents are shown at top and not in past incidents", async ({ page }, testInfo) => {
        test.setTimeout(60000);

        await page.goto("./add");
        await login(page);
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();

        await page.goto("./add-status-page");
        await page.getByTestId("name-input").fill("Dedup Test");
        await page.getByTestId("slug-input").fill("dedup-test");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/dedup-test?edit");

        await page.getByTestId("create-incident-button").click();
        await page.getByTestId("incident-title").fill("Active Incident");
        await page.getByTestId("incident-content-editable").fill("This is an active incident");
        await page.getByTestId("post-incident-button").click();

        await page.waitForTimeout(500);

        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        const activeIncident = page.getByTestId("incident").filter({ hasText: "Active Incident" });
        await expect(activeIncident).toBeVisible();

        const pastIncidentsSection = page.locator(".past-incidents-section");
        await expect(pastIncidentsSection).toHaveCount(0);

        await screenshot(testInfo, page);
    });

    test("resolved incidents appear in past incidents section", async ({ page }, testInfo) => {
        test.setTimeout(120000);

        await page.goto("./add");
        await login(page);
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();

        await page.goto("./add-status-page");
        await page.getByTestId("name-input").fill("Resolve Test");
        await page.getByTestId("slug-input").fill("resolve-test");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/resolve-test?edit");

        await page.getByTestId("create-incident-button").click();
        await page.getByTestId("incident-title").fill("Resolved Incident");
        await page.getByTestId("incident-content-editable").fill("This incident will be resolved");
        await page.getByTestId("post-incident-button").click();

        await page.waitForTimeout(500);

        const activeIncidentBanner = page.getByTestId("incident").filter({ hasText: "Resolved Incident" });
        await expect(activeIncidentBanner).toBeVisible({ timeout: 10000 });

        const resolveButton = activeIncidentBanner.locator("button", { hasText: "Resolve" });
        await expect(resolveButton).toBeVisible();
        await resolveButton.click();

        await expect(activeIncidentBanner).toHaveCount(0, { timeout: 10000 });

        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        await page.goto("./status/resolve-test");
        await page.waitForLoadState("networkidle");

        const pastIncidentsSection = page.locator(".past-incidents-section");
        await expect(pastIncidentsSection).toBeVisible({ timeout: 15000 });

        const resolvedIncidentTitle = pastIncidentsSection.locator(".incident-title");
        await expect(resolvedIncidentTitle).toContainText("Resolved Incident", { timeout: 15000 });

        await screenshot(testInfo, page);
    });

    test("incidents from the last 30 days share one page", async ({ page }, testInfo) => {
        test.setTimeout(180000);

        await page.goto("./add");
        await login(page);
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();

        await page.goto("./add-status-page");
        await page.getByTestId("name-input").fill("Pagination Test");
        await page.getByTestId("slug-input").fill("pagination-test");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/pagination-test?edit");

        for (let i = 1; i <= 12; i++) {
            await page.getByTestId("create-incident-button").click();
            await page.getByTestId("incident-title").fill("Incident " + i);
            await page.getByTestId("incident-content-editable").fill("Content for incident " + i);
            await page.getByTestId("post-incident-button").click();

            const banner = page.getByTestId("incident").filter({ hasText: "Content for incident " + i });
            await banner.locator("button", { hasText: "Resolve" }).click();
            await expect(banner).toHaveCount(0, { timeout: 10000 });
        }

        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        await page.goto("./status/pagination-test");
        const pastIncidentsSection = page.locator(".past-incidents-section");
        await expect(pastIncidentsSection.locator(".incident-title")).toHaveCount(12, { timeout: 15000 });
        await expect(page.getByTestId("incident-history-pager")).toHaveCount(0);

        await screenshot(testInfo, page);
    });

    test("backdated incident moves to an older 30-day page", async ({ page }, testInfo) => {
        test.setTimeout(120000);

        await page.goto("./add");
        await login(page);
        await expect(page.getByTestId("monitor-type-select")).toBeVisible();

        await page.goto("./add-status-page");
        await page.getByTestId("name-input").fill("Backdate Test");
        await page.getByTestId("slug-input").fill("backdate-test");
        await page.getByTestId("submit-button").click();
        await page.waitForURL("/status/backdate-test?edit");

        // datetime-local value in Eastern time, e.g. "2026-09-13T10:00"
        const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
            .toLocaleString("sv-SE", { timeZone: "America/New_York" })
            .slice(0, 16)
            .replace(" ", "T");

        await page.getByTestId("create-incident-button").click();
        await page.getByTestId("incident-title").fill("Backdated Incident");
        await page.getByTestId("incident-content-editable").fill("Happened last month");
        await page.getByTestId("incident-created-input").fill(fortyFiveDaysAgo);
        await page.getByTestId("post-incident-button").click();

        const banner = page.getByTestId("incident").filter({ hasText: "Backdated Incident" });
        await banner.locator("button", { hasText: "Resolve" }).click();
        await expect(banner).toHaveCount(0, { timeout: 10000 });
        await expect(page.locator(".past-incidents-section")).toContainText("No incidents reported in this period.");

        await page.getByTestId("save-button").click();
        await expect(page.getByTestId("edit-sidebar")).toHaveCount(0);

        await page.goto("./status/backdate-test");
        const pastIncidentsSection = page.locator(".past-incidents-section");
        await expect(pastIncidentsSection).toContainText("No incidents reported in this period.", { timeout: 15000 });

        await page.getByTestId("incident-history-pager").getByRole("button", { name: /Older/ }).click();
        await expect(pastIncidentsSection.locator(".incident-title")).toHaveText(["Backdated Incident"]);

        await screenshot(testInfo, page);
    });
});
