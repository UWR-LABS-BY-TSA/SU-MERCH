import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#14100c] px-6 text-center text-[#f1e6c8]">
      {/* Burgundy-to-black radial wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#3a0307_0%,#1a0408_35%,#0a0604_80%)]" />

      {/* Subtle film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Floating candle dots — pure CSS, no JS, negligible cost */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-[6px] w-[6px] rounded-full bg-[#FFB100] shadow-[0_0_12px_6px_rgba(255,177,0,0.35)] animate-flicker"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${10 + ((i * 29) % 70)}%`,
              animationDelay: `${(i * 0.37) % 3}s`,
              animationDuration: `${2.2 + ((i * 0.19) % 2)}s`,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-6 font-serif text-[11px] uppercase tracking-[0.55em] text-[#FFB100] drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          — Streamer University —
        </span>

        <div className="relative mb-6">
          {/* Gold glow behind the crest */}
          <div className="absolute inset-0 -z-10 rounded-full bg-[#FFB100]/20 blur-3xl" />
          <Image
            src="/SUCREST.PNG"
            alt="Streamer University crest"
            width={360}
            height={360}
            priority
            className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]"
          />
        </div>

        <h1 className="font-serif text-4xl font-semibold leading-[1.05] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] md:text-5xl lg:text-6xl">
          Welcome,
          <br />
          <span className="italic text-[#FFB100]">Class of 2026</span>
        </h1>

        <p className="mt-6 max-w-lg font-serif text-base italic leading-relaxed text-[#f1e6c8]/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-lg">
          The torches are lit. The banners are hung. Step through the hall
          and find your colors — the official outfitters of the Streamer Lions.
        </p>

        <Link
          href="/store"
          className="group mt-10 inline-flex items-center gap-4 rounded-sm border-2 border-[#FFB100] bg-[#93000B]/60 px-8 py-4 backdrop-blur-sm transition hover:bg-[#FFB100] hover:text-[#14100c]"
        >
          <span className="font-serif text-sm tracking-[0.35em] md:text-base">
            ENTER THE STORE
          </span>
          <span className="text-lg transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>

        <span className="mt-10 font-serif text-[11px] italic tracking-[0.3em] text-[#f1e6c8]/50">
          Est. by Kai Cenat · MMXXV
        </span>
      </div>
    </main>
  )
}
