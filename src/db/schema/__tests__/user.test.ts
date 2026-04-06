import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import { user, session, account, verification } from "../user";
import { appSettings } from "../app-settings";

describe("Database schema", () => {
  it("user table has correct name", () => {
    expect(getTableName(user)).toBe("user");
  });

  it("session table has correct name", () => {
    expect(getTableName(session)).toBe("session");
  });

  it("account table has correct name", () => {
    expect(getTableName(account)).toBe("account");
  });

  it("verification table has correct name", () => {
    expect(getTableName(verification)).toBe("verification");
  });

  it("app_settings table has correct name", () => {
    expect(getTableName(appSettings)).toBe("app_settings");
  });

  it("user table has required columns", () => {
    const columns = Object.keys(user);
    expect(columns).toContain("id");
    expect(columns).toContain("email");
    expect(columns).toContain("username");
    expect(columns).toContain("name");
    expect(columns).toContain("role");
    expect(columns).toContain("emailVerified");
  });

  it("session table has token column", () => {
    const columns = Object.keys(session);
    expect(columns).toContain("token");
    expect(columns).toContain("userId");
    expect(columns).toContain("expiresAt");
  });
});
