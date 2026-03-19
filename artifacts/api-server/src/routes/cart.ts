import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function getCartResponse(sessionId: string) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  const formattedItems = items.map((item) => ({
    ...item,
    price: parseFloat(item.price),
  }));

  const total = formattedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = formattedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return { sessionId, items: formattedItems, total, itemCount };
}

router.get("/cart", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const cart = await getCartResponse(sessionId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const { sessionId, productId, quantity, size, color } = req.body;

    if (!sessionId || !productId || !quantity || !size || !color) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.sessionId, sessionId),
          eq(cartItemsTable.productId, productId),
          eq(cartItemsTable.size, size),
          eq(cartItemsTable.color, color)
        )
      );

    if (existing) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        sessionId,
        productId,
        productName: product.name,
        productImage: product.imageUrl,
        price: product.price,
        quantity,
        size,
        color,
      });
    }

    const cart = await getCartResponse(sessionId);
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.delete("/cart/:itemId", async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    await db
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.id, itemId),
          eq(cartItemsTable.sessionId, sessionId)
        )
      );

    const cart = await getCartResponse(sessionId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

export default router;
