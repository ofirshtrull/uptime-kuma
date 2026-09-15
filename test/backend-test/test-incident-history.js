const { describe, test } = require("node:test");
const assert = require("node:assert");

describe("util-incident-history", async () => {
    const { upsertIncident, removeIncident, isActivePinned } = await import("../../src/util-incident-history.js");

    test("upsertIncident inserts a new incident at the front", () => {
        const existing = [{ id: 1, title: "old", active: false, pin: false }];
        const created = { id: 2, title: "new", active: true, pin: true };
        const next = upsertIncident(existing, created);
        assert.deepStrictEqual(
            next.map((i) => i.id),
            [2, 1]
        );
        assert.strictEqual(existing[0].id, 1);
    });

    test("upsertIncident replaces a resolved incident in place", () => {
        const existing = [
            { id: 7, title: "outage", active: true, pin: true, style: "warning" },
            { id: 3, title: "old", active: false, pin: false },
        ];
        const resolved = { id: 7, title: "outage", active: false, pin: false, style: "warning", status: "resolved" };
        const next = upsertIncident(existing, resolved);
        assert.strictEqual(next[0].active, false);
        assert.strictEqual(next[0].pin, false);
        assert.strictEqual(next[0].status, "resolved");
        assert.strictEqual(next[1].id, 3);
    });

    test("upsertIncident ignores payloads without an id", () => {
        const existing = [{ id: 1 }];
        assert.deepStrictEqual(upsertIncident(existing, { title: "nope" }), existing);
        assert.deepStrictEqual(upsertIncident(null, null), []);
    });

    test("removeIncident drops by id", () => {
        const existing = [{ id: 1 }, { id: 2 }];
        assert.deepStrictEqual(removeIncident(existing, 1), [{ id: 2 }]);
        assert.deepStrictEqual(removeIncident(existing, null), existing);
    });

    test("upsert of a resolved incident removes it from the banner filter", () => {
        const existing = [{ id: 7, title: "outage", active: true, pin: true, style: "warning" }];
        const resolved = {
            id: 7,
            title: "outage",
            active: false,
            pin: false,
            style: "warning",
            status: "resolved",
        };
        const next = upsertIncident(existing, resolved);
        assert.strictEqual(next.filter(isActivePinned).length, 0);
        assert.strictEqual(isActivePinned(resolved), false);
        assert.strictEqual(isActivePinned({ active: true, pin: true }), true);
    });
});
