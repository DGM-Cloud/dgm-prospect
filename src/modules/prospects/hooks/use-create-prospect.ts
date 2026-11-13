"use client";

import { useMutation } from "@tanstack/react-query";

type CreateProspectInput = {
  osmPlaceId: string;
  notes?: string;
};

export function useCreateProspect() {
  return useMutation({
    mutationFn: async (input: CreateProspectInput) => {
      const response = await fetch("/api/v1/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = await response.json();
      if (!response.ok) {
        const message =
          payload.code === "DUPLICATE_PROSPECT"
            ? "Este negocio ya está guardado como prospecto"
            : (payload.error ?? "No se pudo guardar el prospecto");
        throw new Error(message);
      }

      return payload.data;
    },
  });
}
