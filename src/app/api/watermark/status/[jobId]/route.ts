import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { getJob } from "@/features/watermark/lib/job-store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const session = await getSessionWithRole();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    albumId: job.albumId,
    total: job.total,
    done: job.done,
    status: job.status,
    error: job.error,
    skipped: job.skipped,
  });
}
