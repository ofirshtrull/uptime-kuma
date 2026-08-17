const { describe, test } = require("node:test");
const assert = require("node:assert");

describe("util-external-group", async () => {
    const {
        isExternalGroup,
        integrationStatusUrl,
        EXTERNAL_GROUP_DISPLAY_NAME,
    } = await import("../../src/util-external-group.js");

    test("isExternalGroup matches External Services and Arnica Integrations", () => {
        assert.strictEqual(isExternalGroup({ name: "External Services", monitorList: [] }), true);
        assert.strictEqual(isExternalGroup({ name: "Arnica Integrations", monitorList: [] }), true);
        assert.strictEqual(isExternalGroup({ name: "Arnica-US", monitorList: [] }), false);
        assert.strictEqual(isExternalGroup(null), false);
        assert.strictEqual(isExternalGroup({ name: "Partners", monitorList: [] }), false);
        assert.strictEqual(
            isExternalGroup({ name: "Partners", monitorList: [ { tags: undefined } ] }),
            false
        );
    });

    test("isExternalGroup matches when every monitor is tagged 3rd-party", () => {
        assert.strictEqual(
            isExternalGroup({
                name: "Partners",
                monitorList: [
                    { tags: [ { name: "3rd-party" } ] },
                    { tags: [ { name: "external" } ] },
                ],
            }),
            true
        );
        assert.strictEqual(
            isExternalGroup({
                name: "Partners",
                monitorList: [
                    { tags: [ { name: "3rd-party" } ] },
                    { tags: [ { name: "internal" } ] },
                ],
            }),
            false
        );
    });

    test("integrationStatusUrl maps known partners and ignores spaces/case", () => {
        assert.strictEqual(integrationStatusUrl("GitHub"), "https://www.githubstatus.com/");
        assert.strictEqual(integrationStatusUrl("BitBucket"), "https://bitbucket.status.atlassian.com/");
        assert.strictEqual(integrationStatusUrl("OpenAI"), "https://status.openai.com/");
        assert.strictEqual(integrationStatusUrl("NotAPartner"), null);
    });

    test("public display name is Arnica Integrations", () => {
        assert.strictEqual(EXTERNAL_GROUP_DISPLAY_NAME, "Arnica Integrations");
    });
});
