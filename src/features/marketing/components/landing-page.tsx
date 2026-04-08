"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

// ──────────────────────────────────────────────────────────── ANIMATIONS

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9 } },
};

// ──────────────────────────────────────────────────────────── PHOTO LIBRARY

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=85";

const GALLERY_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80",
  "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=600&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
  "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&q=80",
];

const WATERMARK_DEMO_PHOTO =
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=85";

const CTA_PHOTO =
  "https://images.unsplash.com/photo-1606490194859-07c18c9f0968?w=2000&q=85";

// ──────────────────────────────────────────────────────────── MAIN

export function LandingPage() {
  return (
    <div
      className="min-h-svh bg-[#FAF7F2] text-[#1A1A1A] selection:bg-[#B85738] selection:text-[#FAF7F2] antialiased"
      style={{ fontFamily: "var(--font-editorial), system-ui, sans-serif" }}
    >
      <Header />
      <Hero />
      <Marquee />
      <PainPoints />
      <SampleGallery />
      <Features />
      <Testimonials />
      <Comparison />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────── HEADER

function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF7F2]/85 border-b border-[#1A1A1A]/8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-2 group"
          aria-label="Galeriku home"
        >
          <span
            className="text-2xl tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
              fontWeight: 500,
            }}
          >
            Galeriku
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase text-[#1A1A1A]/50 hidden sm:inline">
            / pro
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <a
            href="#features"
            className="hidden md:inline px-3 py-2 text-sm tracking-tight text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
          >
            Fitur
          </a>
          <a
            href="#testimonials"
            className="hidden md:inline px-3 py-2 text-sm tracking-tight text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
          >
            Cerita
          </a>
          <a
            href="#pricing"
            className="hidden md:inline px-3 py-2 text-sm tracking-tight text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
          >
            Harga
          </a>
          <Link
            href="/login"
            className="px-3 py-2 text-sm tracking-tight text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="#waitlist"
            className="ml-1 sm:ml-2 inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF7F2] px-4 py-2.5 rounded-full text-sm tracking-tight hover:bg-[#B85738] transition-colors"
          >
            Coba Gratis
            <Arrow />
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────── HERO

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 lg:pt-28 pb-20 lg:pb-32">
        {/* Eyebrow */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-4 mb-12 lg:mb-16"
        >
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#B85738] font-semibold">
            ✦ 01 — Untuk Fotografer Wedding
          </span>
          <div className="flex-1 h-px bg-[#1A1A1A]/15 max-w-[200px]" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          {/* LEFT: Big headline + photo */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="lg:col-span-8"
          >
            <motion.h1
              variants={fadeUp}
              className="text-[clamp(3rem,9vw,8.5rem)] leading-[0.92] tracking-[-0.035em] text-[#1A1A1A]"
              style={{
                fontFamily: "var(--font-display)",
                fontVariationSettings: '"opsz" 144, "SOFT" 30',
                fontWeight: 400,
              }}
            >
              Karya kamu
              <br />
              pantas{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontVariationSettings: '"opsz" 144, "SOFT" 100',
                  fontWeight: 300,
                }}
                className="text-[#B85738]"
              >
                dipamerkan
              </span>
              <br />
              dengan layak.
            </motion.h1>
          </motion.div>

          {/* RIGHT: Subtitle + CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="lg:col-span-4 lg:pb-3 space-y-7"
          >
            <motion.p
              variants={fadeUp}
              className="text-base lg:text-[17px] leading-relaxed text-[#1A1A1A]/70 max-w-sm"
            >
              <span
                className="float-left text-[3.5rem] leading-[0.85] mr-2 mt-1 text-[#B85738]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                }}
              >
                S
              </span>
              top kirim hasil wedding via Google Drive yang berantakan.
              Galeriku adalah <em>client gallery</em> profesional dengan
              watermark, branding studio, dan analytics — dalam Bahasa
              Indonesia, dengan harga lokal.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <Link
                href="#waitlist"
                className="group inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-[#FAF7F2] px-6 py-4 rounded-full text-sm tracking-tight hover:bg-[#B85738] transition-all"
              >
                Coba Gratis 14 Hari
                <Arrow nudge />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 border border-[#1A1A1A]/20 text-[#1A1A1A] px-6 py-4 rounded-full text-sm tracking-tight hover:border-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all"
              >
                Lihat Fitur
              </a>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-xs text-[#1A1A1A]/50 tracking-tight"
            >
              Tanpa kartu kredit. Setup 5 menit. Cancel kapan saja.
            </motion.p>
          </motion.div>
        </div>

        {/* Hero photo strip — full bleed underneath */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mt-16 lg:mt-24 relative aspect-[21/9] rounded-[2rem] overflow-hidden"
        >
          <Image
            src={HERO_PHOTO}
            alt="Wedding photographer at work"
            fill
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover"
            priority
          />
          {/* Vignette overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(26,26,26,0.35) 0%, transparent 50%, rgba(26,26,26,0.15) 100%)",
            }}
          />
          {/* Bottom info bar */}
          <div className="absolute bottom-0 inset-x-0 p-6 lg:p-10 flex items-end justify-between">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#FAF7F2]/70 mb-2">
                Wedding · Bali · 2024
              </p>
              <p
                className="text-2xl lg:text-3xl text-[#FAF7F2]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                Captured by your studio.
              </p>
            </div>
            <div className="hidden md:flex gap-6 text-[#FAF7F2]">
              <div>
                <div
                  className="text-3xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  14<span className="text-[#B89968]">d</span>
                </div>
                <p className="text-[10px] tracking-tight text-[#FAF7F2]/60">
                  Free trial
                </p>
              </div>
              <div className="border-l border-[#FAF7F2]/20 pl-6">
                <div
                  className="text-3xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  ∞
                </div>
                <p className="text-[10px] tracking-tight text-[#FAF7F2]/60">
                  Album
                </p>
              </div>
              <div className="border-l border-[#FAF7F2]/20 pl-6">
                <div
                  className="text-3xl"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  99<span className="text-[#B89968]">k</span>
                </div>
                <p className="text-[10px] tracking-tight text-[#FAF7F2]/60">
                  /bulan
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── MARQUEE

function Marquee() {
  return (
    <section className="relative border-y border-[#1A1A1A]/10 bg-[#1A1A1A] text-[#FAF7F2] overflow-hidden">
      <div className="flex animate-[marquee_40s_linear_infinite] py-6 whitespace-nowrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-12 px-6"
            aria-hidden={i > 0}
          >
            {[
              "Wedding",
              "Pre-wedding",
              "Engagement",
              "Maternity",
              "Newborn",
              "Family",
              "Corporate Event",
              "Graduation",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-12 text-2xl lg:text-4xl tracking-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  fontVariationSettings: '"opsz" 144, "SOFT" 100',
                }}
              >
                {item}
                <span className="text-[#B85738] text-3xl">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── PAIN POINTS

function PainPoints() {
  return (
    <section className="py-24 lg:py-36">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <SectionLabel num="02" label="Yang Bikin Pusing" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-20"
        >
          <motion.div variants={fadeUp} className="lg:col-span-7">
            <p
              className="text-3xl lg:text-5xl leading-[1.1] tracking-tight text-[#1A1A1A]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontVariationSettings: '"opsz" 144, "SOFT" 30',
              }}
            >
              <span className="text-[#B85738]">&ldquo;</span>Klien lupa link
              Drive.{" "}
              <span style={{ fontStyle: "italic", fontWeight: 300 }}>
                Foto preview tanpa watermark dipakai sembarangan.
              </span>{" "}
              Pemilihan foto via screenshot WhatsApp 50 kali.
              <span className="text-[#B85738]">&rdquo;</span>
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="lg:col-span-5 lg:pt-6">
            <p className="text-base text-[#1A1A1A]/60 leading-relaxed max-w-md">
              Kalau kamu pernah ngalamin salah satu di atas, kamu tahu kenapa
              workflow delivery foto ke klien butuh tools yang lebih baik dari
              folder Google Drive.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1A1A1A]/12 border border-[#1A1A1A]/12"
        >
          {[
            {
              num: "i",
              title: "Workflow berantakan",
              body: "Klien tanya link berkali-kali. Folder Drive tertumpuk dan susah dicari.",
            },
            {
              num: "ii",
              title: "Karya tanpa proteksi",
              body: "Preview tanpa watermark dicuri. Tidak ada credit ke fotografer.",
            },
            {
              num: "iii",
              title: "Pemilihan foto chaos",
              body: "Klien kirim screenshot WhatsApp puluhan kali. Tidak ada favorite list yang rapi.",
            },
          ].map((item) => (
            <motion.div
              key={item.num}
              variants={fadeUp}
              className="bg-[#FAF7F2] p-8 lg:p-10 hover:bg-[#F0EAE0] transition-colors"
            >
              <div className="flex items-start gap-4 mb-5">
                <span
                  className="text-2xl text-[#B85738] mt-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}
                >
                  {item.num}.
                </span>
                <h3
                  className="text-xl lg:text-2xl tracking-tight"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed pl-10">
                {item.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── SAMPLE GALLERY (DEVICE MOCKUP)

function SampleGallery() {
  return (
    <section className="py-24 lg:py-36 bg-[#F0EAE0] relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <SectionLabel num="03" label="Lihat Hasilnya" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 lg:mb-24 items-end"
        >
          <motion.h2
            variants={fadeUp}
            className="lg:col-span-8 text-5xl lg:text-7xl tracking-[-0.03em] leading-[0.95]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            Galeri yang{" "}
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>
              klien kamu
            </span>{" "}
            akan lihat.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="lg:col-span-4 lg:pb-6 text-[#1A1A1A]/60 max-w-sm leading-relaxed"
          >
            Tampilan profesional dengan grid yang elegan, watermark protection,
            dan klien bisa langsung favorite foto pilihannya.
          </motion.p>
        </motion.div>

        {/* Browser frame mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative"
        >
          {/* Decorative tag floating */}
          <div className="hidden lg:block absolute -top-6 -right-6 z-20 bg-[#B85738] text-[#FAF7F2] px-4 py-2 rounded-full text-xs tracking-[0.15em] uppercase rotate-3 shadow-xl">
            ✦ Live Preview
          </div>

          <div className="rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden bg-[#1A1A1A] shadow-[0_40px_80px_-20px_rgba(26,26,26,0.4)] border border-[#1A1A1A]/20">
            {/* Browser chrome */}
            <div className="bg-[#0A0A0A] px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-[#FF5F57]" />
                <div className="size-3 rounded-full bg-[#FEBC2E]" />
                <div className="size-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 mx-4 hidden md:flex">
                <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-white/40 max-w-sm mx-auto w-full text-center">
                  studio-andini.galeriku.com/wedding-bali-2024
                </div>
              </div>
              <div className="text-[10px] text-white/30 tracking-[0.15em] uppercase hidden lg:block">
                galeriku ✦ pro
              </div>
            </div>

            {/* App content mockup */}
            <div className="bg-[#FAF7F2] p-5 lg:p-8">
              {/* Album header */}
              <div className="flex items-end justify-between mb-6 lg:mb-8 pb-5 border-b border-[#1A1A1A]/10">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#B85738] mb-2 font-semibold">
                    Wedding · 124 foto
                  </p>
                  <h3
                    className="text-3xl lg:text-5xl tracking-tight text-[#1A1A1A]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      fontStyle: "italic",
                    }}
                  >
                    Andini & Reza
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/50 mt-1">
                    21 September 2024 · Bali
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <button className="text-xs px-3 py-2 rounded-full border border-[#1A1A1A]/15 text-[#1A1A1A]/60">
                    ❤ Favorites (8)
                  </button>
                  <button className="text-xs px-3 py-2 rounded-full bg-[#1A1A1A] text-[#FAF7F2]">
                    Download all
                  </button>
                </div>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                {GALLERY_PHOTOS.map((src, i) => (
                  <div
                    key={src}
                    className={`relative rounded-lg overflow-hidden ${
                      i === 0 || i === 4
                        ? "row-span-2 aspect-[3/4]"
                        : "aspect-square"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`Wedding photo ${i + 1}`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                    {/* Watermark on a few */}
                    {(i === 1 || i === 3 || i === 6) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className="text-2xl lg:text-3xl text-white/30 -rotate-12 select-none"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontStyle: "italic",
                          }}
                        >
                          studio
                        </div>
                      </div>
                    )}
                    {/* Favorite badge */}
                    {(i === 0 || i === 5) && (
                      <div className="absolute top-2 right-2 size-6 rounded-full bg-white/95 flex items-center justify-center text-[#B85738] text-xs">
                        ❤
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── FEATURES

function Features() {
  return (
    <section
      id="features"
      className="py-24 lg:py-36 bg-[#1A1A1A] text-[#FAF7F2] relative overflow-hidden"
    >
      {/* Decorative gradient */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, #B85738 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <SectionLabel num="04" label="Fitur Untuk Profesional" dark />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 lg:mb-24 items-end"
        >
          <motion.h2
            variants={fadeUp}
            className="lg:col-span-8 text-5xl lg:text-7xl tracking-[-0.03em] leading-[0.95]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            Semua yang kamu butuhkan,{" "}
            <span
              className="text-[#B89968]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              tidak lebih.
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="lg:col-span-4 lg:pb-6 text-[#FAF7F2]/60 max-w-sm leading-relaxed"
          >
            Dirancang khusus untuk fotografer wedding & event Indonesia. Setiap
            fitur lahir dari obrolan dengan fotografer beneran.
          </motion.p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5"
        >
          {/* Watermark — large */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-2 lg:col-span-3 lg:row-span-2 group relative bg-[#FAF7F2]/[0.03] border border-[#FAF7F2]/10 rounded-[2rem] p-8 lg:p-12 overflow-hidden hover:bg-[#FAF7F2]/[0.06] transition-colors"
          >
            <div
              className="absolute top-8 right-8 text-[8rem] leading-none opacity-[0.06] text-[#B89968]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              01
            </div>
            <div className="relative">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#B89968] mb-4">
                Proteksi
              </div>
              <h3
                className="text-3xl lg:text-5xl tracking-tight mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                }}
              >
                Watermark{" "}
                <span style={{ fontStyle: "italic", fontWeight: 300 }}>
                  otomatis
                </span>
              </h3>
              <p className="text-[#FAF7F2]/60 max-w-md leading-relaxed">
                Preview foto dengan watermark logo studio kamu. Foto full-res
                hanya untuk klien yang berhak. Reputasi karya kamu, terjaga.
              </p>

              {/* Visual demo with real photo */}
              <div className="mt-8 lg:mt-12 relative aspect-[16/10] rounded-2xl overflow-hidden">
                <Image
                  src={WATERMARK_DEMO_PHOTO}
                  alt="Wedding venue with watermark"
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[#1A1A1A]/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="text-6xl lg:text-8xl text-[#FAF7F2]/35 -rotate-12 select-none"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 400,
                    }}
                  >
                    © Studio
                  </div>
                </div>
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Expiration */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-1 lg:col-span-3 group relative bg-[#FAF7F2]/[0.03] border border-[#FAF7F2]/10 rounded-[2rem] p-8 hover:bg-[#FAF7F2]/[0.06] transition-colors"
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#B89968] mb-3">
              Urgency
            </div>
            <h3
              className="text-2xl lg:text-3xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              <span style={{ fontStyle: "italic", fontWeight: 300 }}>
                Expiration
              </span>{" "}
              date
            </h3>
            <p className="text-sm text-[#FAF7F2]/60 leading-relaxed">
              Set masa berlaku album. Bikin urgency natural untuk klien segera
              memilih dan download.
            </p>
          </motion.div>

          {/* Branding */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-1 lg:col-span-3 group bg-[#FAF7F2]/[0.03] border border-[#FAF7F2]/10 rounded-[2rem] p-8 hover:bg-[#FAF7F2]/[0.06] transition-colors"
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#B89968] mb-3">
              Identitas
            </div>
            <h3
              className="text-2xl lg:text-3xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Custom{" "}
              <span style={{ fontStyle: "italic", fontWeight: 300 }}>
                branding
              </span>
            </h3>
            <p className="text-sm text-[#FAF7F2]/60 leading-relaxed">
              Logo, warna, dan domain studio kamu. Klien melihat brand kamu,
              bukan logo Galeriku.
            </p>
          </motion.div>

          {/* Analytics */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-1 lg:col-span-2 group bg-[#FAF7F2]/[0.03] border border-[#FAF7F2]/10 rounded-[2rem] p-8 hover:bg-[#FAF7F2]/[0.06] transition-colors"
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#B89968] mb-3">
              Insights
            </div>
            <h3
              className="text-xl lg:text-2xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Analytics
            </h3>
            <p className="text-sm text-[#FAF7F2]/60 leading-relaxed">
              Foto mana yang paling diview, di-favorite, dan di-download.
            </p>
          </motion.div>

          {/* Bulk download */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-1 lg:col-span-2 group bg-[#FAF7F2]/[0.03] border border-[#FAF7F2]/10 rounded-[2rem] p-8 hover:bg-[#FAF7F2]/[0.06] transition-colors"
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#B89968] mb-3">
              Delivery
            </div>
            <h3
              className="text-xl lg:text-2xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Bulk ZIP
            </h3>
            <p className="text-sm text-[#FAF7F2]/60 leading-relaxed">
              Klien download semua foto sekaligus dalam satu file.
            </p>
          </motion.div>

          {/* Password */}
          <motion.div
            variants={fadeUp}
            className="md:col-span-1 lg:col-span-2 group bg-[#FAF7F2]/[0.03] border border-[#FAF7F2]/10 rounded-[2rem] p-8 hover:bg-[#FAF7F2]/[0.06] transition-colors"
          >
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#B89968] mb-3">
              Privasi
            </div>
            <h3
              className="text-xl lg:text-2xl tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Password
            </h3>
            <p className="text-sm text-[#FAF7F2]/60 leading-relaxed">
              Album dilindungi password. Hanya yang berhak yang bisa lihat.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── TESTIMONIALS

const TESTIMONIALS = [
  {
    quote:
      "Workflow gw langsung jauh lebih rapi. Klien ngga lagi bombarding chat soal link Drive yang ngilang. Galeriku ngebantu banget jaga profesionalisme studio gw.",
    name: "Andini Larasati",
    role: "Wedding Photographer",
    studio: "Andini Studio",
    location: "Jakarta",
    initial: "AL",
    color: "#B85738",
  },
  {
    quote:
      "Watermark otomatis adalah game changer. Sebelumnya gw harus edit satu-satu di Lightroom. Sekarang upload langsung jadi. Klien juga lebih appreciate karena kelihatan effort di delivery-nya.",
    name: "Reza Mahardika",
    role: "Pre-wedding Photographer",
    studio: "Mahardika Films",
    location: "Bandung",
    initial: "RM",
    color: "#B89968",
  },
  {
    quote:
      "Akhirnya ada tool yang bahasa Indonesia dan harganya masuk akal buat fotografer lokal. Pixieset terlalu mahal kalau dihitung dalam Rupiah. Galeriku passionate buat komunitas kita.",
    name: "Sinta Permatasari",
    role: "Event Photographer",
    studio: "Permata Lens",
    location: "Surabaya",
    initial: "SP",
    color: "#1A1A1A",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-36">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <SectionLabel num="05" label="Cerita Fotografer" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 lg:mb-24 items-end"
        >
          <motion.h2
            variants={fadeUp}
            className="lg:col-span-8 text-5xl lg:text-7xl tracking-[-0.03em] leading-[0.95]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            Yang sudah{" "}
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>
              upgrade workflow
            </span>{" "}
            mereka.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="lg:col-span-4 lg:pb-6 text-[#1A1A1A]/60 max-w-sm leading-relaxed"
          >
            Cerita dari fotografer wedding & event yang udah pakai Galeriku
            untuk delivery klien sehari-hari.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className={`relative rounded-[2rem] p-8 lg:p-10 flex flex-col ${
                i === 1
                  ? "bg-[#1A1A1A] text-[#FAF7F2] lg:translate-y-6"
                  : "bg-[#FAF7F2] border border-[#1A1A1A]/10"
              }`}
            >
              {/* Big quote mark */}
              <div
                className={`text-[6rem] leading-[0.6] mb-4 ${
                  i === 1 ? "text-[#B89968]" : "text-[#B85738]"
                }`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontStyle: "italic",
                }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              <p
                className={`text-base lg:text-lg leading-relaxed mb-8 flex-1 ${
                  i === 1 ? "text-[#FAF7F2]/85" : "text-[#1A1A1A]/80"
                }`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontVariationSettings: '"opsz" 14, "SOFT" 50',
                }}
              >
                {t.quote}
              </p>

              {/* Author */}
              <div
                className={`flex items-center gap-3 pt-6 border-t ${
                  i === 1 ? "border-[#FAF7F2]/15" : "border-[#1A1A1A]/10"
                }`}
              >
                <div
                  className="size-12 rounded-full flex items-center justify-center text-sm font-bold text-[#FAF7F2]"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm tracking-tight ${
                      i === 1 ? "text-[#FAF7F2]" : "text-[#1A1A1A]"
                    }`}
                  >
                    {t.name}
                  </div>
                  <div
                    className={`text-xs ${
                      i === 1 ? "text-[#FAF7F2]/50" : "text-[#1A1A1A]/50"
                    }`}
                  >
                    {t.role} · {t.location}
                  </div>
                </div>
                <div
                  className={`text-[10px] tracking-[0.15em] uppercase ${
                    i === 1 ? "text-[#B89968]" : "text-[#B85738]"
                  }`}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}
                >
                  {t.studio}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#1A1A1A]/40 text-center mt-12 tracking-tight">
          ✦ Testimoni representatif berdasarkan riset awal · Studio nama
          dibuat untuk ilustrasi
        </p>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── COMPARISON

function Comparison() {
  return (
    <section className="py-24 lg:py-36 bg-[#F0EAE0]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <SectionLabel num="06" label="Bandingkan" />

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-4xl lg:text-6xl tracking-[-0.03em] leading-[1] mb-16 lg:mb-20 max-w-3xl"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontVariationSettings: '"opsz" 144, "SOFT" 30',
          }}
        >
          Kenapa{" "}
          <span style={{ fontStyle: "italic", fontWeight: 300 }}>bukan</span>{" "}
          Google Drive saja?
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="space-y-3"
        >
          {[
            {
              name: "Google Drive",
              tagline: "Folder bersama untuk file apapun",
              cons: "Tampilan amatir. Tanpa watermark. Klien bingung navigasi.",
              price: "Free",
              priceDetail: "/15 GB",
            },
            {
              name: "WeTransfer",
              tagline: "Kirim file besar via link expirable",
              cons: "Hanya untuk transfer, bukan galeri. Expired 7 hari.",
              price: "Free",
              priceDetail: "/2 GB",
            },
            {
              name: "Pixieset / Pic-Time",
              tagline: "Tools internasional untuk pro",
              cons: "Mahal dalam USD. Bahasa Inggris. Support sulit.",
              price: "$15-50",
              priceDetail: "/bulan USD",
            },
            {
              name: "Galeriku Pro",
              tagline: "Khusus fotografer Indonesia",
              cons: "Harga lokal. Bahasa Indonesia. Support WhatsApp.",
              price: "Rp 99k",
              priceDetail: "/bulan",
              highlighted: true,
            },
          ].map((item) => (
            <motion.div
              key={item.name}
              variants={fadeUp}
              className={`grid grid-cols-12 gap-4 lg:gap-8 items-center p-6 lg:p-8 rounded-2xl border transition-all ${
                item.highlighted
                  ? "bg-[#1A1A1A] text-[#FAF7F2] border-[#1A1A1A] scale-[1.01] shadow-2xl shadow-[#1A1A1A]/20"
                  : "bg-[#FAF7F2] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
              }`}
            >
              <div className="col-span-12 md:col-span-4">
                <h3
                  className={`text-2xl lg:text-3xl tracking-tight ${
                    item.highlighted ? "text-[#FAF7F2]" : "text-[#1A1A1A]"
                  }`}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  {item.name}
                </h3>
                <p
                  className={`text-xs mt-1 tracking-tight ${
                    item.highlighted
                      ? "text-[#FAF7F2]/50"
                      : "text-[#1A1A1A]/50"
                  }`}
                >
                  {item.tagline}
                </p>
              </div>
              <p
                className={`col-span-12 md:col-span-5 text-sm leading-relaxed ${
                  item.highlighted ? "text-[#FAF7F2]/70" : "text-[#1A1A1A]/60"
                }`}
              >
                {item.cons}
              </p>
              <div className="col-span-12 md:col-span-3 md:text-right">
                <div
                  className={`text-3xl tracking-tight ${
                    item.highlighted ? "text-[#B89968]" : "text-[#1A1A1A]"
                  }`}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  {item.price}
                </div>
                <div
                  className={`text-xs ${
                    item.highlighted
                      ? "text-[#FAF7F2]/50"
                      : "text-[#1A1A1A]/50"
                  }`}
                >
                  {item.priceDetail}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── PRICING

function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-36">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <SectionLabel num="07" label="Pilih Skala" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 lg:mb-20 items-end"
        >
          <motion.h2
            variants={fadeUp}
            className="lg:col-span-8 text-5xl lg:text-7xl tracking-[-0.03em] leading-[0.95]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            Harga sesuai{" "}
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>
              skala usaha.
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="lg:col-span-4 lg:pb-6 text-[#1A1A1A]/60 max-w-sm leading-relaxed"
          >
            Free trial 14 hari untuk semua paket. Tanpa kartu kredit. Upgrade
            atau cancel kapan saja.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6"
        >
          <motion.div variants={fadeUp}>
            <PricingCard
              tier="Solo"
              tagline="Fotografer freelance"
              price="99"
              features={[
                "10 album per bulan",
                "Watermark otomatis",
                "Basic branding",
                "Album expiration",
                "Analytics dasar",
                "Email support",
              ]}
              cta="Mulai Solo"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <PricingCard
              tier="Pro"
              tagline="Fotografer reguler"
              price="199"
              features={[
                "Unlimited album",
                "Custom branding penuh",
                "Custom domain studio",
                "Advanced analytics",
                "Bulk download ZIP",
                "WhatsApp support",
                "Tanpa Galeriku branding",
              ]}
              cta="Pilih Pro"
              featured
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <PricingCard
              tier="Studio"
              tagline="Tim & studio fotografi"
              price="499"
              features={[
                "Semua fitur Pro",
                "Multi-user (5 anggota)",
                "White-label penuh",
                "API access",
                "Priority support",
                "Onboarding 1-on-1",
              ]}
              cta="Hubungi Sales"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── FINAL CTA

function FinalCTA() {
  return (
    <section
      id="waitlist"
      className="relative py-24 lg:py-40 text-[#FAF7F2] overflow-hidden"
    >
      {/* Background photo */}
      <div className="absolute inset-0">
        <Image
          src={CTA_PHOTO}
          alt="Wedding couple"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.85) 50%, rgba(184,87,56,0.7) 100%)",
          }}
        />
      </div>

      {/* Decorative dots */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #FAF7F2 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="relative max-w-[1100px] mx-auto px-6 lg:px-12 text-center"
      >
        <motion.span
          variants={fadeUp}
          className="inline-block text-[11px] tracking-[0.25em] uppercase text-[#B89968] mb-8 font-semibold"
        >
          ✦ Akses Awal
        </motion.span>

        <motion.h2
          variants={fadeUp}
          className="text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-[-0.035em] mb-10"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontVariationSettings: '"opsz" 144, "SOFT" 30',
          }}
        >
          Siap upgrade
          <br />
          <span
            className="text-[#B89968]"
            style={{ fontStyle: "italic", fontWeight: 300 }}
          >
            workflow
          </span>{" "}
          kamu?
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-[#FAF7F2]/85 max-w-xl mx-auto mb-12 text-base lg:text-lg leading-relaxed"
        >
          Daftar sekarang untuk akses awal + diskon 50% lifetime untuk 100
          fotografer pertama yang ikut.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
        >
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 bg-[#FAF7F2] text-[#1A1A1A] px-8 py-5 rounded-full text-sm tracking-tight hover:bg-[#B89968] transition-all"
          >
            Mulai Coba Gratis
            <Arrow nudge />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 border border-[#FAF7F2]/40 text-[#FAF7F2] px-6 py-5 rounded-full text-sm tracking-tight hover:bg-[#FAF7F2]/10 hover:border-[#FAF7F2]/70 transition-all backdrop-blur-sm"
          >
            Lihat Fitur Lagi
          </a>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-xs text-[#FAF7F2]/60 tracking-tight"
        >
          14 hari gratis · Tanpa kartu kredit · Setup dalam 5 menit
        </motion.p>
      </motion.div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────── FOOTER

function Footer() {
  return (
    <footer className="bg-[#FAF7F2] border-t border-[#1A1A1A]/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-baseline gap-2 mb-4">
              <span
                className="text-3xl tracking-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                Galeriku
              </span>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[#1A1A1A]/50">
                / pro
              </span>
            </Link>
            <p className="text-sm text-[#1A1A1A]/60 leading-relaxed max-w-xs">
              Client gallery profesional untuk fotografer wedding & event di
              Indonesia. Dibuat oleh fotografer, untuk fotografer.
            </p>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/40 mb-4">
              Produk
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#features"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Fitur
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Harga
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Cerita
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Masuk
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/40 mb-4">
              Sumber
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Tutorial
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#1A1A1A]/70 hover:text-[#B85738] transition-colors"
                >
                  Bantuan
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/40 mb-4">
              Kontak
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-[#1A1A1A]/70">hello@galeriku.com</li>
              <li className="text-[#1A1A1A]/70">
                WhatsApp: tersedia setelah signup
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1A1A1A]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-[#1A1A1A]/50 tracking-tight">
            © 2026 Galeriku. Made in Indonesia{" "}
            <span className="text-[#B85738]">✦</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-[#1A1A1A]/50">
            <a href="#" className="hover:text-[#1A1A1A]">
              Privacy
            </a>
            <span className="opacity-30">/</span>
            <a href="#" className="hover:text-[#1A1A1A]">
              Terms
            </a>
            <span className="opacity-30">/</span>
            <a href="#" className="hover:text-[#1A1A1A]">
              Refund
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────────────────── HELPERS

function SectionLabel({
  num,
  label,
  dark,
}: {
  num: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex items-center gap-4 mb-12 lg:mb-20"
    >
      <span
        className={`text-[11px] tracking-[0.25em] uppercase font-semibold ${
          dark ? "text-[#B89968]" : "text-[#B85738]"
        }`}
      >
        ✦ {num} — {label}
      </span>
      <div
        className={`flex-1 h-px max-w-[200px] ${
          dark ? "bg-[#FAF7F2]/15" : "bg-[#1A1A1A]/15"
        }`}
      />
    </motion.div>
  );
}

function Arrow({ nudge }: { nudge?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={nudge ? "group-hover:translate-x-1 transition-transform" : ""}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────── PRICING CARD

function PricingCard({
  tier,
  tagline,
  price,
  features,
  cta,
  featured,
}: {
  tier: string;
  tagline: string;
  price: string;
  features: string[];
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[2rem] p-8 lg:p-10 flex flex-col h-full transition-all ${
        featured
          ? "bg-[#1A1A1A] text-[#FAF7F2] lg:scale-[1.03] shadow-2xl shadow-[#1A1A1A]/15"
          : "bg-[#FAF7F2] border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-8 bg-[#B89968] text-[#1A1A1A] text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5 rounded-full">
          Paling Populer
        </div>
      )}

      <div className="mb-8">
        <h3
          className={`text-3xl lg:text-4xl tracking-tight mb-2 ${
            featured ? "text-[#FAF7F2]" : "text-[#1A1A1A]"
          }`}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontStyle: "italic",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
          }}
        >
          {tier}
        </h3>
        <p
          className={`text-xs tracking-[0.05em] ${
            featured ? "text-[#FAF7F2]/50" : "text-[#1A1A1A]/50"
          }`}
        >
          {tagline}
        </p>
      </div>

      <div className="mb-8 pb-8 border-b border-dashed border-[#1A1A1A]/10">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-sm ${
              featured ? "text-[#FAF7F2]/60" : "text-[#1A1A1A]/60"
            }`}
          >
            Rp
          </span>
          <span
            className={`text-6xl tracking-tight ${
              featured ? "text-[#B89968]" : "text-[#1A1A1A]"
            }`}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            {price}k
          </span>
          <span
            className={`text-sm ml-1 ${
              featured ? "text-[#FAF7F2]/60" : "text-[#1A1A1A]/60"
            }`}
          >
            /bulan
          </span>
        </div>
      </div>

      <ul className="space-y-3 mb-10 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`mt-1 flex-shrink-0 ${
                featured ? "text-[#B89968]" : "text-[#B85738]"
              }`}
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span
              className={`leading-snug ${
                featured ? "text-[#FAF7F2]/80" : "text-[#1A1A1A]/70"
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/login"
        className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-sm tracking-tight transition-all ${
          featured
            ? "bg-[#B89968] text-[#1A1A1A] hover:bg-[#FAF7F2]"
            : "bg-[#1A1A1A] text-[#FAF7F2] hover:bg-[#B85738]"
        }`}
      >
        {cta}
        <Arrow />
      </Link>
    </div>
  );
}
