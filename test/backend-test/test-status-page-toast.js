const { describe, test } = require("node:test");
const assert = require("node:assert");

describe("util-status-page-toast", async () => {
    const { isStatusPagePath, shouldToastHeartbeat, STATUS_PAGE_PATHS } =
        await import("../../src/util-status-page-toast.js");

    test("isStatusPagePath matches public status routes only", () => {
        assert.strictEqual(isStatusPagePath("/"), true);
        assert.strictEqual(isStatusPagePath("/status/default"), true);
        assert.strictEqual(isStatusPagePath("/status-page"), true);
        assert.strictEqual(isStatusPagePath("/dashboard"), false);
        assert.strictEqual(isStatusPagePath("/manage-status-page"), false);
        assert.ok(STATUS_PAGE_PATHS.length > 0);
    });

    test("shouldToastHeartbeat allows every monitor on the dashboard", () => {
        assert.strictEqual(shouldToastHeartbeat("/dashboard", {}, 99), true);
        assert.strictEqual(shouldToastHeartbeat("/list", { 1: { id: 1 } }, 99), true);
    });

    test("shouldToastHeartbeat on a status page only allows listed monitors", () => {
        const publicMonitorList = { 7: { id: 7, name: "GitLab" } };
        assert.strictEqual(shouldToastHeartbeat("/", publicMonitorList, 7), true);
        assert.strictEqual(shouldToastHeartbeat("/", publicMonitorList, "7"), true);
        assert.strictEqual(shouldToastHeartbeat("/", publicMonitorList, 42), false);
        assert.strictEqual(shouldToastHeartbeat("/status/default", {}, 7), false);
        assert.strictEqual(shouldToastHeartbeat("/", null, 7), false);
    });
});
