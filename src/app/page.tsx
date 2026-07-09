import Link from "next/link";
import { ENTITIES } from "@/lib/entities";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a] px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold text-white md:text-4xl">Voice Receptionists</h1>
        <p className="mt-3 text-white/60">
          Choose your assistant to start a voice conversation
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-md gap-4">
        {Object.values(ENTITIES).map((entity) => (
          <Link
            key={entity.slug}
            href={`/${entity.slug}`}
            className="group rounded-2xl border border-white/10 p-6 transition hover:border-white/25 hover:bg-white/5"
            style={{ borderLeftColor: entity.theme.primary, borderLeftWidth: 4 }}
          >
            <p className="text-xs uppercase tracking-wider text-white/50">{entity.shortName}</p>
            <p className="mt-1 text-lg font-semibold text-white group-hover:text-white">
              {entity.name}
            </p>
            <p className="mt-2 text-sm text-white/50">{entity.tagline}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
