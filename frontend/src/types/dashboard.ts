export interface DashboardSummary {
    total_products: number
    low_stock_count: number
    critical_stock_count: number
    pending_deliveries: number
    delayed_deliveries: number
    anomalies_flagged: number
  }

  export interface CategoryStockItem {
    category: string
    total_quantity: number
    product_count: number
  }
  
  export interface LowStockItem {
    name: string
    quantity: number
    threshold: number
    gap: number
  }
  
  export interface DeliveryStatusCount {
    status: string
    count: number
  }
  
  export interface MovementPoint {
    date: string
    restocked: number
    reduced: number
  }
  
  export interface AnalyticsData {
    category_stock: CategoryStockItem[]
    low_stock_products: LowStockItem[]
    delivery_status_counts: DeliveryStatusCount[]
    movement_trend: MovementPoint[]
  }