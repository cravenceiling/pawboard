"use client";

import Image from "next/image";

interface UserBadgeProps {
  username: string;
  avatar: string;
}

export function UserBadge({ username, avatar }: UserBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-2 sm:px-3 h-8 sm:h-9 rounded-md bg-card/80 backdrop-blur-sm border border-border shadow-xs dark:bg-input/30 dark:border-input">
      <Image
        src={avatar}
        alt="Avatar"
        width={20}
        height={20}
        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
      />
      <span className="text-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
        {username}
      </span>
    </div>
  );
}
