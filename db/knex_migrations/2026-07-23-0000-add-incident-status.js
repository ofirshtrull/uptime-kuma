/**
 * Add incident.status for MariaDB / embedded-MariaDB installs.
 *
 * The original change only registered patch-incident-status.sql in the
 * SQLite-only patchList (see Database.patchSqlite2). MariaDB upgrades never
 * ran that file, so existing status pages hit:
 *   Unknown column 'status' in 'SET'
 *
 * Idempotent so SQLite installs that already applied the old SQL patch are safe.
 */
exports.up = async function (knex) {
    const hasColumn = await knex.schema.hasColumn("incident", "status");
    if (!hasColumn) {
        await knex.schema.alterTable("incident", (table) => {
            table.string("status", 30);
        });
    }
};

exports.down = async function (knex) {
    const hasColumn = await knex.schema.hasColumn("incident", "status");
    if (hasColumn) {
        await knex.schema.alterTable("incident", (table) => {
            table.dropColumn("status");
        });
    }
};
