"use client";

interface UserBadgeProps {
  username: string;
}

export function UserBadge({ username }: UserBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-foreground/60 animate-pulse" />
      <span className="text-foreground text-xs sm:text-sm font-medium max-w-[80px] sm:max-w-none truncate">{username}</span>
    </div>
  );
}
