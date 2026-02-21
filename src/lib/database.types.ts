export interface Database {
  public: {
    Tables: {
      borrower_notes: {
        Row: {
          id: string
          last_name: string
          first_name: string
          class: string
          note_text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_name: string
          first_name: string
          class: string
          note_text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_name?: string
          first_name?: string
          class?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          id: string
          serial_number: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          serial_number: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          serial_number?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          id: string
          device_id: string
          borrower_first_name: string
          borrower_last_name: string
          borrower_class: string
          loaned_at: string
          returned_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          borrower_first_name: string
          borrower_last_name: string
          borrower_class: string
          loaned_at: string
          returned_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          borrower_first_name?: string
          borrower_last_name?: string
          borrower_class?: string
          loaned_at?: string
          returned_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type BorrowerNote = Database['public']['Tables']['borrower_notes']['Row']
export type BorrowerNoteInsert = Database['public']['Tables']['borrower_notes']['Insert']

export type Device = Database['public']['Tables']['devices']['Row']
export type DeviceInsert = Database['public']['Tables']['devices']['Insert']
export type Loan = Database['public']['Tables']['loans']['Row']
export type LoanInsert = Database['public']['Tables']['loans']['Insert']

export interface DeviceWithStatus extends Device {
  activeLoan: Loan | null
  isLoaned: boolean
}

export interface DeviceWithLoans extends Device {
  loans: Loan[]
  activeLoan: Loan | null
  isLoaned: boolean
}

export interface ActiveLoanWithDevice extends Loan {
  devices: Pick<Device, 'id' | 'serial_number' | 'name'>
}
