import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const { category, featured, search } = req.query;

    let conditions: any[] = [];

    if (category && typeof category === "string") {
      const cat = category.toLowerCase();
      conditions.push(
        sql`lower(${productsTable.categoryName}) = ${cat}`
      );
    }

    if (featured === "true") {
      conditions.push(eq(productsTable.isFeatured, true));
    }

    if (search && typeof search === "string") {
      conditions.push(ilike(productsTable.name, `%${search}%`));
    }

    const products =
      conditions.length > 0
        ? await db
            .select()
            .from(productsTable)
            .where(and(...conditions))
        : await db.select().from(productsTable);

    const formatted = products.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
      rating: parseFloat(p.rating),
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid product ID" });
      return;
    }

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      ...product,
      price: parseFloat(product.price),
      originalPrice: product.originalPrice
        ? parseFloat(product.originalPrice)
        : null,
      rating: parseFloat(product.rating),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
