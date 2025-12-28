"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddCardButtonProps {
  onClick: () => void;
}

export function AddCardButton({ onClick }: AddCardButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      className="rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-card/80 backdrop-blur-sm border-border"
    >
      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
    </Button>
  );
}
