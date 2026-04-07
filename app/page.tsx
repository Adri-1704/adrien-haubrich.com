const projects = [
  {
    name: "Yattoo",
    url: "https://yattoo.io",
    description:
      "App mobile et web qui permet de faire des économies sur ses courses, réduire sa charge mentale et le gaspillage alimentaire.",
    type: "SaaS B2C",
    color: "#22c55e",
  },
  {
    name: "OnVousTrouve.ch",
    url: "https://onvoustrouve.ch",
    description:
      "Permet aux commerçants locaux de se faire voir sur internet en leur créant un site professionnel.",
    type: "Agence web B2B",
    color: "#1e40af",
  },
  {
    name: "L'Atelier Suisse B2C",
    url: "https://lateliersuisse.ch",
    description:
      "E-commerce spécialisé dans la personnalisation sur textiles et objets pour particuliers.",
    type: "E-commerce B2C",
    color: "#dc2626",
  },
  {
    name: "L'Atelier Suisse B2B",
    url: "https://lateliersuisse.co",
    description:
      "Personnalisation sur textiles et objets pour entreprises. Solutions sur mesure en volume.",
    type: "E-commerce B2B",
    color: "#991b1b",
  },
  {
    name: "FunkyFeet",
    url: "https://funkyfeet.ch",
    description:
      "Boutique en ligne spécialisée dans la vente de chaussettes originales et de qualité.",
    type: "E-commerce B2C",
    color: "#7c3aed",
  },
  {
    name: "Just-Tag",
    url: "https://just-tag.ch",
    description:
      "Plateforme qui met en avant les meilleurs endroits où manger et sortir en Suisse.",
    type: "Plateforme locale",
    color: "#ea580c",
  },
  {
    name: "Signature Locale",
    url: "https://signaturelocale.ch",
    description:
      "Permet aux commerces locaux suisses de mettre en avant leur établissement auprès de leur communauté.",
    type: "Annuaire local",
    color: "#0d9488",
  },
  {
    name: "Glariade",
    url: "https://glariade.ch",
    description:
      "Site spécialisé dans la fameuse recette de la Glariade, un incontournable de la gastronomie suisse.",
    type: "Site culinaire",
    color: "#b45309",
  },
];

const stats = [
  { value: "8", label: "Projets actifs" },
  { value: "4", label: "Secteurs" },
  { value: "100%", label: "Suisse" },
  { value: "2017", label: "Depuis" },
];

const skills = [
  "Next.js",
  "React",
  "TypeScript",
  "Supabase",
  "Tailwind CSS",
  "Stripe",
  "Vercel",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ==================== NAVIGATION ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="#"
            className="text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-80"
          >
            Adrien Haubrich
          </a>
          <div className="flex items-center gap-8">
            <a
              href="#projets"
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              Projets
            </a>
            <a
              href="#a-propos"
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              À propos
            </a>
            <a
              href="#contact"
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 hero-gradient" />
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-green-500/10 blur-3xl animate-pulse-slow" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/8 blur-3xl animate-float" />
        <div className="pointer-events-none absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-blue-500/8 blur-3xl animate-pulse-slow delay-300" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="animate-fade-in mb-6 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
            Le Bouveret, Valais, Suisse
          </p>
          <h1 className="animate-fade-in-up delay-200 mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
            <span className="gradient-text-accent">Entrepreneur Digital</span>
          </h1>
          <p className="animate-fade-in-up delay-400 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
            Je crée des produits digitaux qui simplifient la vie des gens et des
            entreprises en Suisse.
          </p>
          <div className="animate-fade-in-up delay-600 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#projets"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10"
            >
              Découvrir mes projets
            </a>
            <a
              href="#contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-8 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              Me contacter
            </a>
          </div>
        </div>

      </section>

      {/* ==================== PROJECTS ==================== */}
      <section id="projets" className="relative py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="animate-fade-in mb-4 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
              Portfolio
            </p>
            <h2 className="animate-fade-in-up delay-100 text-4xl font-bold tracking-tight sm:text-5xl">
              Mes projets
            </h2>
            <p className="animate-fade-in-up delay-200 mx-auto mt-4 max-w-xl text-neutral-400">
              8 projets actifs couvrant le SaaS, le e-commerce, les services web
              et les plateformes locales.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project, index) => (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`animate-fade-in-up delay-${(index + 2) * 100} card-glow group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111111] p-8 transition-all hover:border-white/10`}
                style={{
                  animationDelay: `${(index + 2) * 100}ms`,
                }}
              >
                {/* Colored left border accent */}
                <div
                  className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
                  style={{ backgroundColor: project.color }}
                />

                {/* Hover glow effect */}
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-20"
                  style={{ backgroundColor: project.color }}
                />

                <div className="relative">
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-xl font-bold text-white">
                      {project.name}
                    </h3>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${project.color}15`,
                        color: project.color,
                      }}
                    >
                      {project.type}
                    </span>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                    {project.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors group-hover:text-white">
                    <span>Visiter le site</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="border-y border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`animate-fade-in-up text-center`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <p className="mb-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}
      <section id="a-propos" className="py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-16 md:grid-cols-2">
            <div>
              <p className="animate-fade-in mb-4 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
                À propos
              </p>
              <h2 className="animate-fade-in-up delay-100 mb-8 text-4xl font-bold tracking-tight sm:text-5xl">
                Adrien Haubrich
              </h2>
              <div className="animate-fade-in-up delay-200 space-y-4 text-neutral-400 leading-relaxed">
                <p>
                  Basé au Bouveret, en Valais, je suis passionné par
                  l&apos;entrepreneuriat digital. Je crée des solutions
                  technologiques pour aider les particuliers et les entreprises
                  suisses à se développer.
                </p>
                <p>
                  Avec 8 projets actifs couvrant le SaaS, le e-commerce, les
                  services web et les plateformes locales, mon objectif est de
                  construire un écosystème digital au service de la Suisse.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== CONTACT ==================== */}
      <section
        id="contact"
        className="border-t border-white/5 py-32"
      >
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="animate-fade-in mb-4 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
            Contact
          </p>
          <h2 className="animate-fade-in-up delay-100 mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Travaillons ensemble
          </h2>
          <p className="animate-fade-in-up delay-200 mx-auto mb-12 max-w-xl text-neutral-400">
            Un projet en tête ? Une question ? N&apos;hésitez pas à me
            contacter directement.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* WhatsApp */}
            <a
              href="https://wa.me/41794517496"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center gap-3 rounded-full bg-[#25D366] px-8 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-[#25D366]/20"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Email */}
            <a
              href="mailto:contact@adrien-haubrich.com"
              className="inline-flex h-14 items-center gap-3 rounded-full border border-white/15 px-8 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <span>contact@adrien-haubrich.com</span>
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-neutral-600">
            &copy; 2026 Adrien Haubrich — Le Bouveret, Valais, Suisse. Tous
            droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
