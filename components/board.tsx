"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRealtimeCards } from "@/hooks/use-realtime-cards";
import { useFingerprint } from "@/hooks/use-fingerprint";
import { useCatSound } from "@/hooks/use-cat-sound";
import { RealtimeCursors } from "@/components/realtime-cursors";
import { IdeaCard } from "@/components/idea-card";
import { UserBadge } from "@/components/user-badge";
import { AddCardButton } from "@/components/add-card-button";
import { CommandMenu } from "@/components/command-menu";
import { generateUsername } from "@/lib/names";
import { generateCardId } from "@/lib/nanoid";
import { createCard, updateCard, deleteCard, voteCard as voteCardAction } from "@/app/actions";
import type { Card } from "@/db/schema";
import { Share2, Home, Plus, Command, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcherToggle } from "@/components/elements/theme-switcher-toggle";
import Link from "next/link";

const LIGHT_COLORS = [
  "#D4B8F0",
  "#FFCAB0",
  "#C4EDBA",
  "#C5E8EC",
  "#F9E9A8",
];

const DARK_COLORS = [
  "#9B7BC7",
  "#E8936A",
  "#7BC96A",
  "#7ABCC5",
  "#D4C468",
];

interface BoardProps {
  sessionId: string;
  initialCards: Card[];
}

export function Board({ sessionId, initialCards }: BoardProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sessionIdCopied, setSessionIdCopied] = useState(false);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { visitorId, isLoading: isFingerprintLoading } = useFingerprint();
  const playSound = useCatSound();

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
    playSound();

    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? 160 : 224;
    const cardHeight = isMobile ? 120 : 160;

    // Center of viewport with random offset (+-100px) to avoid stacking
    const offsetRange = 100;
    const x = (window.innerWidth / 2) - (cardWidth / 2) + (Math.random() * offsetRange * 2 - offsetRange);
    const y = (window.innerHeight / 2) - (cardHeight / 2) + (Math.random() * offsetRange * 2 - offsetRange);

    const cardId = generateCardId();
    const newCard: Card = {
      id: cardId,
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

    setNewCardId(cardId);
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

  const handleCopySessionId = async () => {
    await navigator.clipboard.writeText(sessionId);
    setSessionIdCopied(true);
    setTimeout(() => setSessionIdCopied(false), 2000);
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
      <CommandMenu 
        open={commandOpen} 
        onOpenChange={setCommandOpen} 
        onAddCard={handleAddCard} 
        onShare={handleShare} 
      />
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

      <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={handleCopySessionId}
          className="hidden sm:flex text-muted-foreground text-sm font-mono bg-card/80 backdrop-blur-sm px-3 h-8 sm:h-9 items-center justify-center gap-2 rounded-md border border-border shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all cursor-pointer"
          title={sessionIdCopied ? "Copied!" : "Copy session ID"}
        >
          {sessionId}
          {sessionIdCopied ? (
            <Check className="w-3.5 h-3.5 text-sky-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 opacity-50" />
          )}
        </button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleAddCard}
          className="bg-card/80 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleShare}
          className="bg-card/80 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9"
          title={copied ? "Copied!" : "Share"}
        >
          {copied ? (
            <Check className="w-4 h-4 text-sky-500" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCommandOpen(true)}
          className="bg-card/80 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9"
          title="Command menu (⌘K)"
        >
          <Command className="w-4 h-4" />
        </Button>
        <div className="bg-card/80 backdrop-blur-sm h-8 sm:h-9 flex items-center px-1.5 sm:px-2 rounded-lg border border-border">
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
            autoFocus={card.id === newCardId}
            onFocused={() => setNewCardId(null)}
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
              <p className="text-sm mt-1">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">⌘K</kbd> or click + to add one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
