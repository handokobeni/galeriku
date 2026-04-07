import postgres from "postgres";

function createSql() {
  return postgres(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:57432/galeriku?sslmode=disable");
}

let sql = createSql();

export async function cleanDatabase() {
  // Delete in dependency order
  await sql`DELETE FROM media_tag`;
  await sql`DELETE FROM tag`;
  await sql`DELETE FROM favorite`;
  await sql`DELETE FROM "comment"`;
  await sql`DELETE FROM media`;
  await sql`DELETE FROM album_member`;
  await sql`DELETE FROM album`;
  await sql`DELETE FROM "session"`;
  await sql`DELETE FROM account`;
  await sql`DELETE FROM "user"`;
}

export async function closeDb() {
  await sql.end();
  // Re-create for any subsequent use in the same process
  sql = createSql();
}
