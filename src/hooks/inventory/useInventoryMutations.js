// src/hooks/inventory/useInventoryMutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateInventory } from "../../services/inventoryService";

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  // payload: { updates: [{ productId, addQuantity|setQuantity, note? }] }
  const updateInventoryMutation = useMutation({
    mutationFn: (payload) => updateInventory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  return { updateInventoryMutation };
}
