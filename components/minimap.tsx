"use client";

import { Card } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MinimapProps {
  cards: Card[];
  pan: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate: (worldPoint: { x: number; y: number }) => void;
  onZoom?: (worldPoint: { x: number; y: number }, delta: number) => void;
  className?: string;
}

const CARD_WIDTH = 224;
const CARD_HEIGHT = 160;
const CARD_WIDTH_MOBILE = 160;
const CARD_HEIGHT_MOBILE = 120;

export function Minimap({
  cards,
  pan,
  zoom,
  viewportWidth,
  viewportHeight,
  onNavigate,
  onZoom,
  className,
}: MinimapProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH;
  const cardHeight = isMobile ? CARD_HEIGHT_MOBILE : CARD_HEIGHT;

  // Theme detection for dynamic styling
  const { theme } = useTheme();
  const backgroundColor =
    theme === "dark" ? "hsl(224, 71%, 4%)" : "hsl(0, 0%, 98%)";
  const patternColor =
    theme === "dark" ? "hsl(215, 25%, 27%)" : "hsl(0, 0%, 50%)";
  const patternOpacity = theme === "dark" ? "0.25" : "0.08";

  // State for drag navigation
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate world bounds (all cards + padding)
  const worldBounds = useMemo(() => {
    if (cards.length === 0) {
      return { minX: -500, minY: -500, maxX: 500, maxY: 500 };
    }

    const bounds = cards.reduce(
      (acc, card) => ({
        minX: Math.min(acc.minX, card.x),
        minY: Math.min(acc.minY, card.y),
        maxX: Math.max(acc.maxX, card.x + cardWidth),
        maxY: Math.max(acc.maxY, card.y + cardHeight),
      }),
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      }
    );

    // Add padding
    const padding = 200;
    return {
      minX: bounds.minX - padding,
      minY: bounds.minY - padding,
      maxX: bounds.maxX + padding,
      maxY: bounds.maxY + padding,
    };
  }, [cards, cardWidth, cardHeight]);

  const worldWidth = worldBounds.maxX - worldBounds.minX;
  const worldHeight = worldBounds.maxY - worldBounds.minY;

  // Minimap dimensions (slightly wider than zoom controls)
  const minimapSize = isMobile ? 165 : 178;
  const minimapPadding = 8;

  // Scale factor to fit world in minimap
  const scaleX = (minimapSize - minimapPadding * 2) / worldWidth;
  const scaleY = (minimapSize - minimapPadding * 2) / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Convert world coordinates to minimap coordinates
  const worldToMinimap = useCallback(
    (worldX: number, worldY: number) => ({
      x: minimapPadding + (worldX - worldBounds.minX) * scale,
      y: minimapPadding + (worldY - worldBounds.minY) * scale,
    }),
    [worldBounds, scale, minimapPadding]
  );

  // Calculate current viewport bounds in world coordinates
  const viewportBounds = useMemo(() => {
    const worldTopLeft = {
      x: -pan.x / zoom,
      y: -pan.y / zoom,
    };
    const worldBottomRight = {
      x: worldTopLeft.x + viewportWidth / zoom,
      y: worldTopLeft.y + viewportHeight / zoom,
    };

    return {
      x: worldTopLeft.x,
      y: worldTopLeft.y,
      width: worldBottomRight.x - worldTopLeft.x,
      height: worldBottomRight.y - worldTopLeft.y,
    };
  }, [pan, zoom, viewportWidth, viewportHeight]);

  // Convert viewport bounds to minimap coordinates
  const minimapViewport = useMemo(() => {
    const topLeft = worldToMinimap(viewportBounds.x, viewportBounds.y);
    const bottomRight = worldToMinimap(
      viewportBounds.x + viewportBounds.width,
      viewportBounds.y + viewportBounds.height
    );

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [viewportBounds, worldToMinimap]);

  // Convert minimap coordinates to world coordinates
  const minimapToWorld = useCallback(
    (minimapX: number, minimapY: number) => ({
      x: worldBounds.minX + (minimapX - minimapPadding) / scale,
      y: worldBounds.minY + (minimapY - minimapPadding) / scale,
    }),
    [worldBounds, scale, minimapPadding]
  );

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;

      event.preventDefault();
      setIsDragging(true);

      const rect = svgRef.current.getBoundingClientRect();
      const minimapX = event.clientX - rect.left;
      const minimapY = event.clientY - rect.top;
      const worldPoint = minimapToWorld(minimapX, minimapY);

      onNavigate(worldPoint);
    },
    [minimapToWorld, onNavigate]
  );

  // Handle mouse move while dragging
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const minimapX = event.clientX - rect.left;
      const minimapY = event.clientY - rect.top;

      // Clamp coordinates to minimap bounds
      const clampedX = Math.max(
        minimapPadding,
        Math.min(minimapSize - minimapPadding, minimapX)
      );
      const clampedY = Math.max(
        minimapPadding,
        Math.min(minimapSize - minimapPadding, minimapY)
      );

      const worldPoint = minimapToWorld(clampedX, clampedY);
      onNavigate(worldPoint);
    },
    [isDragging, minimapToWorld, minimapSize, minimapPadding, onNavigate]
  );

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      if (!onZoom || !svgRef.current) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = svgRef.current.getBoundingClientRect();
      const minimapX = event.clientX - rect.left;
      const minimapY = event.clientY - rect.top;

      // Clamp coordinates to minimap bounds
      const clampedX = Math.max(
        minimapPadding,
        Math.min(minimapSize - minimapPadding, minimapX)
      );
      const clampedY = Math.max(
        minimapPadding,
        Math.min(minimapSize - minimapPadding, minimapY)
      );

      const worldPoint = minimapToWorld(clampedX, clampedY);

      // deltaY > 0 = zoom out, deltaY < 0 = zoom in
      onZoom(worldPoint, event.deltaY);
    },
    [onZoom, minimapToWorld, minimapSize, minimapPadding]
  );

  // Set up global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (cards.length === 0) {
    return null; // Don't show minimap if no cards
  }

  return (
    <div className={cn("relative group", className)}>
      <svg
        ref={svgRef}
        width={minimapSize}
        height={minimapSize}
        viewBox={`0 0 ${minimapSize} ${minimapSize}`}
        className="bg-card/95 backdrop-blur-md border border-border/70 rounded-xl shadow-lg transition-all duration-200 hover:shadow-2xl hover:scale-105 hover:bg-card"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {/* Background with subtle pattern */}
        <defs>
          <pattern
            id="minimap-bg-pattern"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="6"
              cy="6"
              r="0.8"
              fill={patternColor}
              opacity={patternOpacity}
            />
          </pattern>
          <mask id="minimap-mask">
            <rect
              width={minimapSize}
              height={minimapSize}
              fill="white"
              rx="12"
            />
          </mask>
        </defs>
        <rect
          width={minimapSize}
          height={minimapSize}
          fill={backgroundColor}
          mask="url(#minimap-mask)"
        />
        <rect
          width={minimapSize}
          height={minimapSize}
          fill="url(#minimap-bg-pattern)"
          mask="url(#minimap-mask)"
          opacity={theme === "dark" ? "0.7" : "0.4"}
        />

        {/* Cards as mini rectangles */}
        {cards.map((card) => {
          const topLeft = worldToMinimap(card.x, card.y);
          const bottomRight = worldToMinimap(
            card.x + cardWidth,
            card.y + cardHeight
          );

          let width = Math.max(1, bottomRight.x - topLeft.x);
          let height = Math.max(1, bottomRight.y - topLeft.y);

          // Adjust aspect ratio to be more vertical than original cards
          // Original cards are ~224:160 = 1.4:1 (width:height)
          // We'll make them ~0.9:1 for more vertical appearance
          const originalAspectRatio = cardWidth / cardHeight; // ~1.4
          const targetAspectRatio = 0.9; // More vertical than original

          const currentAspectRatio = width / height;
          if (currentAspectRatio > targetAspectRatio) {
            width = height * targetAspectRatio;
          }

          return (
            <rect
              key={card.id}
              x={topLeft.x}
              y={topLeft.y}
              width={width}
              height={height}
              fill={card.color}
              stroke="hsl(var(--background))"
              strokeWidth="1.5"
              opacity={1}
              rx="1"
              className="transition-all duration-150 hover:opacity-100"
              style={{
                filter:
                  "drop-shadow(0 0 4px hsl(var(--foreground) / 0.2)) drop-shadow(0 0 8px hsl(var(--card) / 0.3))",
              }}
            />
          );
        })}

        {/* Viewport indicator with modern styling */}
        <rect
          x={minimapViewport.x}
          y={minimapViewport.y}
          width={minimapViewport.width}
          height={minimapViewport.height}
          fill="hsl(var(--primary))"
          fillOpacity="0.3"
          stroke="hsl(var(--foreground))"
          strokeWidth={isMobile ? 2.5 : 3}
          opacity={1}
          rx="4"
          className="transition-all duration-300 ease-out"
          style={{
            filter:
              "drop-shadow(0 0 10px hsl(var(--primary) / 0.8)) drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
          }}
        />

        {/* Inner viewport highlight with subtle border */}
        <rect
          x={minimapViewport.x + 2}
          y={minimapViewport.y + 2}
          width={Math.max(0, minimapViewport.width - 4)}
          height={Math.max(0, minimapViewport.height - 4)}
          fill="none"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          opacity="0.95"
          rx="3"
        />
      </svg>
    </div>
  );
}
