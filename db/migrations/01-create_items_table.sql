/* This is an example of an SQL DDL migration. It creates an `items` table and
 * then calls an `electric.electrify` procedure to expose the table to the
 * ElectricSQL replication machinery.
 *
 * Note that these statements are applied directly to the *Postgres* database.
 * Electric then handles keeping the local SQLite database schema in sync with
 * the electrified subset of your Postgres database schema.
 *
 * See https://electric-sql.com/docs/usage/data-modelling for more information.
 */

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
ALTER TABLE lists ENABLE ELECTRIC;

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY NOT NULL,
  task TEXT NOT NULL,
  done BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE
);
ALTER TABLE items ENABLE ELECTRIC;
