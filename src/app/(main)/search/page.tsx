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
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight mb-4">Search</h1>
        <SearchBar />
      </div>
      {q && <SearchResults results={results} query={q} />}
    </div>
  );
}
