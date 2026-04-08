import Link from "next/link";

export default function MerciPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
      <div className="max-w-lg text-center">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Merci pour votre message !
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-neutral-400">
          Je vous répondrai très prochainement.
          <br />
          <span className="mt-2 block text-white font-medium">— Adrien</span>
        </p>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-neutral-200"
        >
          Retour au site
        </Link>
      </div>
    </div>
  );
}
