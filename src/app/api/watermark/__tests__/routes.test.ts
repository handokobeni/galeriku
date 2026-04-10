import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/features/auth/lib/session", () => ({
  getSessionWithRole: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "owner" },
    session: { id: "session-1" },
  }),
}));

// Mock upload-logo
vi.mock("@/features/watermark/server/upload-logo", () => ({
  uploadLogo: vi.fn().mockResolvedValue({ ok: true, r2Key: "watermarks/s1/logo.png" }),
}));

// Mock preview-watermark
vi.mock("@/features/watermark/server/preview-watermark", () => ({
  previewWatermark: vi.fn().mockResolvedValue(Buffer.from("jpeg")),
}));

// Mock job-store
vi.mock("@/features/watermark/lib/job-store", () => ({
  getJob: vi.fn(),
}));

// Mock R2
vi.mock("@/shared/lib/r2", () => ({
  getObject: vi.fn(),
  deleteObject: vi.fn(),
  getViewPresignedUrl: vi.fn(),
}));

// Mock db
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock db schema
vi.mock("@/db/schema", () => ({
  appSettings: { key: "key" },
  album: { id: "id", createdBy: "created_by" },
  media: { id: "id", albumId: "album_id", r2Key: "r2_key" },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

// Mock S3
vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client {
    send = vi.fn().mockResolvedValue({});
  }
  class MockPutObjectCommand {
    constructor(public input: any) {}
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
  };
});

import { getSessionWithRole } from "@/features/auth/lib/session";
import { getJob } from "@/features/watermark/lib/job-store";
import { uploadLogo } from "@/features/watermark/server/upload-logo";
import { previewWatermark } from "@/features/watermark/server/preview-watermark";
import { db } from "@/db";

describe("watermark API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth mock default
    vi.mocked(getSessionWithRole).mockResolvedValue({
      user: { id: "user-1", role: "owner" } as any,
      session: { id: "session-1" } as any,
    });
  });

  describe("GET /api/watermark/status/[jobId]", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSessionWithRole).mockResolvedValue(null);
      const { GET } = await import("@/app/api/watermark/status/[jobId]/route");
      const req = new Request("http://localhost/api/watermark/status/album-1");
      const response = await GET(req, { params: Promise.resolve({ jobId: "album-1" }) });
      expect(response.status).toBe(401);
    });

    it("returns 404 for non-existent job", async () => {
      vi.mocked(getJob).mockReturnValue(undefined);

      const { GET } = await import("@/app/api/watermark/status/[jobId]/route");
      const req = new Request("http://localhost/api/watermark/status/album-99");
      const response = await GET(req, { params: Promise.resolve({ jobId: "album-99" }) });
      expect(response.status).toBe(404);
    });

    it("returns job status JSON", async () => {
      vi.mocked(getJob).mockReturnValue({
        albumId: "album-1",
        total: 10,
        done: 5,
        status: "processing",
        skipped: [],
      });

      const { GET } = await import("@/app/api/watermark/status/[jobId]/route");
      const req = new Request("http://localhost/api/watermark/status/album-1");
      const response = await GET(req, { params: Promise.resolve({ jobId: "album-1" }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.total).toBe(10);
      expect(body.done).toBe(5);
      expect(body.status).toBe("processing");
    });
  });

  describe("POST /api/watermark/logo", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSessionWithRole).mockResolvedValue(null);

      const { POST } = await import("@/app/api/watermark/logo/route");
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "logo.png");
      const req = new Request("http://localhost/api/watermark/logo", {
        method: "POST",
        body: formData,
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("returns 400 when no file provided", async () => {
      const { POST } = await import("@/app/api/watermark/logo/route");
      const formData = new FormData();
      const req = new Request("http://localhost/api/watermark/logo", {
        method: "POST",
        body: formData,
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("returns success when valid file is uploaded", async () => {
      vi.mocked(uploadLogo).mockResolvedValue({ ok: true, r2Key: "watermarks/s1/logo.png" });
      vi.mocked(db.limit as any).mockResolvedValue([]);

      const { POST } = await import("@/app/api/watermark/logo/route");
      const formData = new FormData();
      formData.append("file", new Blob(["png-content"]), "logo.png");
      const req = new Request("http://localhost/api/watermark/logo", {
        method: "POST",
        body: formData,
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.r2Key).toBe("watermarks/s1/logo.png");
    });

    it("returns 400 when upload fails", async () => {
      vi.mocked(uploadLogo).mockResolvedValue({ ok: false, reason: "File is not a valid PNG" });
      vi.mocked(db.limit as any).mockResolvedValue([]);

      const { POST } = await import("@/app/api/watermark/logo/route");
      const formData = new FormData();
      formData.append("file", new Blob(["not-png"]), "logo.png");
      const req = new Request("http://localhost/api/watermark/logo", {
        method: "POST",
        body: formData,
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("File is not a valid PNG");
    });
  });

  describe("POST /api/watermark/preview", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSessionWithRole).mockResolvedValue(null);

      const { POST } = await import("@/app/api/watermark/preview/route");
      const req = new Request("http://localhost/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: "album-1" }),
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("returns 400 when albumId is missing", async () => {
      const { POST } = await import("@/app/api/watermark/preview/route");
      const req = new Request("http://localhost/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("returns 404 when no media found", async () => {
      // First limit() = album ownership check → found
      // Second limit() = media lookup → not found
      vi.mocked(db.limit as any)
        .mockResolvedValueOnce([{ createdBy: "user-1" }])
        .mockResolvedValueOnce([]);

      const { POST } = await import("@/app/api/watermark/preview/route");
      const req = new Request("http://localhost/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: "album-1" }),
      });
      const response = await POST(req);
      expect(response.status).toBe(404);
    });

    it("returns image/jpeg when preview succeeds", async () => {
      vi.mocked(db.limit as any)
        .mockResolvedValueOnce([{ createdBy: "user-1" }])
        .mockResolvedValueOnce([
          { id: "media-1", albumId: "album-1", r2Key: "albums/a1/media-1.jpg" },
        ]);
      vi.mocked(previewWatermark).mockResolvedValue(Buffer.from("jpeg-data"));

      const { POST } = await import("@/app/api/watermark/preview/route");
      const req = new Request("http://localhost/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: "album-1" }),
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    });

    it("returns 500 when preview fails", async () => {
      vi.mocked(db.limit as any)
        .mockResolvedValueOnce([{ createdBy: "user-1" }])
        .mockResolvedValueOnce([
          { id: "media-1", albumId: "album-1", r2Key: "albums/a1/media-1.jpg" },
        ]);
      vi.mocked(previewWatermark).mockRejectedValue(new Error("No logo uploaded"));

      const { POST } = await import("@/app/api/watermark/preview/route");
      const req = new Request("http://localhost/api/watermark/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: "album-1" }),
      });
      const response = await POST(req);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("No logo uploaded");
    });
  });
});
