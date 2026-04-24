export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      care_givers: {
        Row: {
          address: string | null
          address_2: string | null
          address_3: string | null
          alias: string | null
          allergies: string | null
          avatar_url: string | null
          care_giver_references: Json | null
          country: string | null
          county: string | null
          created_at: string
          dbs_ref: string | null
          dbs_type: string | null
          dbs_update_service: boolean | null
          dob: string | null
          email: string | null
          employment_status: string | null
          employment_type: string | null
          ethnicity: string | null
          forename: string | null
          gender: string | null
          home_phone: string | null
          house_street: string | null
          id: string
          is_driver: boolean | null
          last_check_in: string | null
          login_code: string | null
          manager: string | null
          marital_status: string | null
          name: string
          next_of_kin_address: string | null
          next_of_kin_email: string | null
          next_of_kin_name: string | null
          next_of_kin_notes: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          next_of_kin_secondary_phone: string | null
          ni_number: string | null
          payroll_number: string | null
          permission: string | null
          personal_email: string | null
          personal_number: string | null
          phone: string | null
          postcode: string | null
          preferred_name: string | null
          reference_no: string | null
          religion: string | null
          requested_hours: Json | null
          role_title: string | null
          sage_num: string | null
          salary: string | null
          sex_assigned_at_birth: string | null
          sexual_orientation: string | null
          skills: string[] | null
          start_date: string | null
          status: string
          suffix: string | null
          surname: string | null
          tags: string[] | null
          templated_hours: Json | null
          title: string | null
          town: string | null
          updated_at: string
          work_email: string | null
          work_number: string | null
        }
        Insert: {
          address?: string | null
          address_2?: string | null
          address_3?: string | null
          alias?: string | null
          allergies?: string | null
          avatar_url?: string | null
          care_giver_references?: Json | null
          country?: string | null
          county?: string | null
          created_at?: string
          dbs_ref?: string | null
          dbs_type?: string | null
          dbs_update_service?: boolean | null
          dob?: string | null
          email?: string | null
          employment_status?: string | null
          employment_type?: string | null
          ethnicity?: string | null
          forename?: string | null
          gender?: string | null
          home_phone?: string | null
          house_street?: string | null
          id?: string
          is_driver?: boolean | null
          last_check_in?: string | null
          login_code?: string | null
          manager?: string | null
          marital_status?: string | null
          name: string
          next_of_kin_address?: string | null
          next_of_kin_email?: string | null
          next_of_kin_name?: string | null
          next_of_kin_notes?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          next_of_kin_secondary_phone?: string | null
          ni_number?: string | null
          payroll_number?: string | null
          permission?: string | null
          personal_email?: string | null
          personal_number?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_name?: string | null
          reference_no?: string | null
          religion?: string | null
          requested_hours?: Json | null
          role_title?: string | null
          sage_num?: string | null
          salary?: string | null
          sex_assigned_at_birth?: string | null
          sexual_orientation?: string | null
          skills?: string[] | null
          start_date?: string | null
          status?: string
          suffix?: string | null
          surname?: string | null
          tags?: string[] | null
          templated_hours?: Json | null
          title?: string | null
          town?: string | null
          updated_at?: string
          work_email?: string | null
          work_number?: string | null
        }
        Update: {
          address?: string | null
          address_2?: string | null
          address_3?: string | null
          alias?: string | null
          allergies?: string | null
          avatar_url?: string | null
          care_giver_references?: Json | null
          country?: string | null
          county?: string | null
          created_at?: string
          dbs_ref?: string | null
          dbs_type?: string | null
          dbs_update_service?: boolean | null
          dob?: string | null
          email?: string | null
          employment_status?: string | null
          employment_type?: string | null
          ethnicity?: string | null
          forename?: string | null
          gender?: string | null
          home_phone?: string | null
          house_street?: string | null
          id?: string
          is_driver?: boolean | null
          last_check_in?: string | null
          login_code?: string | null
          manager?: string | null
          marital_status?: string | null
          name?: string
          next_of_kin_address?: string | null
          next_of_kin_email?: string | null
          next_of_kin_name?: string | null
          next_of_kin_notes?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          next_of_kin_secondary_phone?: string | null
          ni_number?: string | null
          payroll_number?: string | null
          permission?: string | null
          personal_email?: string | null
          personal_number?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_name?: string | null
          reference_no?: string | null
          religion?: string | null
          requested_hours?: Json | null
          role_title?: string | null
          sage_num?: string | null
          salary?: string | null
          sex_assigned_at_birth?: string | null
          sexual_orientation?: string | null
          skills?: string[] | null
          start_date?: string | null
          status?: string
          suffix?: string | null
          surname?: string | null
          tags?: string[] | null
          templated_hours?: Json | null
          title?: string | null
          town?: string | null
          updated_at?: string
          work_email?: string | null
          work_number?: string | null
        }
        Relationships: []
      }
      care_receivers: {
        Row: {
          account_status: string | null
          address: string | null
          age: number | null
          alias: string | null
          allergies: string | null
          area_name: string | null
          authority_ref: string | null
          avatar_url: string | null
          care_plan: string | null
          care_status: string
          care_type: string
          carer_pref: string | null
          cm2000_link: string | null
          community_health_index: string | null
          consent_flags: Json | null
          contract_type: string | null
          created_at: string
          diagnoses: string | null
          dnacpr: boolean
          dob: string | null
          doctor_address: string | null
          doctor_contact: string | null
          doctor_name: string | null
          doctor_phone: string | null
          email_1: string | null
          email_2: string | null
          ethnicity: string | null
          forename: string | null
          gender: string | null
          health_care_number: string | null
          id: string
          keysafe: string | null
          language: string | null
          marital_status: string | null
          medical_company_number: string | null
          medical_password: string | null
          medical_service_user_number: string | null
          mediverify: string | null
          mobile_num_1: string | null
          mobile_num_2: string | null
          name: string
          next_of_kin: string | null
          next_of_kin_address: string | null
          next_of_kin_email: string | null
          next_of_kin_phone: string | null
          nfc_code: string | null
          nhs_number: string | null
          ni_number: string | null
          npc_number: string | null
          onboarding_status: string | null
          patient_number: string | null
          pharmacy_address: string | null
          pharmacy_name: string | null
          pharmacy_phone: string | null
          phone_appears_on_app: boolean | null
          phone_number: string | null
          pref: string | null
          preference: string | null
          preferred_hours: string | null
          preferred_language: string | null
          reference_no: string | null
          religion: string | null
          requested_hours: Json | null
          risk_rating: string | null
          risk_rating_description: string | null
          service_start_date: string | null
          sex_assigned_at_birth: string | null
          sexual_orientation: string | null
          social_services_id: string | null
          sub_status: string | null
          suffix: string | null
          surname: string | null
          tags: string[] | null
          title: string | null
          under_regulated_activity: boolean | null
          updated_at: string
        }
        Insert: {
          account_status?: string | null
          address?: string | null
          age?: number | null
          alias?: string | null
          allergies?: string | null
          area_name?: string | null
          authority_ref?: string | null
          avatar_url?: string | null
          care_plan?: string | null
          care_status?: string
          care_type?: string
          carer_pref?: string | null
          cm2000_link?: string | null
          community_health_index?: string | null
          consent_flags?: Json | null
          contract_type?: string | null
          created_at?: string
          diagnoses?: string | null
          dnacpr?: boolean
          dob?: string | null
          doctor_address?: string | null
          doctor_contact?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          email_1?: string | null
          email_2?: string | null
          ethnicity?: string | null
          forename?: string | null
          gender?: string | null
          health_care_number?: string | null
          id?: string
          keysafe?: string | null
          language?: string | null
          marital_status?: string | null
          medical_company_number?: string | null
          medical_password?: string | null
          medical_service_user_number?: string | null
          mediverify?: string | null
          mobile_num_1?: string | null
          mobile_num_2?: string | null
          name: string
          next_of_kin?: string | null
          next_of_kin_address?: string | null
          next_of_kin_email?: string | null
          next_of_kin_phone?: string | null
          nfc_code?: string | null
          nhs_number?: string | null
          ni_number?: string | null
          npc_number?: string | null
          onboarding_status?: string | null
          patient_number?: string | null
          pharmacy_address?: string | null
          pharmacy_name?: string | null
          pharmacy_phone?: string | null
          phone_appears_on_app?: boolean | null
          phone_number?: string | null
          pref?: string | null
          preference?: string | null
          preferred_hours?: string | null
          preferred_language?: string | null
          reference_no?: string | null
          religion?: string | null
          requested_hours?: Json | null
          risk_rating?: string | null
          risk_rating_description?: string | null
          service_start_date?: string | null
          sex_assigned_at_birth?: string | null
          sexual_orientation?: string | null
          social_services_id?: string | null
          sub_status?: string | null
          suffix?: string | null
          surname?: string | null
          tags?: string[] | null
          title?: string | null
          under_regulated_activity?: boolean | null
          updated_at?: string
        }
        Update: {
          account_status?: string | null
          address?: string | null
          age?: number | null
          alias?: string | null
          allergies?: string | null
          area_name?: string | null
          authority_ref?: string | null
          avatar_url?: string | null
          care_plan?: string | null
          care_status?: string
          care_type?: string
          carer_pref?: string | null
          cm2000_link?: string | null
          community_health_index?: string | null
          consent_flags?: Json | null
          contract_type?: string | null
          created_at?: string
          diagnoses?: string | null
          dnacpr?: boolean
          dob?: string | null
          doctor_address?: string | null
          doctor_contact?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          email_1?: string | null
          email_2?: string | null
          ethnicity?: string | null
          forename?: string | null
          gender?: string | null
          health_care_number?: string | null
          id?: string
          keysafe?: string | null
          language?: string | null
          marital_status?: string | null
          medical_company_number?: string | null
          medical_password?: string | null
          medical_service_user_number?: string | null
          mediverify?: string | null
          mobile_num_1?: string | null
          mobile_num_2?: string | null
          name?: string
          next_of_kin?: string | null
          next_of_kin_address?: string | null
          next_of_kin_email?: string | null
          next_of_kin_phone?: string | null
          nfc_code?: string | null
          nhs_number?: string | null
          ni_number?: string | null
          npc_number?: string | null
          onboarding_status?: string | null
          patient_number?: string | null
          pharmacy_address?: string | null
          pharmacy_name?: string | null
          pharmacy_phone?: string | null
          phone_appears_on_app?: boolean | null
          phone_number?: string | null
          pref?: string | null
          preference?: string | null
          preferred_hours?: string | null
          preferred_language?: string | null
          reference_no?: string | null
          religion?: string | null
          requested_hours?: Json | null
          risk_rating?: string | null
          risk_rating_description?: string | null
          service_start_date?: string | null
          sex_assigned_at_birth?: string | null
          sexual_orientation?: string | null
          social_services_id?: string | null
          sub_status?: string | null
          suffix?: string | null
          surname?: string | null
          tags?: string[] | null
          title?: string | null
          under_regulated_activity?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      caregiver_availability: {
        Row: {
          care_giver_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          note: string | null
          start_time: string
          updated_at: string
          week_number: number
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          note?: string | null
          start_time?: string
          updated_at?: string
          week_number: number
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          note?: string | null
          start_time?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: []
      }
      caregiver_changelog: {
        Row: {
          care_giver_id: string
          created_at: string
          description: string
          for_name: string | null
          id: string
          log_time: string
          made_by: string
          record_id: string
          title: string
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          description?: string
          for_name?: string | null
          id?: string
          log_time?: string
          made_by: string
          record_id: string
          title: string
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          description?: string
          for_name?: string | null
          id?: string
          log_time?: string
          made_by?: string
          record_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_changelog_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_document_categories: {
        Row: {
          care_giver_id: string
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_document_categories_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_documents: {
        Row: {
          care_giver_id: string
          category_id: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          service_user_id: string | null
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          category_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          service_user_id?: string | null
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          category_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          service_user_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_documents_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "caregiver_document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_documents_service_user_id_fkey"
            columns: ["service_user_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_holidays: {
        Row: {
          care_giver_id: string
          created_at: string
          end_date: string | null
          entry_type: string
          hours: number | null
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          end_date?: string | null
          entry_type?: string
          hours?: number | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          end_date?: string | null
          entry_type?: string
          hours?: number | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      caregiver_incidents: {
        Row: {
          care_giver_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          created_for: string | null
          description: string
          id: string
          incident_date: string
          incident_ref: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_for?: string | null
          description?: string
          id?: string
          incident_date?: string
          incident_ref: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_for?: string | null
          description?: string
          id?: string
          incident_date?: string
          incident_ref?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_incidents_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_key_contacts: {
        Row: {
          address1: string | null
          address2: string | null
          area: string | null
          care_giver_id: string
          contact_type: string | null
          created_at: string
          email: string | null
          id: string
          is_ice: boolean
          is_nok: boolean
          lives_with: boolean
          mobile: string | null
          name: string
          note: string | null
          postcode: string | null
          show_on_app: boolean
          tel1: string | null
          tel2: string | null
          updated_at: string
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          area?: string | null
          care_giver_id: string
          contact_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_ice?: boolean
          is_nok?: boolean
          lives_with?: boolean
          mobile?: string | null
          name: string
          note?: string | null
          postcode?: string | null
          show_on_app?: boolean
          tel1?: string | null
          tel2?: string | null
          updated_at?: string
        }
        Update: {
          address1?: string | null
          address2?: string | null
          area?: string | null
          care_giver_id?: string
          contact_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_ice?: boolean
          is_nok?: boolean
          lives_with?: boolean
          mobile?: string | null
          name?: string
          note?: string | null
          postcode?: string | null
          show_on_app?: boolean
          tel1?: string | null
          tel2?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_key_contacts_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_private_notes: {
        Row: {
          care_giver_id: string
          created_at: string
          id: string
          note: string
          note_date: string
          service_user_id: string | null
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          id?: string
          note: string
          note_date?: string
          service_user_id?: string | null
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          id?: string
          note?: string
          note_date?: string
          service_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_private_notes_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_private_notes_service_user_id_fkey"
            columns: ["service_user_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_push_notifications: {
        Row: {
          care_giver_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_push_notifications_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_qualifications: {
        Row: {
          care_giver_id: string
          created_at: string
          expiry_date: string | null
          id: string
          never_expires: boolean
          notes: string | null
          qualification: string
          start_date: string | null
          status: string
          sub_status: string
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          never_expires?: boolean
          notes?: string | null
          qualification: string
          start_date?: string | null
          status?: string
          sub_status?: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          never_expires?: boolean
          notes?: string | null
          qualification?: string
          start_date?: string | null
          status?: string
          sub_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_qualifications_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_reminders: {
        Row: {
          account: string | null
          care_giver_id: string
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          end_date: string | null
          first_due: string | null
          id: string
          reminder_name: string
          repeat_interval: string
          status: string
          updated_at: string
          was_set_for: string | null
        }
        Insert: {
          account?: string | null
          care_giver_id: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          end_date?: string | null
          first_due?: string | null
          id?: string
          reminder_name: string
          repeat_interval?: string
          status?: string
          updated_at?: string
          was_set_for?: string | null
        }
        Update: {
          account?: string | null
          care_giver_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          end_date?: string | null
          first_due?: string | null
          id?: string
          reminder_name?: string
          repeat_interval?: string
          status?: string
          updated_at?: string
          was_set_for?: string | null
        }
        Relationships: []
      }
      caregiver_rota_notes: {
        Row: {
          care_giver_id: string
          created_at: string
          id: string
          note: string
          note_date: string
          note_ref: string | null
          rota_ref: string | null
          staff_name: string
        }
        Insert: {
          care_giver_id: string
          created_at?: string
          id?: string
          note: string
          note_date?: string
          note_ref?: string | null
          rota_ref?: string | null
          staff_name?: string
        }
        Update: {
          care_giver_id?: string
          created_at?: string
          id?: string
          note?: string
          note_date?: string
          note_ref?: string | null
          rota_ref?: string | null
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_rota_notes_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_vaccinations: {
        Row: {
          administered_by: string | null
          batch_number: string | null
          care_giver_id: string
          created_at: string
          date_administered: string | null
          dose: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          updated_at: string
          vaccine_name: string
        }
        Insert: {
          administered_by?: string | null
          batch_number?: string | null
          care_giver_id: string
          created_at?: string
          date_administered?: string | null
          dose?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          vaccine_name: string
        }
        Update: {
          administered_by?: string | null
          batch_number?: string | null
          care_giver_id?: string
          created_at?: string
          date_administered?: string | null
          dose?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_vaccinations_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_actions: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          log_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          log_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          log_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_actions_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "communication_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          assigned_to: string | null
          comm_type: string
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          direction: string
          duration_minutes: number | null
          id: string
          logged_by: string | null
          logged_for: string | null
          notes: string | null
          occurred_at: string
          reason_id: string | null
          reason_label: string | null
          subject: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_type: string | null
          waiting_on: string | null
        }
        Insert: {
          assigned_to?: string | null
          comm_type?: string
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          direction?: string
          duration_minutes?: number | null
          id?: string
          logged_by?: string | null
          logged_for?: string | null
          notes?: string | null
          occurred_at?: string
          reason_id?: string | null
          reason_label?: string | null
          subject?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_type?: string | null
          waiting_on?: string | null
        }
        Update: {
          assigned_to?: string | null
          comm_type?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          direction?: string
          duration_minutes?: number | null
          id?: string
          logged_by?: string | null
          logged_for?: string | null
          notes?: string | null
          occurred_at?: string
          reason_id?: string | null
          reason_label?: string | null
          subject?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_type?: string | null
          waiting_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "communication_reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_reasons: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_visits: {
        Row: {
          care_giver_id: string | null
          care_receiver_id: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          duration: number
          id: string
          start_hour: number
          status: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          duration?: number
          id?: string
          start_hour?: number
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          duration?: number
          id?: string
          start_hour?: number
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_visits_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_visits_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_visits: {
        Row: {
          assigned_member: string
          care_giver: string
          check_in_status: string
          created_at: string
          id: string
          scheduled_time: string
          visit_date: string
        }
        Insert: {
          assigned_member: string
          care_giver: string
          check_in_status?: string
          created_at?: string
          id?: string
          scheduled_time: string
          visit_date?: string
        }
        Update: {
          assigned_member?: string
          care_giver?: string
          check_in_status?: string
          created_at?: string
          id?: string
          scheduled_time?: string
          visit_date?: string
        }
        Relationships: []
      }
      health_goals: {
        Row: {
          care_receiver_id: string
          created_at: string
          goal: string
          id: string
          notes: string | null
          status: string
          target: string | null
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          goal: string
          id?: string
          notes?: string | null
          status?: string
          target?: string | null
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          goal?: string
          id?: string
          notes?: string | null
          status?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_goals_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          administered_by: string | null
          care_receiver_id: string
          created_at: string
          date: string
          dosage: string
          id: string
          medication: string
          notes: string | null
        }
        Insert: {
          administered_by?: string | null
          care_receiver_id: string
          created_at?: string
          date: string
          dosage: string
          id?: string
          medication: string
          notes?: string | null
        }
        Update: {
          administered_by?: string | null
          care_receiver_id?: string
          created_at?: string
          date?: string
          dosage?: string
          id?: string
          medication?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receiver_availability: {
        Row: {
          care_receiver_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          note: string | null
          start_time: string
          updated_at: string
          week_number: number
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          note?: string | null
          start_time?: string
          updated_at?: string
          week_number: number
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          note?: string | null
          start_time?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: []
      }
      receiver_changelog: {
        Row: {
          care_receiver_id: string
          created_at: string
          description: string
          for_name: string | null
          id: string
          log_time: string
          made_by: string
          record_id: string
          title: string
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          description?: string
          for_name?: string | null
          id?: string
          log_time?: string
          made_by: string
          record_id: string
          title: string
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          description?: string
          for_name?: string | null
          id?: string
          log_time?: string
          made_by?: string
          record_id?: string
          title?: string
        }
        Relationships: []
      }
      receiver_dnar_settings: {
        Row: {
          applies_from: string | null
          applies_until: string | null
          care_receiver_id: string
          created_at: string
          document_ref: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applies_from?: string | null
          applies_until?: string | null
          care_receiver_id: string
          created_at?: string
          document_ref?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applies_from?: string | null
          applies_until?: string | null
          care_receiver_id?: string
          created_at?: string
          document_ref?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_document_categories: {
        Row: {
          care_receiver_id: string
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          care_receiver_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          care_receiver_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_documents: {
        Row: {
          care_receiver_id: string
          category_id: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          care_receiver_id: string
          category_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          care_receiver_id?: string
          category_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receiver_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "receiver_document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      receiver_holidays: {
        Row: {
          care_receiver_id: string
          created_at: string
          end_date: string | null
          entry_type: string
          hours: number | null
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          end_date?: string | null
          entry_type?: string
          hours?: number | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          end_date?: string | null
          entry_type?: string
          hours?: number | null
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_incidents: {
        Row: {
          care_receiver_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          created_for: string | null
          description: string
          id: string
          incident_date: string
          incident_ref: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          care_receiver_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_for?: string | null
          description?: string
          id?: string
          incident_date?: string
          incident_ref: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_receiver_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_for?: string | null
          description?: string
          id?: string
          incident_date?: string
          incident_ref?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_key_contacts: {
        Row: {
          address1: string | null
          address2: string | null
          area: string | null
          care_receiver_id: string
          contact_type: string | null
          created_at: string
          email: string | null
          id: string
          is_ice: boolean
          is_nok: boolean
          lives_with: boolean
          mobile: string | null
          name: string
          note: string | null
          postcode: string | null
          show_on_app: boolean
          tel1: string | null
          tel2: string | null
          updated_at: string
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          area?: string | null
          care_receiver_id: string
          contact_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_ice?: boolean
          is_nok?: boolean
          lives_with?: boolean
          mobile?: string | null
          name: string
          note?: string | null
          postcode?: string | null
          show_on_app?: boolean
          tel1?: string | null
          tel2?: string | null
          updated_at?: string
        }
        Update: {
          address1?: string | null
          address2?: string | null
          area?: string | null
          care_receiver_id?: string
          contact_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_ice?: boolean
          is_nok?: boolean
          lives_with?: boolean
          mobile?: string | null
          name?: string
          note?: string | null
          postcode?: string | null
          show_on_app?: boolean
          tel1?: string | null
          tel2?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receiver_private_notes: {
        Row: {
          care_giver_id: string | null
          care_receiver_id: string
          created_at: string
          id: string
          note: string
          note_date: string
          updated_at: string
        }
        Insert: {
          care_giver_id?: string | null
          care_receiver_id: string
          created_at?: string
          id?: string
          note: string
          note_date?: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string | null
          care_receiver_id?: string
          created_at?: string
          id?: string
          note?: string
          note_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_push_notifications: {
        Row: {
          care_receiver_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Relationships: []
      }
      receiver_qualification_requirements: {
        Row: {
          care_receiver_id: string
          created_at: string
          id: string
          mandatory: boolean
          notes: string | null
          qualification: string
          updated_at: string
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          id?: string
          mandatory?: boolean
          notes?: string | null
          qualification: string
          updated_at?: string
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          id?: string
          mandatory?: boolean
          notes?: string | null
          qualification?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_qualifications: {
        Row: {
          care_receiver_id: string
          created_at: string
          expiry_date: string | null
          id: string
          never_expires: boolean
          notes: string | null
          qualification: string
          start_date: string | null
          status: string
          sub_status: string
          updated_at: string
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          never_expires?: boolean
          notes?: string | null
          qualification: string
          start_date?: string | null
          status?: string
          sub_status?: string
          updated_at?: string
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          never_expires?: boolean
          notes?: string | null
          qualification?: string
          start_date?: string | null
          status?: string
          sub_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      receiver_reminders: {
        Row: {
          account: string | null
          care_receiver_id: string
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          end_date: string | null
          first_due: string | null
          id: string
          reminder_name: string
          repeat_interval: string
          status: string
          updated_at: string
          was_set_for: string | null
        }
        Insert: {
          account?: string | null
          care_receiver_id: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          end_date?: string | null
          first_due?: string | null
          id?: string
          reminder_name: string
          repeat_interval?: string
          status?: string
          updated_at?: string
          was_set_for?: string | null
        }
        Update: {
          account?: string | null
          care_receiver_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          end_date?: string | null
          first_due?: string | null
          id?: string
          reminder_name?: string
          repeat_interval?: string
          status?: string
          updated_at?: string
          was_set_for?: string | null
        }
        Relationships: []
      }
      receiver_user_preferences: {
        Row: {
          care_giver_id: string
          care_receiver_id: string
          created_at: string
          description: string | null
          id: string
          rating: number
          updated_at: string
        }
        Insert: {
          care_giver_id: string
          care_receiver_id: string
          created_at?: string
          description?: string | null
          id?: string
          rating?: number
          updated_at?: string
        }
        Update: {
          care_giver_id?: string
          care_receiver_id?: string
          created_at?: string
          description?: string | null
          id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          care_receiver_id: string
          category: string
          created_at: string
          description: string
          id: string
          last_reviewed: string | null
          level: string
          mitigations: string | null
        }
        Insert: {
          care_receiver_id: string
          category: string
          created_at?: string
          description?: string
          id?: string
          last_reviewed?: string | null
          level?: string
          mitigations?: string | null
        }
        Update: {
          care_receiver_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_reviewed?: string | null
          level?: string
          mitigations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_notes: {
        Row: {
          author: string
          created_at: string
          daily_visit_id: string
          id: string
          note: string
        }
        Insert: {
          author?: string
          created_at?: string
          daily_visit_id: string
          id?: string
          note: string
        }
        Update: {
          author?: string
          created_at?: string
          daily_visit_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_notes_daily_visit_id_fkey"
            columns: ["daily_visit_id"]
            isOneToOne: false
            referencedRelation: "daily_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          daily_visit_id: string
          id: string
          is_completed: boolean
          title: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          daily_visit_id: string
          id?: string
          is_completed?: boolean
          title: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          daily_visit_id?: string
          id?: string
          is_completed?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_tasks_daily_visit_id_fkey"
            columns: ["daily_visit_id"]
            isOneToOne: false
            referencedRelation: "daily_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          care_giver_id: string | null
          care_receiver_id: string | null
          created_at: string
          day: number
          end_time: string
          id: string
          notes: string | null
          shift_type: string
          start_time: string
          updated_at: string
        }
        Insert: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          created_at?: string
          day?: number
          end_time?: string
          id?: string
          notes?: string | null
          shift_type?: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          created_at?: string
          day?: number
          end_time?: string
          id?: string
          notes?: string | null
          shift_type?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_notes: {
        Row: {
          care_receiver_id: string
          caregiver: string
          created_at: string
          date: string
          id: string
          note: string
        }
        Insert: {
          care_receiver_id: string
          caregiver: string
          created_at?: string
          date: string
          id?: string
          note: string
        }
        Update: {
          care_receiver_id?: string
          caregiver?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
