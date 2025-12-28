import { getOrCreateSession, getSessionCards } from "@/app/actions";
import { Board } from "@/components/board";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;
  
  await getOrCreateSession(sessionId);
  const initialCards = await getSessionCards(sessionId);

  return <Board sessionId={sessionId} initialCards={initialCards} />;
}

