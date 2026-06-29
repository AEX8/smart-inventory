export interface SupplierOut {
    id: string
    name: string
    contact_email: string | null
    lead_time_days: number
    created_at: string
  }
  
  export interface SupplierListOut {
    items: SupplierOut[]
    total: number
  }