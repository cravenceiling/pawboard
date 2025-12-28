"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, GripVertical, ChevronUp, Sparkles, Loader2, Undo2, Maximize2, Minimize2 } from "lucide-react";
import Markdown from "react-markdown";
import type { Card } from "@/db/schema";

const CARD_COLORS = [
  "#b77ff7",
  "#ff8f62",
  "#8ef77e",
  "#c0ecf0",
  "#f7e07e",
];

const LIGHT_COLORS = CARD_COLORS;
const DARK_COLORS = CARD_COLORS;

const COLOR_MAP: Record<string, string> = {};

interface IdeaCardProps {
  card: Card;
  visitorId: string;
  onMove: (id: string, x: number, y: number) => void;
  onType: (id: string, content: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onPersistContent: (id: string, content: string) => void;
  onPersistMove: (id: string, x: number, y: number) => void;
  onPersistColor: (id: string, color: string) => void;
  onPersistDelete: (id: string) => void;
}

export function IdeaCard({
  card,
  visitorId,
  onMove,
  onType,
  onChangeColor,
  onDelete,
  onVote,
  onPersistContent,
  onPersistMove,
  onPersistColor,
  onPersistDelete,
}: IdeaCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { resolvedTheme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  
  const isOwnCard = card.createdById === visitorId;
  const hasVoted = card.votedBy?.includes(visitorId) || false;
  const canVote = !isOwnCard;

  const getDisplayColor = (storedColor: string) => {
    if (!mounted) return storedColor;
    const isStoredDark = DARK_COLORS.includes(storedColor);
    if (isDark && !isStoredDark) {
      return COLOR_MAP[storedColor] || storedColor;
    }
    if (!isDark && isStoredDark) {
      return COLOR_MAP[storedColor] || storedColor;
    }
    return storedColor;
  };

  const displayColor = getDisplayColor(card.color);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isOwnCard) return;
    setIsDragging(true);
    startPos.current = { x: card.x, y: card.y };
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      onMove(card.id, x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const x = touch.clientX - dragOffset.current.x;
        const y = touch.clientY - dragOffset.current.y;
        onMove(card.id, x, y);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      if (card.x !== startPos.current.x || card.y !== startPos.current.y) {
        onPersistMove(card.id, card.x, card.y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, card.id, card.x, card.y, onMove, onPersistMove]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onType(card.id, e.target.value);
  };

  const handleContentBlur = () => {
    setIsEditing(false);
    onPersistContent(card.id, card.content);
  };

  const handleColorChange = (color: string) => {
    onChangeColor(card.id, color);
    onPersistColor(card.id, color);
  };

  const handleDelete = () => {
    onDelete(card.id);
    onPersistDelete(card.id);
  };

  const handleVote = () => {
    if (canVote) {
      onVote(card.id);
    }
  };

  const handleRefine = async () => {
    if (!card.content.trim() || isRefining || !isOwnCard) return;
    
    const contentBeforeRefine = card.content;
    setIsRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: card.content }),
      });
      
      if (res.ok) {
        const { refined } = await res.json();
        if (refined && refined.trim()) {
          setPreviousContent(contentBeforeRefine);
          onType(card.id, refined);
          onPersistContent(card.id, refined);
        }
      }
    } catch {
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndo = () => {
    if (previousContent !== null) {
      onType(card.id, previousContent);
      onPersistContent(card.id, previousContent);
      setPreviousContent(null);
    }
  };

  const canRefine = isOwnCard && card.content.trim().length > 10;
  const canUndo = isOwnCard && previousContent !== null;

  const textColorClass = "text-black/80";
  const mutedTextClass = "text-black/50";
  const borderClass = "border-black/15";
  const iconClass = "text-black/40";
  const hoverBgClass = "hover:bg-black/10";

  return (
    <div
      ref={cardRef}
      className={`absolute group touch-none transition-[width] duration-200 ${isExpanded ? "w-72 sm:w-96" : "w-40 sm:w-56"}`}
      style={{
        left: card.x,
        top: card.y,
        cursor: isOwnCard ? (isDragging ? "grabbing" : "grab") : "default",
        zIndex: isDragging ? 1000 : isExpanded ? 100 : 1,
        transition: isDragging ? "width 200ms" : "left 20ms ease-out, top 20ms ease-out, width 200ms",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="rounded-lg shadow-lg transition-shadow hover:shadow-xl"
        style={{ backgroundColor: displayColor }}
      >
        <div className={`flex items-center justify-between p-1.5 sm:p-2 border-b ${borderClass}`}>
          <GripVertical className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconClass}`} />
          <div
            className="flex items-center gap-0.5 sm:gap-1"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {isOwnCard && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-black/20 ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity cursor-pointer`}
                    style={{ backgroundColor: displayColor }}
                  />
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-2 z-[1001]" 
                  align="end" 
                  sideOffset={5}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-1.5 sm:gap-2">
                    {colors.map((color, index) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 hover:scale-110 transition-all cursor-pointer"
                        style={{
                          backgroundColor: color,
                          borderColor: displayColor === color ? "rgba(0,0,0,0.5)" : "transparent",
                        }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {canUndo && (
              <motion.button
                type="button"
                onClick={handleUndo}
                whileTap={{ scale: 0.9 }}
                className={`p-0.5 sm:p-1 rounded ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${hoverBgClass} transition-all cursor-pointer`}
                title="Undo AI changes"
              >
                <Undo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black/50" />
              </motion.button>
            )}
            {canRefine && (
              <motion.button
                type="button"
                onClick={handleRefine}
                disabled={isRefining}
                whileTap={{ scale: 0.9 }}
                className={`p-0.5 sm:p-1 rounded ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${hoverBgClass} transition-all cursor-pointer disabled:cursor-wait`}
                title="Refine with AI"
              >
                {isRefining ? (
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black/50 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black/50" />
                )}
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              whileTap={{ scale: 0.9 }}
              className={`p-0.5 sm:p-1 rounded ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${hoverBgClass} transition-all cursor-pointer`}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black/50" />
              ) : (
                <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black/50" />
              )}
            </motion.button>
            {isOwnCard && (
              <button
                type="button"
                onClick={handleDelete}
                className={`p-0.5 sm:p-1 rounded ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${hoverBgClass} transition-all cursor-pointer`}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/50" />
              </button>
            )}
          </div>
        </div>
        <div 
          className="p-2 sm:p-3" 
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <Textarea
              autoFocus
              value={card.content}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              className={`resize-none bg-transparent border-none p-0 ${isExpanded ? "text-sm sm:text-base" : "text-xs sm:text-sm"} ${textColorClass} focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:${mutedTextClass} overflow-y-auto transition-all duration-200 ${isExpanded ? "min-h-[120px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px]" : "min-h-[60px] sm:min-h-[80px] max-h-[120px] sm:max-h-[160px]"}`}
              placeholder="Type your idea..."
            />
          ) : (
            <div
              onClick={() => isOwnCard && setIsEditing(true)}
              className={`overflow-y-auto ${isExpanded ? "text-sm sm:text-base" : "text-xs sm:text-sm"} ${textColorClass} ${isOwnCard ? "cursor-text" : "cursor-default"} transition-all duration-200 ${isExpanded ? "min-h-[120px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px]" : "min-h-[60px] sm:min-h-[80px] max-h-[120px] sm:max-h-[160px]"}`}
            >
              {card.content ? (
                <Markdown
                  components={{
                    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 last:mb-0 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 last:mb-0 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => <code className="px-1 py-0.5 rounded text-[10px] sm:text-xs bg-black/10">{children}</code>,
                    h1: ({ children }) => <h1 className="font-bold text-sm sm:text-base mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-bold text-xs sm:text-sm mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-semibold text-xs sm:text-sm mb-0.5">{children}</h3>,
                  }}
                >
                  {card.content}
                </Markdown>
              ) : (
                <span className={mutedTextClass}>
                  {isOwnCard ? (isMobile ? "Tap to edit..." : "Click to add idea...") : "No content yet"}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center justify-between px-2 sm:px-3 pb-1.5 sm:pb-2 border-t ${borderClass} pt-1.5 sm:pt-2`}>
          <span className={`text-[10px] sm:text-xs ${mutedTextClass} truncate max-w-[70px] sm:max-w-[100px]`}>
            {card.createdBy}
          </span>
          <div
            className="flex items-center gap-1 sm:gap-1.5"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <span className={`text-[10px] sm:text-xs font-medium tabular-nums ${mutedTextClass}`}>
              <NumberFlow value={card.votes} format={{ notation: "compact" }} />
            </span>
            <motion.button
              type="button"
              whileTap={canVote ? { scale: 0.85 } : undefined}
              onClick={handleVote}
              disabled={!canVote}
              className={`p-0.5 sm:p-1 rounded-full transition-all ${
                !canVote
                  ? "opacity-30 cursor-not-allowed"
                  : hasVoted
                    ? "bg-black/20 text-black"
                    : `${hoverBgClass} cursor-pointer`
              }`}
              title={isOwnCard ? "Can't vote on your own card" : hasVoted ? "Remove vote" : "Vote"}
            >
              <ChevronUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hasVoted ? "" : iconClass}`} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
