import { notFound } from "next/navigation";
import { VoiceReceptionist } from "@/components/receptionist/VoiceReceptionist";
import { getEntity } from "@/lib/entities";

export default function C37Page() {
  const entity = getEntity("c37");
  if (!entity) notFound();
  return <VoiceReceptionist entity={entity} />;
}
