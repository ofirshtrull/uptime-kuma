const { describe, test } = require("node:test");
const assert = require("node:assert");
const dayjs = require("dayjs");
const Incident = require("../../server/model/incident");

dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("../../server/modules/dayjs/plugin/timezone"));

describe("util-incident-history", async () => {
    const { removeIncident, isActivePinned } = await import("../../src/util-incident-history.js");

    test("removeIncident drops by id", () => {
        const existing = [{ id: 1 }, { id: 2 }];
        assert.deepStrictEqual(removeIncident(existing, 1), [{ id: 2 }]);
        assert.deepStrictEqual(removeIncident(existing, null), existing);
    });

    test("resolved incidents fail the banner filter", () => {
        const resolved = { id: 7, active: false, pin: false, status: "resolved" };
        assert.strictEqual(isActivePinned(resolved), false);
        assert.strictEqual(isActivePinned({ active: true, pin: false }), false);
        assert.strictEqual(isActivePinned({ active: true, pin: true }), true);
    });
});

describe("status page Eastern time", async () => {
    const { formatStatusTime, localizeIncidentStamps, toStatusInputTime, fromStatusInputTime } =
        await import("../../src/util-incident-history.js");

    test("formatStatusTime shows DB UTC times in Eastern with the DST abbreviation", () => {
        assert.strictEqual(formatStatusTime("2026-10-28 14:08:56"), "2026-10-28 10:08:56 EDT");
        assert.strictEqual(formatStatusTime("2026-12-01 14:08:56"), "2026-12-01 09:08:56 EST");
        assert.strictEqual(formatStatusTime("2026-10-28T14:08:56.000Z"), "2026-10-28 10:08:56 EDT");
        assert.strictEqual(formatStatusTime(null), "");
        assert.strictEqual(formatStatusTime("garbage"), "");
    });

    test("datetime-local values round-trip through Eastern time", () => {
        assert.strictEqual(toStatusInputTime("2026-10-28 14:08:56"), "2026-10-28T10:08");
        assert.strictEqual(fromStatusInputTime("2026-10-28T10:08"), "2026-10-28 14:08:00");
        assert.strictEqual(toStatusInputTime("2026-12-01 14:08:00"), "2026-12-01T09:08");
        assert.strictEqual(fromStatusInputTime("2026-12-01T09:08"), "2026-12-01 14:08:00");
        assert.strictEqual(toStatusInputTime(""), "");
        assert.strictEqual(fromStatusInputTime(""), "");
    });

    test("localizeIncidentStamps converts each stamp with its own DST offset", () => {
        const content = "Outage\n\n---\n**[Oct 28, 13:40 UTC] Monitoring**\n\n---\n**[Nov 2, 15:05 UTC] Resolved**";
        assert.strictEqual(
            localizeIncidentStamps(content, "2026-10-28 13:00:00"),
            "Outage\n\n---\n**[Oct 28, 09:40 EDT] Monitoring**\n\n---\n**[Nov 2, 10:05 EST] Resolved**"
        );
    });

    test("localizeIncidentStamps leaves non-stamp brackets alone", () => {
        const content = "[Foo 1, 10:00 UTC] [Oct 28, 13:40 PST] [link](https://example.com)";
        assert.strictEqual(localizeIncidentStamps(content, "2026-10-28 13:00:00"), content);
    });

    test("stamps written by applyIncidentStatus are converted", () => {
        const bean = { status: "investigating", content: "Initial" };
        Incident.applyIncidentStatus(bean, "monitoring");
        const out = localizeIncidentStamps(bean.content, dayjs.utc().format("YYYY-MM-DD HH:mm:ss"));
        assert.doesNotMatch(out, /UTC\]/);
        assert.match(out, /\*\*\[[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2} E[SD]T\] Monitoring\*\*/);
    });
});
