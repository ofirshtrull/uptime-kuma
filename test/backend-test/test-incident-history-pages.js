const { describe, test, before, after } = require("node:test");
const assert = require("node:assert");
const dayjs = require("dayjs");
const knex = require("knex");
const { R } = require("redbean-node");
const Incident = require("../../server/model/incident");
const StatusPage = require("../../server/model/status_page");

dayjs.extend(require("dayjs/plugin/utc"));

describe("StatusPage.getIncidentHistory()", () => {
    before(async () => {
        const Dialect = require("knex/lib/dialects/sqlite3/index.js");
        Dialect.prototype._driver = () => require("@louislam/sqlite3");
        R.setup(knex({ client: Dialect, connection: { filename: ":memory:" }, useNullAsDefault: true }));
        R.modelList.incident = Incident;
        const { createTables } = require("../../db/knex_init_db.js");
        await createTables();

        const add = (title, daysAgo, extra = {}) =>
            R.knex("incident").insert({
                title,
                content: "x",
                style: "info",
                status_page_id: 1,
                pin: false,
                active: false,
                created_date: R.isoDateTime(dayjs.utc().subtract(daysAgo, "day")),
                ...extra,
            });
        await add("1 day", 1);
        await add("10 days", 10);
        await add("45 days", 45);
        await add("100 days, active pinned", 100, { pin: true, active: true });
        await add("200 days", 200);
        await add("other status page", 2, { status_page_id: 2 });
    });

    after(async () => {
        await R.knex.destroy();
    });

    const titles = (result) => result.incidents.map((incident) => incident.title);

    test("page 1 is the last 30 days plus active pinned incidents", async () => {
        const result = await StatusPage.getIncidentHistory(1, 1);
        assert.deepStrictEqual(titles(result), ["1 day", "10 days", "100 days, active pinned"]);
        assert.strictEqual(result.page, 1);
        assert.strictEqual(result.hasMore, true);
    });

    test("older pages cover their own 30-day window", async () => {
        const page2 = await StatusPage.getIncidentHistory(1, 2);
        assert.deepStrictEqual(titles(page2), ["45 days", "100 days, active pinned"]);
        assert.strictEqual(page2.hasMore, true);

        const page3 = await StatusPage.getIncidentHistory(1, 3);
        assert.deepStrictEqual(titles(page3), ["100 days, active pinned"]);
        assert.strictEqual(page3.hasMore, true);

        const page7 = await StatusPage.getIncidentHistory(1, 7);
        assert.deepStrictEqual(titles(page7), ["100 days, active pinned", "200 days"]);
        assert.strictEqual(page7.hasMore, false);
    });

    test("bad page values fall back to page 1 and huge ones are capped", async () => {
        for (const page of ["abc", -3, 0, undefined]) {
            assert.strictEqual((await StatusPage.getIncidentHistory(1, page)).page, 1);
        }
        assert.strictEqual((await StatusPage.getIncidentHistory(1, 99999)).page, 1000);
    });
});
