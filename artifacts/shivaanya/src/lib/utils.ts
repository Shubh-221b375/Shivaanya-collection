import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get consistent fallback images if backend doesn't provide them
export function getProductImage(product: { imageUrl?: string | null, categoryName?: string, name?: string }) {
  if (product.imageUrl && product.imageUrl.length > 5) return product.imageUrl;
  
  const category = (product.categoryName || "").toLowerCase();
  const name = (product.name || "").toLowerCase();
  
  if (category.includes('saree') || name.includes('saree')) {
    return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80&fit=crop";
  }
  if (category.includes('lehenga') || name.includes('lehenga')) {
    return "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80&fit=crop";
  }
  if (category.includes('suit') || category.includes('salwar') || name.includes('suit')) {
    return "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&q=80&fit=crop";
  }
  
  // Default elegant Indian fashion fallback
  return "https://images.unsplash.com/photo-1596455607563-ad6193f76b19?w=800&q=80&fit=crop";
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}
