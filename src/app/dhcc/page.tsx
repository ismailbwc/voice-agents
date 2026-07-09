import { notFound } from "next/navigation";
import { VoiceReceptionist } from "@/components/receptionist/VoiceReceptionist";
import { getEntity } from "@/lib/entities";

export default function DhccPage() {
  const entity = getEntity("dhcc");
  if (!entity) notFound();
  return <VoiceReceptionist entity={entity} />;
}
