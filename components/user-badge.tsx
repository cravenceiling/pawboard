"use client";

import Image from "next/image";
import { useMemo } from "react";

const CAT_AVATARS = [
  "/cat-blue.svg",
  "/cat-green.svg",
  "/cat-purple.svg",
  "/cat-yellow.svg",
];

interface UserBadgeProps {
  username: string;
}

export function UserBadge({ username }: UserBadgeProps) {
  const avatarSrc = useMemo(() => {
    return CAT_AVATARS[Math.floor(Math.random() * CAT_AVATARS.length)];
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-2 sm:px-3 h-8 sm:h-9 rounded-md bg-card/80 backdrop-blur-sm border border-border shadow-xs dark:bg-input/30 dark:border-input">
      <Image
        src={avatarSrc}
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
