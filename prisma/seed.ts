import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "ChatGPT", slug: "chatgpt", sort: 10 },
  { name: "Claude", slug: "claude", sort: 20 },
  { name: "Perplexity", slug: "perplexity", sort: 30 },
  { name: "Google", slug: "google", sort: 40 },
  { name: "Other", slug: "other", sort: 50 }
];

const sampleProducts = [
  {
    categorySlug: "chatgpt",
    title: "ChatGPT Plus Shared Account",
    slug: "chatgpt-plus-shared",
    description: "Shared access card for ChatGPT Plus testing.",
    price: "19.90",
    originalPrice: "29.90",
    icon: "sparkles",
    sort: 10
  },
  {
    categorySlug: "claude",
    title: "Claude Pro Trial Card",
    slug: "claude-pro-trial",
    description: "Claude Pro sample digital card for MVP storefront data.",
    price: "15.90",
    originalPrice: "25.90",
    icon: "bot",
    sort: 20
  },
  {
    categorySlug: "perplexity",
    title: "Perplexity Pro Access",
    slug: "perplexity-pro-access",
    description: "Perplexity Pro sample access code.",
    price: "12.90",
    originalPrice: "19.90",
    icon: "search",
    sort: 30
  },
  {
    categorySlug: "google",
    title: "Google Gemini Sample Card",
    slug: "google-gemini-sample",
    description: "Gemini sample card for local development.",
    price: "9.90",
    originalPrice: "16.90",
    icon: "badge",
    sort: 40
  }
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before running prisma/seed.ts");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      enabled: true
    },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash
    }
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        enabled: true,
        sort: category.sort
      },
      create: {
        ...category,
        enabled: true
      }
    });
  }

  const categoryBySlug = new Map(
    (await prisma.category.findMany()).map((category) => [category.slug, category])
  );

  for (const product of sampleProducts) {
    const category = categoryBySlug.get(product.categorySlug);

    if (!category) {
      throw new Error(`Missing seed category: ${product.categorySlug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        categoryId: category.id,
        title: product.title,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        icon: product.icon,
        enabled: true,
        sort: product.sort
      },
      create: {
        categoryId: category.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: 0,
        icon: product.icon,
        enabled: true,
        sort: product.sort
      }
    });
  }

  const inventoryProduct = await prisma.product.findUniqueOrThrow({
    where: { slug: "chatgpt-plus-shared" }
  });

  const existingInventoryCount = await prisma.inventoryItem.count({
    where: { productId: inventoryProduct.id }
  });

  if (existingInventoryCount === 0) {
    await prisma.inventoryItem.createMany({
      data: Array.from({ length: 20 }, (_, index) => {
        const itemNumber = index + 1;

        return {
          productId: inventoryProduct.id,
          secret: `CHATGPT-PLUS-SAMPLE-${String(itemNumber).padStart(3, "0")}`
        };
      })
    });
  }

  const availableInventoryCount = await prisma.inventoryItem.count({
    where: {
      productId: inventoryProduct.id,
      status: "AVAILABLE"
    }
  });

  await prisma.product.update({
    where: { id: inventoryProduct.id },
    data: { stock: availableInventoryCount }
  });

  await prisma.paymentChannel.upsert({
    where: { code: "manual" },
    update: {
      name: "Manual Payment",
      type: "manual",
      config: {
        instructions: "Manual test channel for local MVP verification."
      },
      enabled: true,
      sort: 10
    },
    create: {
      name: "Manual Payment",
      code: "manual",
      type: "manual",
      config: {
        instructions: "Manual test channel for local MVP verification."
      },
      enabled: true,
      sort: 10
    }
  });

  const settings = [
    { key: "shopName", value: "Card Shop" },
    {
      key: "announcement",
      value: "Welcome to the Card Shop MVP. Orders are delivered automatically after payment."
    },
    {
      key: "supportText",
      value: "Need help? Send your order number and contact email through the support widget."
    }
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
