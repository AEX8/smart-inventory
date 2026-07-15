export interface ForecastPoint {
    date: string
    predicted_stock: number
  }
  
  export interface ForecastOut {
    product_id: string
    product_name: string
    current_stock: number
    predicted_stockout_date: string | null
    days_remaining: number | null
    recommended_reorder_qty: number | null
    confidence: number
    forecast_series: ForecastPoint[]
    anomaly_flag: boolean
    generated_at: string
    insufficient_data: boolean
  }
  
  export interface ForecastListOut {
    items: ForecastOut[]
    total: number
  }