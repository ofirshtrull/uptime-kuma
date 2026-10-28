const { describe, test } = require("node:test");
const assert = require("node:assert");
const dayjs = require("dayjs");
const { R } = require("redbean-node");
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

describe("Incident.parseCreatedDate", () => {
    test("empty keeps the current date", () => {
        assert.strictEqual(Incident.parseCreatedDate(""), null);
        assert.strictEqual(Incident.parseCreatedDate(undefined), null);
    });

    test("UTC input is stored in DB format", () => {
        assert.strictEqual(Incident.parseCreatedDate("2026-10-28 14:08:00"), "2026-10-28 14:08:00");
        assert.strictEqual(Incident.parseCreatedDate("2026-10-28T14:08:00.000Z"), "2026-10-28 14:08:00");
    });

    test("rejects malformed, non-string and future dates", () => {
        const future = dayjs.utc().add(1, "day").format("YYYY-MM-DD HH:mm:ss");
        for (const value of ["garbage", 1793000000000, { $gt: "" }, future]) {
            assert.throws(() => Incident.parseCreatedDate(value), /valid date/);
        }
    });

    test("applyCreatedDate only overwrites when a date is given", () => {
        const bean = new Incident("incident", R);
        bean.created_date = "2026-01-01 00:00:00";
        bean.applyCreatedDate("");
        assert.strictEqual(bean.created_date, "2026-01-01 00:00:00");
        bean.applyCreatedDate("2026-02-01 12:00:00");
        assert.strictEqual(bean.created_date, "2026-02-01 12:00:00");
    });
});
