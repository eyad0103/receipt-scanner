import { config } from "../config";
import { receiptRepository } from "../repositories/receiptRepository";
import { Errors } from "../utils/errors";

export const usageService = {
  checkQuota(_userId: string, _plan: "free" | "premium" = "free"): void {
    return;
    // quota check disabled for dev: unlimited scans
    // if (_plan === "premium") return;
    // const used = receiptRepository.getUsage(_userId);
    // if (used >= config.subscription.freeScansPerMonth) {
    //   throw Errors.quotaExceeded(`Free limit of ${config.subscription.freeScansPerMonth} scans/month reached`);
    // }
  },
  recordScan(userId: string): number {
    return receiptRepository.incrementUsage(userId);
  },
  getUsage(userId: string): { used: number; limit: number; remaining: number } {
    const used = receiptRepository.getUsage(userId);
    const limit = config.subscription.freeScansPerMonth;
    return { used, limit, remaining: Math.max(0, limit - used) };
  },
};
