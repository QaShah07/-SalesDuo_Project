/**
 * Example TypeScript type for a Product row.
 * You can replace this with a real ORM model (e.g., Sequelize/Prisma).
 */

export type Product = {
  id: number;
  asin: string;
  title_original: string;
  bullets_original: string; // JSON string of bullet points
  description_original: string;
  created_at: Date;
};