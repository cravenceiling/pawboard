"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRealtimeCards } from "@/hooks/use-realtime-cards";
import { useFingerprint } from "@/hooks/use-fingerprint";
import { RealtimeCursors } from "@/components/realtime-cursors";
import { IdeaCard } from "@/components/idea-card";
import { UserBadge } from "@/components/user-badge";
import { AddCardButton } from "@/components/add-card-button";
import { generateUsername } from "@/lib/names";
import { generateCardId } from "@/lib/nanoid";
import { createCard, updateCard, deleteCard, voteCard as voteCardAction } from "@/app/actions";
import type { Card } from "@/db/schema";
import { Share2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcherToggle } from "@/components/elements/theme-switcher-toggle";
import Link from "next/link";

const CARD_COLORS = [
  "#b77ff7",
  "#ff8f62",
  "#8ef77e",
  "#c0ecf0",
  "#f7e07e",
];

const LIGHT_COLORS = CARD_COLORS;
const DARK_COLORS = CARD_COLORS;

interface BoardProps {
  sessionId: string;
  initialCards: Card[];
}

export function Board({ sessionId, initialCards }: BoardProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const { visitorId, isLoading: isFingerprintLoading } = useFingerprint();

  useEffect(() => {
    setUsername(generateUsername());
  }, []);

  const {
    cards,
    addCard,
    moveCard,
    typeCard,
    changeColor,
    removeCard,
    voteCard,
  } = useRealtimeCards(sessionId, initialCards, visitorId || "");

  const getRandomColor = () => {
    const colors = resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddCard = async () => {
    if (!username || !visitorId) return;

    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? 160 : 224;
    const x = Math.random() * (window.innerWidth - cardWidth - 40) + 20;
    const y = Math.random() * (window.innerHeight - 200) + (isMobile ? 80 : 100);

    const newCard: Card = {
      id: generateCardId(),
      sessionId,
      content: "",
      color: getRandomColor(),
      x,
      y,
      votes: 0,
      votedBy: [],
      createdById: visitorId,
      createdBy: username,
      updatedAt: new Date(),
    };

    addCard(newCard);
    await createCard(newCard);
  };

  const handlePersistContent = async (id: string, content: string) => {
    await updateCard(id, { content });
  };

  const handlePersistMove = async (id: string, x: number, y: number) => {
    await updateCard(id, { x, y });
  };

  const handlePersistColor = async (id: string, color: string) => {
    await updateCard(id, { color });
  };

  const handlePersistDelete = async (id: string) => {
    if (!visitorId) return;
    await deleteCard(id, visitorId);
  };

  const handleVote = async (id: string) => {
    if (!visitorId) return;
    
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    if (card.createdById === visitorId) return;

    const hasVoted = card.votedBy?.includes(visitorId) || false;
    const newVotes = hasVoted ? card.votes - 1 : card.votes + 1;
    const newVotedBy = hasVoted
      ? (card.votedBy || []).filter((v) => v !== visitorId)
      : [...(card.votedBy || []), visitorId];

    voteCard(id, newVotes, newVotedBy);
    await voteCardAction(id, visitorId);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!username || isFingerprintLoading || !visitorId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      <RealtimeCursors roomName={`session:${sessionId}`} username={username} />

      <div className="fixed top-2 sm:top-4 left-2 sm:left-4 z-50 flex items-center gap-1.5 sm:gap-3">
        <Link href="/">
          <Button
            variant="outline"
            size="icon"
            className="bg-card/80 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </Link>
        <UserBadge username={username} />
      </div>

      <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-1 sm:gap-2">
        <div className="hidden sm:block text-muted-foreground text-sm font-mono bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border">
          {sessionId}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="bg-card/80 backdrop-blur-sm h-8 sm:h-9 px-2 sm:px-3"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
        </Button>
        <div className="bg-card/80 backdrop-blur-sm px-1.5 sm:px-2 py-1 rounded-lg border border-border">
          <ThemeSwitcherToggle />
        </div>
      </div>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <AddCardButton onClick={handleAddCard} />
      </div>

      <div className="relative w-full h-screen">
        {cards.map((card) => (
          <IdeaCard
            key={card.id}
            card={card}
            visitorId={visitorId}
            onMove={moveCard}
            onType={typeCard}
            onChangeColor={changeColor}
            onDelete={removeCard}
            onVote={handleVote}
            onPersistContent={handlePersistContent}
            onPersistMove={handlePersistMove}
            onPersistColor={handlePersistColor}
            onPersistDelete={handlePersistDelete}
          />
        ))}

        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">No ideas yet</p>
              <p className="text-sm mt-1">Click the + button to add one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
