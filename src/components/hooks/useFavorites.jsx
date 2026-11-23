import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function useFavorites() {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => base44.entities.Favorite.list("-created_date"),
  });

  const addFavorite = useMutation({
    mutationFn: (data) => base44.entities.Favorite.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Ajouté aux favoris ⭐");
    },
  });

  const removeFavorite = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Retiré des favoris");
    },
  });

  const isFavorite = (itemType, itemId) => {
    return favorites.some(
      (f) => f.item_type === itemType && f.item_id === itemId
    );
  };

  const getFavoriteId = (itemType, itemId) => {
    const fav = favorites.find(
      (f) => f.item_type === itemType && f.item_id === itemId
    );
    return fav?.id;
  };

  const toggleFavorite = (itemType, itemId, itemData = {}) => {
    if (isFavorite(itemType, itemId)) {
      const favId = getFavoriteId(itemType, itemId);
      if (favId) removeFavorite.mutate(favId);
    } else {
      addFavorite.mutate({
        item_type: itemType,
        item_id: itemId,
        ...itemData,
      });
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
}