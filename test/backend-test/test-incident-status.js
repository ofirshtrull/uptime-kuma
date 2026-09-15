const { describe, test } = require("node:test");
const assert = require("node:assert");
const Incident = require("../../server/model/incident");

describe("Incident.applyIncidentStatus", () => {
    test("resolved clears active and pin", () => {
        const bean = {
            status: "investigating",
            active: true,
            pin: true,
            content: "Outage",
        };
        Incident.applyIncidentStatus(bean, "resolved");
        assert.strictEqual(bean.status, "resolved");
        assert.strictEqual(bean.active, false);
        assert.strictEqual(bean.pin, false);
    });

    test("leaving resolved sets active true so the banner can return", () => {
        const bean = {
            status: "resolved",
            active: false,
            pin: false,
            content: "Outage",
        };
        Incident.applyIncidentStatus(bean, "investigating");
        assert.strictEqual(bean.status, "investigating");
        assert.strictEqual(bean.active, true);
    });

    test("null-status past incident is not reactivated by investigating", () => {
        const bean = {
            status: null,
            active: false,
            pin: false,
            content: "Old",
        };
        Incident.applyIncidentStatus(bean, "investigating");
        assert.strictEqual(bean.status, "investigating");
        assert.strictEqual(bean.active, false);
        assert.strictEqual(bean.pin, false);
    });

    test("status change appends a timestamp block", () => {
        const bean = { status: "investigating", content: "Initial" };
        Incident.applyIncidentStatus(bean, "identified");
        assert.match(bean.content, /\*\*\[.*\] Identified\*\*/);
        assert.ok(bean.content.startsWith("Initial"));
    });

    test("invalid status is ignored", () => {
        const bean = { status: "investigating", active: true, pin: true };
        Incident.applyIncidentStatus(bean, "bogus");
        assert.strictEqual(bean.status, "investigating");
        assert.strictEqual(bean.active, true);
    });

    test("post then resolve does not stay pinned", () => {
        const bean = { pin: true, active: true, content: "x" };
        Incident.applyIncidentStatus(bean, "resolved");
        assert.strictEqual(bean.pin, false);
        assert.strictEqual(bean.active, false);
    });
});
