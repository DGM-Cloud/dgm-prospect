import { overtureProvider } from "../src/infrastructure/overture/overture-provider";
import { BUSINESS_CATEGORIES } from "../src/shared/config/business-categories";

async function main() {
  const categories = BUSINESS_CATEGORIES.filter((c) => c.id === "cafes");
  console.log("Querying Overture Places (Miraflores, cafes, 1km)…");
  const result = await overtureProvider.search({
    center: { latitude: -12.1211, longitude: -77.0299 },
    radiusKm: 1,
    categories,
  });
  console.log(
    JSON.stringify(
      {
        provider: result.provider,
        total: result.businesses.length,
        sample: result.businesses.slice(0, 5).map((b) => ({
          name: b.name,
          category: b.category,
          lat: b.latitude,
          lng: b.longitude,
          osmType: b.osmType,
          overtureId: b.tags.overture_id,
        })),
        attribution: result.attribution,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
