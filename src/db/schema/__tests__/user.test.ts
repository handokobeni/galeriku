import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { user, session, account, verification, userRelations, sessionRelations, accountRelations } from "../user";
import { appSettings } from "../app-settings";

describe("Database schema", () => {
  describe("user table", () => {
    it("has correct table name", () => {
      expect(getTableName(user)).toBe("user");
    });

    it("has all required columns", () => {
      const columns = getTableColumns(user);
      expect(columns).toHaveProperty("id");
      expect(columns).toHaveProperty("email");
      expect(columns).toHaveProperty("username");
      expect(columns).toHaveProperty("name");
      expect(columns).toHaveProperty("role");
      expect(columns).toHaveProperty("emailVerified");
      expect(columns).toHaveProperty("image");
      expect(columns).toHaveProperty("createdAt");
      expect(columns).toHaveProperty("updatedAt");
    });
  });

  describe("session table", () => {
    it("has correct table name", () => {
      expect(getTableName(session)).toBe("session");
    });

    it("has all required columns", () => {
      const columns = getTableColumns(session);
      expect(columns).toHaveProperty("id");
      expect(columns).toHaveProperty("token");
      expect(columns).toHaveProperty("userId");
      expect(columns).toHaveProperty("expiresAt");
      expect(columns).toHaveProperty("ipAddress");
      expect(columns).toHaveProperty("userAgent");
      expect(columns).toHaveProperty("createdAt");
      expect(columns).toHaveProperty("updatedAt");
    });
  });

  describe("account table", () => {
    it("has correct table name", () => {
      expect(getTableName(account)).toBe("account");
    });

    it("has all required columns", () => {
      const columns = getTableColumns(account);
      expect(columns).toHaveProperty("id");
      expect(columns).toHaveProperty("accountId");
      expect(columns).toHaveProperty("providerId");
      expect(columns).toHaveProperty("userId");
      expect(columns).toHaveProperty("password");
      expect(columns).toHaveProperty("accessToken");
      expect(columns).toHaveProperty("refreshToken");
      expect(columns).toHaveProperty("idToken");
      expect(columns).toHaveProperty("scope");
      expect(columns).toHaveProperty("createdAt");
      expect(columns).toHaveProperty("updatedAt");
    });
  });

  describe("verification table", () => {
    it("has correct table name", () => {
      expect(getTableName(verification)).toBe("verification");
    });

    it("has all required columns", () => {
      const columns = getTableColumns(verification);
      expect(columns).toHaveProperty("id");
      expect(columns).toHaveProperty("identifier");
      expect(columns).toHaveProperty("value");
      expect(columns).toHaveProperty("expiresAt");
      expect(columns).toHaveProperty("createdAt");
      expect(columns).toHaveProperty("updatedAt");
    });
  });

  describe("app_settings table", () => {
    it("has correct table name", () => {
      expect(getTableName(appSettings)).toBe("app_settings");
    });

    it("has all required columns", () => {
      const columns = getTableColumns(appSettings);
      expect(columns).toHaveProperty("key");
      expect(columns).toHaveProperty("value");
      expect(columns).toHaveProperty("updatedAt");
    });
  });

  describe("relations", () => {
    it("exports user relations", () => {
      expect(userRelations).toBeDefined();
    });

    it("exports session relations", () => {
      expect(sessionRelations).toBeDefined();
    });

    it("exports account relations", () => {
      expect(accountRelations).toBeDefined();
    });
  });
});
