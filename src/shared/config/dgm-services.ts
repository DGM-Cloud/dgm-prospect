/**
 * Commercial services DGM CLOUD can offer — used when logging opportunities.
 */
export const DGM_SERVICES = [
  {
    id: "web_presence",
    label: "Presencia web / sitio",
  },
  {
    id: "social_management",
    label: "Gestión de redes sociales",
  },
  {
    id: "cloud_infrastructure",
    label: "Infraestructura cloud",
  },
  {
    id: "automation",
    label: "Automatización operativa",
  },
  {
    id: "analytics",
    label: "Analítica y reportes",
  },
  {
    id: "other",
    label: "Otro servicio DGM",
  },
] as const;

export type DgmServiceId = (typeof DGM_SERVICES)[number]["id"];
