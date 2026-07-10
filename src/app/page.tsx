import Link from "next/link";
import { ENTITIES } from "@/lib/entities";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold text-[#0B1F3A] md:text-4xl">Voice Receptionists</h1>
        <p className="mt-3 text-[#64748B]">
          Choose your assistant to start a voice conversation
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-md gap-4">
        {Object.values(ENTITIES).map((entity) => (
          <Link
            key={entity.slug}
            href={`/${entity.slug}`}
            className="card-elevated group p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              {entity.shortName}
            </p>
            <p className="mt-1 text-lg font-semibold text-[#0B1F3A]">{entity.name}</p>
            <p className="mt-2 text-sm text-[#64748B]">{entity.tagline}</p>
            <p className="mt-4 text-sm font-medium" style={{ color: entity.theme.primaryLight }}>
              Talk to {entity.agentName} →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
