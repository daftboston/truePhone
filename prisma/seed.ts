import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const models = [
  { name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", releaseYear: 2024 },
  { name: "iPhone 16 Pro", slug: "iphone-16-pro", releaseYear: 2024 },
  { name: "iPhone 16", slug: "iphone-16", releaseYear: 2024 },
  { name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", releaseYear: 2023 },
  { name: "iPhone 15 Pro", slug: "iphone-15-pro", releaseYear: 2023 },
  { name: "iPhone 15", slug: "iphone-15", releaseYear: 2023 },
  { name: "iPhone 14 Pro Max", slug: "iphone-14-pro-max", releaseYear: 2022 },
  { name: "iPhone 14 Pro", slug: "iphone-14-pro", releaseYear: 2022 },
  { name: "iPhone 14", slug: "iphone-14", releaseYear: 2022 },
  { name: "iPhone 13 Pro", slug: "iphone-13-pro", releaseYear: 2021 },
  { name: "iPhone 13", slug: "iphone-13", releaseYear: 2021 },
  { name: "iPhone 12", slug: "iphone-12", releaseYear: 2020 },
  { name: "iPhone SE (3.ª gen)", slug: "iphone-se-3", releaseYear: 2022 },
];

const colors = [
  { name: "Negro", hex: "#1C1C1E" },
  { name: "Blanco", hex: "#F5F5F7" },
  { name: "Azul", hex: "#3B82F6" },
  { name: "Verde", hex: "#22C55E" },
  { name: "Rosa", hex: "#FB7185" },
  { name: "Morado", hex: "#A855F7" },
  { name: "Titanio natural", hex: "#A8A29E" },
  { name: "Titanio negro", hex: "#44403C" },
  { name: "Titanio blanco", hex: "#E7E5E4" },
  { name: "Titanio azul", hex: "#57534E" },
  { name: "Dorado", hex: "#F59E0B" },
  { name: "Grafito", hex: "#52525B" },
];

/** Official-ish color sets mapped to our catalog names. */
const modelColorNames: Record<string, string[]> = {
  "iphone-16-pro-max": [
    "Titanio natural",
    "Titanio negro",
    "Titanio blanco",
    "Titanio azul",
  ],
  "iphone-16-pro": [
    "Titanio natural",
    "Titanio negro",
    "Titanio blanco",
    "Titanio azul",
  ],
  "iphone-16": ["Negro", "Blanco", "Rosa", "Verde", "Azul"],
  "iphone-15-pro-max": [
    "Titanio natural",
    "Titanio negro",
    "Titanio blanco",
    "Titanio azul",
  ],
  "iphone-15-pro": [
    "Titanio natural",
    "Titanio negro",
    "Titanio blanco",
    "Titanio azul",
  ],
  "iphone-15": ["Negro", "Azul", "Verde", "Dorado", "Rosa"],
  "iphone-14-pro-max": ["Morado", "Dorado", "Blanco", "Negro"],
  "iphone-14-pro": ["Morado", "Dorado", "Blanco", "Negro"],
  "iphone-14": ["Azul", "Morado", "Negro", "Blanco", "Rosa", "Dorado"],
  "iphone-13-pro": ["Grafito", "Dorado", "Blanco", "Azul", "Verde"],
  "iphone-13": ["Rosa", "Azul", "Negro", "Blanco", "Verde"],
  "iphone-12": ["Negro", "Blanco", "Rosa", "Verde", "Azul", "Morado"],
  "iphone-se-3": ["Negro", "Blanco", "Rosa"],
};

const storages = [64, 128, 256, 512, 1024];

async function main() {
  for (const model of models) {
    await prisma.iphoneModel.upsert({
      where: { slug: model.slug },
      update: { name: model.name, releaseYear: model.releaseYear },
      create: model,
    });
  }

  for (const color of colors) {
    await prisma.iphoneColor.upsert({
      where: { name: color.name },
      update: { hex: color.hex },
      create: color,
    });
  }

  for (const valueGb of storages) {
    await prisma.iphoneStorage.upsert({
      where: { valueGb },
      update: {},
      create: { valueGb },
    });
  }

  const allModels = await prisma.iphoneModel.findMany();
  const allColors = await prisma.iphoneColor.findMany();
  const colorByName = new Map(allColors.map((color) => [color.name, color]));

  let links = 0;
  for (const model of allModels) {
    const allowed = modelColorNames[model.slug] ?? [];
    for (const colorName of allowed) {
      const color = colorByName.get(colorName);
      if (!color) continue;
      await prisma.iphoneModelColor.upsert({
        where: {
          iphoneModelId_iphoneColorId: {
            iphoneModelId: model.id,
            iphoneColorId: color.id,
          },
        },
        update: {},
        create: {
          iphoneModelId: model.id,
          iphoneColorId: color.id,
        },
      });
      links += 1;
    }
  }

  console.log(
    `Seeded ${models.length} models, ${colors.length} colors, ${storages.length} storages, ${links} model↔color links.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
