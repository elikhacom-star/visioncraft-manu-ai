import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FavoriteButton({ isFavorite, onToggle, size = "sm", className = "" }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      className={cn(
        "transition-all duration-200",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        isFavorite
          ? "text-red-500 hover:text-red-600 hover:bg-red-50"
          : "text-slate-400 hover:text-red-400 hover:bg-red-50",
        className
      )}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        className={cn(
          size === "sm" ? "w-4 h-4" : "w-5 h-5",
          isFavorite && "fill-current"
        )}
      />
    </Button>
  );
}