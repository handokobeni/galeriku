import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { searchMedia } from "@/features/search/services/search.service";
import { SearchBar } from "@/features/search/components/search-bar";
import { SearchResults } from "@/features/search/components/search-results";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const session = await getSessionWithRole();
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const results = q ? await searchMedia(q, session.user.id, userRole) : [];

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-10 lg:mb-14">
        <p className="label-eyebrow mb-4">✦ 03 — Search</p>
        <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[0.95] text-foreground">
          Find a <em className="italic font-light text-primary">moment</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground italic">
          Search across all your photos and videos
        </p>
        <div className="divider-gold mt-8 mb-8" />
        <SearchBar />
      </header>
      {q && <SearchResults results={results} query={q} />}
    </div>
  );
}
