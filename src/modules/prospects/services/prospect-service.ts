import type { ProspectStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { activityRepository } from "@/modules/activities/repositories/activity-repository";
import { prospectRepository } from "../repositories/prospect-repository";
import type { UpdateProspectBody } from "../schemas/update-prospect";

export class ProspectConflictError extends Error {
  constructor(
    message: string,
    readonly existingProspectId: string,
  ) {
    super(message);
    this.name = "ProspectConflictError";
  }
}

export class ProspectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProspectNotFoundError";
  }
}

export class ProspectService {
  async list(params: {
    search?: string;
    status?: ProspectStatus;
    category?: string;
    assignedToId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

    const { items, total } = await prospectRepository.list({
      search: params.search,
      status: params.status,
      category: params.category,
      assignedToId: params.assignedToId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async getById(id: string) {
    return prospectRepository.findById(id);
  }

  async listCategories() {
    return prospectRepository.distinctCategories();
  }

  async createFromOsmPlace(params: {
    osmPlaceId: string;
    notes?: string;
    assignedToId?: string | null;
    actorUserId?: string | null;
  }) {
    const place = await prisma.osmPlace.findUnique({
      where: { id: params.osmPlaceId },
    });

    if (!place) {
      throw new ProspectNotFoundError("OSM place not found");
    }

    const existing = await prospectRepository.findByOsmPlaceId(place.id);
    if (existing) {
      throw new ProspectConflictError(
        "A prospect already exists for this OSM place",
        existing.id,
      );
    }

    const tags =
      place.tags && typeof place.tags === "object" && !Array.isArray(place.tags)
        ? (place.tags as Record<string, string>)
        : {};

    const composedAddress = [
      tags["addr:street"],
      tags["addr:housenumber"],
      tags["addr:city"],
    ]
      .filter(Boolean)
      .join(", ");

    const prospect = await prospectRepository.create({
      businessName: place.name?.trim() || `OSM ${place.osmType}/${place.osmId}`,
      category: place.category,
      address: tags["addr:full"] ?? (composedAddress || null),
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
      email: tags.email ?? tags["contact:email"] ?? null,
      instagram: tags["contact:instagram"] ?? null,
      facebook: tags["contact:facebook"] ?? null,
      status: "DISCOVERED",
      source: "OSM",
      notes: params.notes,
      osmPlace: { connect: { id: place.id } },
      ...(params.assignedToId
        ? { assignedTo: { connect: { id: params.assignedToId } } }
        : {}),
    });

    if (params.actorUserId) {
      await activityRepository.create({
        activityType: "NOTE",
        description: "Prospecto creado desde Business Explorer (OSM).",
        prospect: { connect: { id: prospect.id } },
        user: { connect: { id: params.actorUserId } },
      });
    }

    return prospect;
  }

  async update(
    id: string,
    input: UpdateProspectBody,
    actorUserId: string,
  ) {
    const existing = await prospectRepository.findById(id);
    if (!existing) {
      throw new ProspectNotFoundError("Prospect not found");
    }

    if (input.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: input.assignedToId },
      });
      if (!assignee) {
        throw new ProspectNotFoundError("Assignee user not found");
      }
    }

    const email =
      input.email === ""
        ? null
        : input.email === undefined
          ? undefined
          : input.email;

    const updated = await prospectRepository.update(id, {
      ...(input.businessName !== undefined
        ? { businessName: input.businessName }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.instagram !== undefined ? { instagram: input.instagram } : {}),
      ...(input.facebook !== undefined ? { facebook: input.facebook } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.assignedToId !== undefined
        ? input.assignedToId
          ? { assignedTo: { connect: { id: input.assignedToId } } }
          : { assignedTo: { disconnect: true } }
        : {}),
    });

    if (input.status && input.status !== existing.status) {
      await activityRepository.create({
        activityType: "STATUS_CHANGE",
        description: `Estado: ${existing.status} → ${input.status}`,
        prospect: { connect: { id } },
        user: { connect: { id: actorUserId } },
      });
    }

    if (
      input.assignedToId !== undefined &&
      input.assignedToId !== existing.assignedToId
    ) {
      const label = updated.assignedTo?.fullName ?? "sin asignar";
      await activityRepository.create({
        activityType: "ASSIGNMENT",
        description: `Asignado a: ${label}`,
        prospect: { connect: { id } },
        user: { connect: { id: actorUserId } },
      });
    }

    if (input.notes !== undefined && input.notes !== existing.notes) {
      await activityRepository.create({
        activityType: "NOTE",
        description: "Notas internas actualizadas.",
        prospect: { connect: { id } },
        user: { connect: { id: actorUserId } },
      });
    }

    return prospectRepository.findById(id);
  }
}

export const prospectService = new ProspectService();
