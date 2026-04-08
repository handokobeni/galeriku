import type { ReactNode } from "react";

export default async function GuestLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <link rel="manifest" href={`/g/${slug}/manifest.webmanifest`} />
      <meta name="theme-color" content="#FAF7F2" />
      <div className="min-h-svh bg-[#FAF7F2] text-[#1A1A1A]">{children}</div>
    </>
  );
}
