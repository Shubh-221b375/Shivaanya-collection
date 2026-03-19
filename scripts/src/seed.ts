import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const categories = [
  {
    name: "Sarees",
    slug: "sarees",
    description: "Timeless elegance woven into six yards of pure art",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
    productCount: 0,
  },
  {
    name: "Lehengas",
    slug: "lehengas",
    description: "Regal bridal and festive lehengas for every celebration",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    productCount: 0,
  },
  {
    name: "Salwar Suits",
    slug: "salwar-suits",
    description: "Graceful everyday elegance with traditional craftsmanship",
    imageUrl: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop",
    productCount: 0,
  },
  {
    name: "Anarkalis",
    slug: "anarkalis",
    description: "Flowing silhouettes inspired by Mughal court couture",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop",
    productCount: 0,
  },
  {
    name: "Dupattas",
    slug: "dupattas",
    description: "Hand-embroidered dupattas that complete every look",
    imageUrl: "https://images.unsplash.com/photo-1590736969596-701e0f5c3cec?w=800&auto=format&fit=crop",
    productCount: 0,
  },
  {
    name: "Kurtis",
    slug: "kurtis",
    description: "Contemporary Indian tops for the modern woman",
    imageUrl: "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=800&auto=format&fit=crop",
    productCount: 0,
  },
];

