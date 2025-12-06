import { apiClient } from "./client";
import type { OptimizationResult } from "../types/listing";

export async function optimizeAsin(asin: string): Promise<OptimizationResult> {
  const { data } = await apiClient.post<OptimizationResult>("/optimize", { asin });
  return data;
}

export async function getHistory(
  asin: string
): Promise<OptimizationResult[]> {
  const { data } = await apiClient.get<OptimizationResult[]>(`/history/${asin}`);
  return data;
}