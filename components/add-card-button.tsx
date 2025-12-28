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
      className="h-8 w-8 sm:h-9 sm:w-9 bg-card/80 backdrop-blur-sm border-border"
    >
      <Plus className="w-4 h-4" />
    </Button>
  );
}
