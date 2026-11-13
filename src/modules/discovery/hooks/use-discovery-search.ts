"use client";

import { useMutation } from "@tanstack/react-query";
import type { DiscoveryProviderName } from "@/shared/config/business-categories";
import type { SearchRadiusKm } from "@/shared/config/business-categories";
import type { DiscoverySearchData } from "../types/client";

type SearchInput = {
  latitude: number;
  longitude: number;
  radiusKm: SearchRadiusKm;
  categoryIds: string[];
  provider?: DiscoveryProviderName;
};

export function useDiscoverySearch() {
  return useMutation({
    mutationFn: async (input: SearchInput): Promise<DiscoverySearchData> => {
      const response = await fetch("/api/v1/discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, persist: true }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Discovery search failed");
      }

      return payload.data as DiscoverySearchData;
    },
  });
}
