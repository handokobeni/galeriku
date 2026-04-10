export type WatermarkJob = {
  albumId: string;
  total: number;
  done: number;
  status: "processing" | "completed" | "failed";
  error?: string;
  skipped: string[];
};

/**
 * In-memory job store. Acceptable for MVP -- data loss on restart is fine
 * because re-publish regenerates. Keyed by albumId (last job wins).
 */
const jobs = new Map<string, WatermarkJob>();

export function createJob(albumId: string, total: number): WatermarkJob {
  const job: WatermarkJob = {
    albumId,
    total,
    done: 0,
    status: "processing",
    skipped: [],
  };
  jobs.set(albumId, job);
  return job;
}

export function getJob(albumId: string): WatermarkJob | undefined {
  return jobs.get(albumId);
}

export function updateJob(
  albumId: string,
  update: Partial<Omit<WatermarkJob, "albumId">>,
): void {
  const existing = jobs.get(albumId);
  if (!existing) return;
  Object.assign(existing, update);
}

export function deleteJob(albumId: string): void {
  jobs.delete(albumId);
}
