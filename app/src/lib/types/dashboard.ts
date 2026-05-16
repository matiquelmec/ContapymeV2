export interface FinancialMetrics {
  totalSales: number
  totalPurchases: number
  totalPayroll: number
  grossMargin: number
  marginPercentage: number
  ebitda: number
}

export interface AssetMetrics {
  totalValue: number
  totalDepreciation: number
}

export interface MonthlyTrend {
  month: string
  sales: number
  purchases: number
  payroll: number
  margin: number
}

export interface ExecutiveSummary {
  overallAssessment: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'CRITICAL'
  score: number
  insights: string[]
}

export interface DashboardData {
  year: number
  orgName?: string
  financials: FinancialMetrics
  assets: AssetMetrics
  monthlyTrend: MonthlyTrend[]
  executiveSummary: ExecutiveSummary
}

export interface Indicator {
  codigo: string
  nombre: string
  unidad_medida: string
  fecha: string
  valor: number
}

export interface RegionalNews {
  id: string
  title: string
  summary?: string
  content?: string
  image_url?: string
  category: string
  published_at: string
  url?: string
}
