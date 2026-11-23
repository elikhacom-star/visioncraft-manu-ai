import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, LayoutTemplate, Image as ImageIcon, Trash2, Film, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useFavorites from "../components/hooks/useFavorites";
import PullToRefresh from "../components/mobile/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

export default function Favorites() {
  const { favorites, isLoading, removeFavorite } = useFavorites();
  const [tab, setTab] = useState("all");
  const queryClient = useQueryClient();

  const handlePullRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  const filtered = favorites.filter((f) => {
    if (tab === "all") return true;
    return f.item_type === tab;
  });

  const templateFavs = favorites.filter((f) => f.item_type === "template");
  const sceneFavs = favorites.filter((f) => f.item_type === "scene");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl shadow-lg mb-4">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes Favoris</h1>
          <p className="text-slate-500">
            {favorites.length === 0
              ? "Vous n'avez pas encore de favoris. Ajoutez des templates ou scènes en cliquant sur le ♥"
              : `${favorites.length} élément${favorites.length > 1 ? "s" : ""} sauvegardé${favorites.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="all" className="gap-2">
              Tous
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {favorites.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <LayoutTemplate className="w-3 h-3" />
              Templates
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {templateFavs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="scene" className="gap-2">
              <ImageIcon className="w-3 h-3" />
              Scènes
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {sceneFavs.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {filtered.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map((fav) => (
                    <FavoriteCard
                      key={fav.id}
                      favorite={fav}
                      onRemove={() => removeFavorite(fav.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </PullToRefresh>
  );
}

function FavoriteCard({ favorite, onRemove }) {
  const isTemplate = favorite.item_type === "template";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-amber-200">
        {/* Thumbnail */}
        {favorite.item_thumbnail ? (
          <div className="relative aspect-video bg-slate-100 overflow-hidden">
            <img
              src={favorite.item_thumbnail}
              alt={favorite.item_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
            {isTemplate ? (
              <LayoutTemplate className="w-10 h-10 text-amber-300" />
            ) : (
              <Film className="w-10 h-10 text-amber-300" />
            )}
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate text-sm">
                {favorite.item_name}
              </h3>
              {favorite.item_description && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {favorite.item_description}
                </p>
              )}
            </div>
            <Badge
              variant="secondary"
              className={`text-[10px] shrink-0 ${
                isTemplate
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {isTemplate ? "Template" : "Scène"}
            </Badge>
          </div>

          {favorite.item_category && (
            <Badge variant="outline" className="text-[10px] mb-3">
              {favorite.item_category}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 mt-2 h-8 text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1.5" />
            Retirer des favoris
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ tab }) {
  const messages = {
    all: "Aucun favori pour le moment",
    template: "Aucun template en favori",
    scene: "Aucune scène en favori",
  };
  return (
    <div className="text-center py-16">
      <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 text-lg">{messages[tab]}</p>
      <p className="text-slate-400 text-sm mt-2">
        Cliquez sur ♥ pour ajouter des éléments ici
      </p>
    </div>
  );
}