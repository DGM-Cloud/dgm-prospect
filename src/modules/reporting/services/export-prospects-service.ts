import ExcelJS from "exceljs";
import type { ProspectStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import type { ExportProspectsBody } from "../schemas/export-prospects";

export type ExportProspectRow = {
  id: string;
  businessName: string;
  category: string;
  status: string;
  source: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  notes: string;
  assignedTo: string;
  osmType: string;
  osmId: string;
  latitude: string;
  longitude: string;
  provenance: string;
  discoveredAt: string;
  updatedAt: string;
};

function toRow(prospect: {
  id: string;
  businessName: string;
  category: string | null;
  status: string;
  source: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: { fullName: string } | null;
  osmPlace: {
    osmType: string;
    osmId: bigint;
    latitude: number;
    longitude: number;
  } | null;
}): ExportProspectRow {
  return {
    id: prospect.id,
    businessName: prospect.businessName,
    category: prospect.category ?? "",
    status: prospect.status,
    source: prospect.source,
    address: prospect.address ?? "",
    phone: prospect.phone ?? "",
    email: prospect.email ?? "",
    website: prospect.website ?? "",
    instagram: prospect.instagram ?? "",
    facebook: prospect.facebook ?? "",
    notes: prospect.notes ?? "",
    assignedTo: prospect.assignedTo?.fullName ?? "",
    osmType: prospect.osmPlace?.osmType ?? "",
    osmId: prospect.osmPlace ? prospect.osmPlace.osmId.toString() : "",
    latitude: prospect.osmPlace ? String(prospect.osmPlace.latitude) : "",
    longitude: prospect.osmPlace ? String(prospect.osmPlace.longitude) : "",
    provenance: prospect.osmPlace
      ? "OpenStreetMap (ODbL) via Overpass"
      : prospect.source,
    discoveredAt: prospect.createdAt.toISOString(),
    updatedAt: prospect.updatedAt.toISOString(),
  };
}

const COLUMNS: Array<{ key: keyof ExportProspectRow; header: string }> = [
  { key: "id", header: "id" },
  { key: "businessName", header: "business_name" },
  { key: "category", header: "category" },
  { key: "status", header: "status" },
  { key: "source", header: "source" },
  { key: "address", header: "address" },
  { key: "phone", header: "phone" },
  { key: "email", header: "email" },
  { key: "website", header: "website" },
  { key: "instagram", header: "instagram" },
  { key: "facebook", header: "facebook" },
  { key: "notes", header: "notes" },
  { key: "assignedTo", header: "assigned_to" },
  { key: "osmType", header: "osm_type" },
  { key: "osmId", header: "osm_id" },
  { key: "latitude", header: "latitude" },
  { key: "longitude", header: "longitude" },
  { key: "provenance", header: "provenance" },
  { key: "discoveredAt", header: "discovered_at" },
  { key: "updatedAt", header: "updated_at" },
];

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class ExportProspectsService {
  async collectRows(filters: ExportProspectsBody): Promise<ExportProspectRow[]> {
    const prospects = await prisma.prospect.findMany({
      where: {
        ...(filters.status
          ? { status: filters.status as ProspectStatus }
          : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.campaignId
          ? {
              campaigns: {
                some: { campaignId: filters.campaignId },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: true,
        osmPlace: true,
      },
    });

    return prospects.map(toRow);
  }

  toCsv(rows: ExportProspectRow[]): string {
    const header = COLUMNS.map((column) => column.header).join(",");
    const lines = rows.map((row) =>
      COLUMNS.map((column) => escapeCsv(String(row[column.key] ?? ""))).join(
        ",",
      ),
    );
    return [header, ...lines].join("\n");
  }

  async toXlsx(rows: ExportProspectRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DGM Prospect";
    const sheet = workbook.addWorksheet("Prospects");

    sheet.columns = COLUMNS.map((column) => ({
      header: column.header,
      key: column.key,
      width: 18,
    }));

    for (const row of rows) {
      sheet.addRow(row);
    }

    sheet.getRow(1).font = { bold: true };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const exportProspectsService = new ExportProspectsService();
