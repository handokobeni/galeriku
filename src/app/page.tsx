import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Users,
  Smartphone,
  Cloud,
  Heart,
  Search,
  ImageIcon,
  ArrowRight,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default async function HomePage() {
  // If logged in, skip the landing and go straight to /albums
  const session = await getSessionWithRole();
  if (session) redirect("/albums");

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Galeriku
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/handokobeni/galeriku"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-2"
              aria-label="GitHub"
            >
              <GithubIcon className="size-5" />
            </a>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Lock className="size-3" />
            Privacy-first photo gallery
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Your family memories,{" "}
            <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              without Google watching
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            A modern, self-hostable photo & video gallery built for families and
            small communities. Share specific albums with specific people. No AI
            scanning. No tracking.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="rounded-xl">
                Get Started
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
            <a
              href="https://github.com/handokobeni/galeriku"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="rounded-xl">
                <GithubIcon className="size-4 mr-2" />
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              Built for families, not advertisers
            </h2>
            <p className="text-muted-foreground">
              Everything you need to share memories privately
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Lock}
              title="Privacy first"
              description="Files stored in your own Cloudflare R2. No AI scans, no analytics. Your photos stay yours."
            />
            <FeatureCard
              icon={Users}
              title="Per-album sharing"
              description="Invite specific people to specific albums. Mom sees family photos, friends see vacation photos."
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile-first PWA"
              description="Install on your phone like a native app. Offline support included."
            />
            <FeatureCard
              icon={ImageIcon}
              title="Photos & videos"
              description="Upload up to 20MB photos and 500MB videos. Auto-thumbnails generated client-side."
            />
            <FeatureCard
              icon={Heart}
              title="Comments & favorites"
              description="React to memories with comments and favorites. Tag photos for easy organization."
            />
            <FeatureCard
              icon={Search}
              title="Full-text search"
              description="Find photos by filename, album name, or tag. No AI required."
            />
          </div>
        </div>
      </section>

      {/* Why Galeriku */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-8 text-center">
            Why not just use Google Photos?
          </h2>
          <div className="space-y-4">
            <ComparisonRow
              option="Google Photos"
              pros="Free, AI search, automatic backup"
              cons="Google scans every face, every object, every location"
            />
            <ComparisonRow
              option="iCloud"
              pros="Seamless on Apple devices"
              cons="Locked into Apple ecosystem, expensive at scale"
            />
            <ComparisonRow
              option="WhatsApp / Telegram"
              pros="Easy to share"
              cons="Compressed to oblivion, no organization"
            />
            <ComparisonRow
              option="Galeriku"
              pros="Private, organized, self-hostable, free to start"
              cons="Need to set up your own R2 bucket"
              highlighted
            />
          </div>
        </div>
      </section>

      {/* Self-host CTA */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <Cloud className="size-12 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">
            Free to self-host
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Deploy to Vercel + Cloudflare R2 + Neon Postgres — all on free
            tiers. Your data, your server, your rules.
          </p>
          <a
            href="https://github.com/handokobeni/galeriku#self-hosting"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline" className="rounded-xl">
              Self-hosting guide
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Made with ❤️ in Indonesia. Open source under MIT.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/handokobeni/galeriku"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function ComparisonRow({
  option,
  pros,
  cons,
  highlighted,
}: {
  option: string;
  pros: string;
  cons: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <h3 className={`font-semibold mb-2 ${highlighted ? "text-primary" : ""}`}>
        {option}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">✓</span> {pros}
        </p>
        <p className="text-muted-foreground">
          <span className="text-amber-600 dark:text-amber-400">!</span> {cons}
        </p>
      </div>
    </div>
  );
}
