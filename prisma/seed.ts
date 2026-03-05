import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed forum categories
  const categories = [
    {
      name: "General Discussion",
      slug: "general",
      description: "Talk about anything gaming-related — news, industry talk, recommendations.",
      sortOrder: 0,
      color: "#8b92a5",
    },
    {
      name: "Help & Tips",
      slug: "help",
      description: "Stuck on a boss? Need a walkthrough? Ask for help or share your tips.",
      sortOrder: 1,
      color: "#3b82f6",
    },
    {
      name: "Game Talk",
      slug: "game-talk",
      description: "Deep dives, theories, and discussions about specific games.",
      sortOrder: 2,
      color: "#22c55e",
    },
    {
      name: "Off-Topic",
      slug: "off-topic",
      description: "Movies, music, life — anything goes as long as it's respectful.",
      sortOrder: 3,
      color: "#a855f7",
    },
  ];

  for (const category of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("✓ Seeded forum categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
