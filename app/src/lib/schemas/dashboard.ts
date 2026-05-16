import { z } from 'zod'

export const financialMetricsSchema = z.object({
  totalSales: z.number(),
  totalPurchases: z.number(),
  totalPayroll: z.number(),
  grossMargin: z.number(),
  marginPercentage: z.number(),
  ebitda: z.number(),
})

export const assetMetricsSchema = z.object({
  totalValue: z.number(),
  totalDepreciation: z.number(),
})

export const monthlyTrendSchema = z.object({
  month: z.string(),
  sales: z.number(),
  purchases: z.number(),
  payroll: z.number(),
  margin: z.number(),
})

export const executiveSummarySchema = z.object({
  overallAssessment: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'CRITICAL']),
  score: z.number(),
  insights: z.array(z.string()),
})

export const dashboardDataSchema = z.object({
  year: z.number(),
  orgName: z.string().optional(),
  financials: financialMetricsSchema,
  assets: assetMetricsSchema,
  monthlyTrend: z.array(monthlyTrendSchema),
  executiveSummary: executiveSummarySchema,
})

export const regionalNewsSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  category: z.string(),
  published_at: z.string(),
  url: z.string().optional().nullable(),
})