const products = [
  {
    name: "Kanjivaram Silk Saree in Royal Gold",
    description: "A breathtaking Kanjivaram silk saree featuring traditional zari work with peacock motifs. Hand-woven by master weavers in Kanchipuram over three weeks, this saree is a masterpiece of South Indian textile art.",
    price: "24500.00",
    originalPrice: "28000.00",
    categoryId: 1,
    categoryName: "Sarees",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b984a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop",
    ],
    fabric: "Pure Kanjivaram Silk",
    colors: ["Royal Gold", "Deep Burgundy", "Emerald Green"],
    sizes: ["Free Size (5.5m)"],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    rating: "4.9",
    reviewCount: 124,
    story: "Woven in the sacred city of Kanchipuram by fourth-generation weavers, each thread tells a story of devotion and artistry passed down through centuries.",
    craftRegion: "Kanchipuram, Tamil Nadu",
  },
  {
    name: "Banarasi Georgette Saree – Midnight Blue",
    description: "An ethereal Banarasi georgette saree adorned with delicate silver zari motifs on a midnight blue canvas. The sheer elegance of this saree makes it perfect for evening celebrations.",
    price: "18750.00",
    originalPrice: null,
    categoryId: 1,
    categoryName: "Sarees",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b984a?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4b984a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
    ],
    fabric: "Pure Banarasi Georgette",
    colors: ["Midnight Blue", "Rose Gold", "Ivory"],
    sizes: ["Free Size (5.5m)"],
    isFeatured: true,
    isNew: true,
    isBestseller: false,
    rating: "4.7",
    reviewCount: 87,
    story: "Born from the looms of Varanasi's ancient silk district, where weavers dream in threads of gold and silver under the watchful gaze of the Ganges.",
    craftRegion: "Varanasi, Uttar Pradesh",
  },
  {
    name: "Bridal Lehenga – Crimson Ember",
    description: "A show-stopping bridal lehenga in rich crimson with intricate aari embroidery and zardosi work. The three-piece ensemble includes a hand-embroidered choli and a matching dupatta.",
    price: "85000.00",
    originalPrice: "95000.00",
    categoryId: 2,
    categoryName: "Lehengas",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop",
    ],
    fabric: "Raw Silk with Net Overlay",
    colors: ["Crimson", "Dusty Rose", "Coral"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    rating: "5.0",
    reviewCount: 43,
    story: "Every bead, every sequin, every thread of gold is placed by hand by artisans who have dedicated their lives to making brides feel like queens.",
    craftRegion: "Jaipur, Rajasthan",
  },
  {
    name: "Festive Lehenga – Peacock Symphony",
    description: "A captivating festive lehenga inspired by the iridescent beauty of peacock feathers. The intricate embroidery captures the essence of Indian craftsmanship at its finest.",
    price: "42000.00",
    originalPrice: null,
    categoryId: 2,
    categoryName: "Lehengas",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    ],
    fabric: "Velvet with Silk Lining",
    colors: ["Peacock Blue", "Emerald", "Turquoise"],
    sizes: ["XS", "S", "M", "L", "XL"],
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    rating: "4.8",
    reviewCount: 29,
    story: "Inspired by the mystical peacock, sacred to Lord Krishna, this lehenga captures the divine beauty of nature through thousands of hand-placed embellishments.",
    craftRegion: "Lucknow, Uttar Pradesh",
  },
  {
    name: "Chikankari Salwar Suit – Pearl White",
    description: "An exquisite Chikankari salwar suit in pristine pearl white, featuring 200+ hours of delicate hand embroidery. The flowing silhouette and intricate shadow work make this a timeless classic.",
    price: "12500.00",
    originalPrice: "15000.00",
    categoryId: 3,
    categoryName: "Salwar Suits",
    imageUrl: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590736969596-701e0f5c3cec?w=800&auto=format&fit=crop",
    ],
    fabric: "Pure Georgette",
    colors: ["Pearl White", "Powder Pink", "Sky Blue"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    rating: "4.8",
    reviewCount: 156,
    story: "The art of Chikankari was brought to Lucknow by the Nawabs, and our artisans continue this 400-year tradition with every stitch telling tales of royal elegance.",
    craftRegion: "Lucknow, Uttar Pradesh",
  },
  {
    name: "Phulkari Salwar Suit – Sunset Orange",
    description: "A vibrant Phulkari salwar suit celebrating the rich folk embroidery tradition of Punjab. The bold sunflower and folk motifs are worked in vibrant silk threads on a cotton base.",
    price: "8900.00",
    originalPrice: null,
    categoryId: 3,
    categoryName: "Salwar Suits",
    imageUrl: "https://images.unsplash.com/photo-1590736969596-701e0f5c3cec?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590736969596-701e0f5c3cec?w=800&auto=format&fit=crop",
    ],
    fabric: "Cotton with Silk Embroidery",
    colors: ["Sunset Orange", "Mustard Yellow", "Magenta"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    rating: "4.6",
    reviewCount: 78,
    story: "Phulkari, meaning 'flower work', was traditionally created by mothers for their daughters' trousseau. Each bloom is an expression of love passed through generations.",
    craftRegion: "Amritsar, Punjab",
  },
  {
    name: "Mughal Anarkali – Ivory & Gold",
    description: "A floor-length Mughal anarkali in lustrous ivory, embellished with delicate gold zardosi work inspired by the architectural splendor of Mughal monuments. Pure royalty in every fold.",
    price: "22000.00",
    originalPrice: "26000.00",
    categoryId: 4,
    categoryName: "Anarkalis",
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop",
    ],
    fabric: "Silk Organza",
    colors: ["Ivory", "Champagne", "Pale Gold"],
    sizes: ["XS", "S", "M", "L", "XL"],
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    rating: "4.7",
    reviewCount: 62,
    story: "Named after Anarkali, the legendary dancer of Emperor Akbar's court, this anarkali embodies the grace and mystique of Mughal royalty.",
    craftRegion: "Agra, Uttar Pradesh",
  },
  {
    name: "Bandhej Anarkali – Desert Rose",
    description: "A breathtaking Bandhej tie-dye anarkali from Rajasthan in desert rose hues. The traditional resist-dyeing technique creates mesmerizing patterns that look different in every light.",
    price: "16500.00",
    originalPrice: null,
    categoryId: 4,
    categoryName: "Anarkalis",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    ],
    fabric: "Gajji Silk",
    colors: ["Desert Rose", "Saffron", "Terracotta"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isFeatured: false,
    isNew: true,
    isBestseller: true,
    rating: "4.9",
    reviewCount: 91,
    story: "The Bandhej artisans of Jaipur and Jodhpur carefully tie thousands of tiny knots before dyeing, each knot holding within it a wish for the wearer.",
    craftRegion: "Jaipur, Rajasthan",
  },
  {
    name: "Handpainted Madhubani Dupatta",
    description: "A one-of-a-kind silk dupatta hand-painted with traditional Madhubani art featuring the tree of life motif. Each piece is unique and comes with a certificate of authenticity.",
    price: "4500.00",
    originalPrice: "5500.00",
    categoryId: 5,
    categoryName: "Dupattas",
    imageUrl: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop",
    ],
    fabric: "Pure Silk",
    colors: ["Natural Ivory with Earth Pigments"],
    sizes: ["Standard (2.5m)"],
    isFeatured: false,
    isNew: false,
    isBestseller: true,
    rating: "5.0",
    reviewCount: 38,
    story: "Madhubani painting originated in the Mithila region of Bihar thousands of years ago. Our artists are direct descendants of the village women who first painted on cave walls.",
    craftRegion: "Madhubani, Bihar",
  },
  {
    name: "Block-Print Cotton Kurti – Indigo Bloom",
    description: "A beautifully crafted block-print kurti in hand-stamped indigo and white patterns. Made with 100% natural dyes on Khadi cotton, it is both sustainable and breathtakingly beautiful.",
    price: "3200.00",
    originalPrice: null,
    categoryId: 6,
    categoryName: "Kurtis",
    imageUrl: "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=800&auto=format&fit=crop",
    ],
    fabric: "Khadi Cotton",
    colors: ["Indigo Blue", "Natural White"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    rating: "4.5",
    reviewCount: 204,
    story: "Each block is hand-carved from teak wood, and the printing is done by families in Sanganer who have kept this art alive for over five generations.",
    craftRegion: "Sanganer, Rajasthan",
  },
  {
    name: "Chanderi Silk Saree – Blush Petal",
    description: "A gossamer-light Chanderi silk saree in soft blush pink, featuring traditional coin and floral motifs in gold zari. The translucent weave creates an ethereal effect that moves like water.",
    price: "15800.00",
    originalPrice: "18000.00",
    categoryId: 1,
    categoryName: "Sarees",
    imageUrl: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
    ],
    fabric: "Chanderi Silk Cotton",
    colors: ["Blush Pink", "Mint Green", "Lavender"],
    sizes: ["Free Size (5.5m)"],
    isFeatured: false,
    isNew: false,
    isBestseller: true,
    rating: "4.8",
    reviewCount: 73,
    story: "Woven in the historic town of Chanderi in Madhya Pradesh, this saree carries within it centuries of weaving heritage dating back to the Malwa Sultanate.",
    craftRegion: "Chanderi, Madhya Pradesh",
  },
  {
    name: "Gota Patti Lehenga – Marigold Dream",
    description: "A stunning festive lehenga adorned with traditional Gota Patti ribbon embroidery in marigold and gold. This Rajasthani craft tradition transforms flat metallic ribbon into three-dimensional floral splendor.",
    price: "35000.00",
    originalPrice: null,
    categoryId: 2,
    categoryName: "Lehengas",
    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop",
    ],
    fabric: "Raw Silk",
    colors: ["Marigold Yellow", "Saffron", "Coral"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isFeatured: true,
    isNew: true,
    isBestseller: false,
    rating: "4.9",
    reviewCount: 18,
    story: "Gota Patti was the exclusive craft of Rajput royalty. Our artisans in Jaipur carry forward this 500-year-old tradition, creating wearable gold from ribbon and thread.",
    craftRegion: "Jaipur, Rajasthan",
  },
];

async function seed() {
  console.log("Seeding database...");

  await db.delete(categoriesTable);
  const insertedCategories = await db
    .insert(categoriesTable)
    .values(categories)
    .returning();
  console.log(`Inserted ${insertedCategories.length} categories`);

  await db.delete(productsTable);
  const insertedProducts = await db
    .insert(productsTable)
    .values(products)
    .returning();
  console.log(`Inserted ${insertedProducts.length} products`);

  for (const cat of insertedCategories) {
    const count = insertedProducts.filter(
      (p) => p.categoryName === cat.name
    ).length;
    await db
      .update(categoriesTable)
      .set({ productCount: count })
      .where(eq(categoriesTable.id, cat.id));
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
