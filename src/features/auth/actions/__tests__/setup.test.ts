import { describe, it, expect } from "vitest";
import { z } from "zod";

// Extract the schema logic for unit testing
const setupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

describe("Setup validation schema", () => {
  it("accepts valid input", () => {
    const result = setupSchema.safeParse({
      name: "Beni Handoko",
      username: "beni_h",
      email: "beni@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = setupSchema.safeParse({
      name: "B",
      username: "beni",
      email: "beni@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short username", () => {
    const result = setupSchema.safeParse({
      name: "Beni",
      username: "be",
      email: "beni@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = setupSchema.safeParse({
      name: "Beni",
      username: "beni@h",
      email: "beni@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("allows underscores in username", () => {
    const result = setupSchema.safeParse({
      name: "Beni",
      username: "beni_handoko",
      email: "beni@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = setupSchema.safeParse({
      name: "Beni",
      username: "beni",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = setupSchema.safeParse({
      name: "Beni",
      username: "beni",
      email: "beni@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts password exactly 8 chars", () => {
    const result = setupSchema.safeParse({
      name: "Beni",
      username: "beni",
      email: "beni@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });
});
