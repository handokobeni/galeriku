import { describe, expect, it, beforeEach } from "vitest";
import {
  createJob,
  getJob,
  updateJob,
  deleteJob,
  type WatermarkJob,
} from "../job-store";

describe("job-store", () => {
  const albumId = "album-123";

  beforeEach(() => {
    // Clean up any existing job
    deleteJob(albumId);
  });

  it("createJob returns a job with initial state", () => {
    const job = createJob(albumId, 10);
    expect(job.albumId).toBe(albumId);
    expect(job.total).toBe(10);
    expect(job.done).toBe(0);
    expect(job.status).toBe("processing");
    expect(job.skipped).toEqual([]);
    expect(job.error).toBeUndefined();
  });

  it("getJob returns the created job", () => {
    createJob(albumId, 5);
    const job = getJob(albumId);
    expect(job).toBeDefined();
    expect(job!.albumId).toBe(albumId);
  });

  it("getJob returns undefined for non-existent job", () => {
    expect(getJob("non-existent")).toBeUndefined();
  });

  it("updateJob merges partial updates", () => {
    createJob(albumId, 10);
    updateJob(albumId, { done: 5 });
    const job = getJob(albumId);
    expect(job!.done).toBe(5);
    expect(job!.status).toBe("processing");
  });

  it("updateJob can set status to completed", () => {
    createJob(albumId, 3);
    updateJob(albumId, { done: 3, status: "completed" });
    const job = getJob(albumId);
    expect(job!.status).toBe("completed");
    expect(job!.done).toBe(3);
  });

  it("updateJob can set status to failed with error", () => {
    createJob(albumId, 3);
    updateJob(albumId, { status: "failed", error: "R2 unreachable" });
    const job = getJob(albumId);
    expect(job!.status).toBe("failed");
    expect(job!.error).toBe("R2 unreachable");
  });

  it("updateJob appends to skipped array via custom logic", () => {
    createJob(albumId, 5);
    const job = getJob(albumId)!;
    job.skipped.push("media-1");
    updateJob(albumId, { skipped: job.skipped });
    expect(getJob(albumId)!.skipped).toEqual(["media-1"]);
  });

  it("deleteJob removes the job", () => {
    createJob(albumId, 5);
    deleteJob(albumId);
    expect(getJob(albumId)).toBeUndefined();
  });

  it("createJob overwrites existing job for same albumId (dedup)", () => {
    createJob(albumId, 10);
    updateJob(albumId, { done: 5 });
    const newJob = createJob(albumId, 20);
    expect(newJob.total).toBe(20);
    expect(newJob.done).toBe(0);
  });

  it("createJob with 0 total works", () => {
    const job = createJob(albumId, 0);
    expect(job.total).toBe(0);
  });
});
