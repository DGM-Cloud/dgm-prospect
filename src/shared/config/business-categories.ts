/**
 * Centralized commercial categories mapped to OSM tags and Overture taxonomy.
 */
export type BusinessCategoryConfig = {
  id: string;
  label: string;
  osmTags: Array<{ key: string; value: string }>;
  /** Overture `basic_category` / `taxonomy.primary` values */
  overtureCategories: string[];
};

export const BUSINESS_CATEGORIES: BusinessCategoryConfig[] = [
  {
    id: "restaurants",
    label: "Restaurantes",
    osmTags: [{ key: "amenity", value: "restaurant" }],
    overtureCategories: [
      "restaurant",
      "casual_eatery",
      "fine_dining_restaurant",
      "pizza_restaurant",
      "seafood_restaurant",
      "steak_house",
      "fast_food_restaurant",
    ],
  },
  {
    id: "cafes",
    label: "Cafeterías",
    osmTags: [
      { key: "amenity", value: "cafe" },
      { key: "amenity", value: "coffee_shop" },
    ],
    // Keep bakery out: Overture often mis-tags unrelated shops as bakery.
    overtureCategories: ["cafe", "coffee_shop", "tea_room"],
  },
  {
    id: "veterinary",
    label: "Veterinarias",
    osmTags: [{ key: "amenity", value: "veterinary" }],
    overtureCategories: ["veterinarian", "animal_hospital", "pet_service"],
  },
  {
    id: "barbers",
    label: "Barberías",
    osmTags: [
      { key: "shop", value: "hairdresser" },
      { key: "shop", value: "barber" },
    ],
    overtureCategories: ["barber", "hair_salon", "beauty_salon", "nail_salon"],
  },
  {
    id: "warehouses",
    label: "Bodegas",
    osmTags: [
      { key: "shop", value: "convenience" },
      { key: "shop", value: "grocery" },
    ],
    overtureCategories: [
      "convenience_store",
      "grocery_store",
      "supermarket",
      "bodega",
    ],
  },
  {
    id: "liquor",
    label: "Licorerías",
    osmTags: [
      { key: "shop", value: "alcohol" },
      { key: "shop", value: "wine" },
    ],
    overtureCategories: ["liquor_store", "wine_store", "beer_store"],
  },
  {
    id: "gyms",
    label: "Gimnasios",
    osmTags: [
      { key: "leisure", value: "fitness_centre" },
      { key: "leisure", value: "sports_centre" },
    ],
    overtureCategories: [
      "gym",
      "fitness_center",
      "fitness_centre",
      "sports_club",
      "yoga_studio",
    ],
  },
  {
    id: "dental",
    label: "Clínicas dentales",
    osmTags: [
      { key: "amenity", value: "dentist" },
      { key: "healthcare", value: "dentist" },
    ],
    overtureCategories: ["dentist", "dental_clinic", "orthodontist"],
  },
];

export const SEARCH_RADII_KM = [1, 3, 5, 10] as const;
export type SearchRadiusKm = (typeof SEARCH_RADII_KM)[number];

export const DISCOVERY_PROVIDERS = ["overture", "overpass", "both"] as const;
export type DiscoveryProviderName = (typeof DISCOVERY_PROVIDERS)[number];
