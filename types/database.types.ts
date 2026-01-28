// This file is auto-generated. Do not edit manually.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          role: 'adopter' | 'shelter'
          is_verified: boolean
          avatar_url: string | null
          bio: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string
          fcm_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          role?: 'adopter' | 'shelter'
          is_verified?: boolean
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          fcm_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          role?: 'adopter' | 'shelter'
          is_verified?: boolean
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          fcm_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shelter_profiles: {
        Row: {
          id: string
          user_id: string
          shelter_name: string
          description: string | null
          website: string | null
          registration_number: string | null
          license_document_url: string | null
          verification_documents: Json | null
          operating_hours: Json | null
          capacity: number | null
          social_media: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shelter_name: string
          description?: string | null
          website?: string | null
          registration_number?: string | null
          license_document_url?: string | null
          verification_documents?: Json | null
          operating_hours?: Json | null
          capacity?: number | null
          social_media?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shelter_name?: string
          description?: string | null
          website?: string | null
          registration_number?: string | null
          license_document_url?: string | null
          verification_documents?: Json | null
          operating_hours?: Json | null
          capacity?: number | null
          social_media?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      adopter_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          occupation: string | null
          income_range: string | null
          household_size: number | null
          has_children: boolean | null
          has_other_pets: boolean | null
          pet_experience: string | null
          home_type: string | null
          home_ownership: string | null
          yard_size: string | null
          home_photos: Json | null
          valid_id_urls: Json | null
          references: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          occupation?: string | null
          income_range?: string | null
          household_size?: number | null
          has_children?: boolean | null
          has_other_pets?: boolean | null
          pet_experience?: string | null
          home_type?: string | null
          home_ownership?: string | null
          yard_size?: string | null
          home_photos?: Json | null
          valid_id_urls?: Json | null
          references?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          occupation?: string | null
          income_range?: string | null
          household_size?: number | null
          has_children?: boolean | null
          has_other_pets?: boolean | null
          pet_experience?: string | null
          home_type?: string | null
          home_ownership?: string | null
          yard_size?: string | null
          home_photos?: Json | null
          valid_id_urls?: Json | null
          references?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          post_type: 'adoptable' | 'lost_pet' | 'event' | 'story' | 'feed'
          title: string | null
          description: string
          media_urls: Json | null
          tags: string[] | null
          like_count: number
          comment_count: number
          view_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_type: 'adoptable' | 'lost_pet' | 'event' | 'story' | 'feed'
          title?: string | null
          description: string
          media_urls?: Json | null
          tags?: string[] | null
          like_count?: number
          comment_count?: number
          view_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_type?: 'adoptable' | 'lost_pet' | 'event' | 'story' | 'feed'
          title?: string | null
          description?: string
          media_urls?: Json | null
          tags?: string[] | null
          like_count?: number
          comment_count?: number
          view_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          post_id: string
          shelter_id: string
          name: string
          species: string
          breed: string | null
          age_years: number | null
          age_months: number | null
          gender: string | null
          size: string | null
          color: string | null
          weight: number | null
          status: 'available' | 'pending' | 'adopted'
          is_vaccinated: boolean
          is_spayed_neutered: boolean
          medical_history: string | null
          temperament: string[] | null
          good_with_kids: boolean | null
          good_with_dogs: boolean | null
          good_with_cats: boolean | null
          energy_level: string | null
          special_needs: string | null
          adoption_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          shelter_id: string
          name: string
          species: string
          breed?: string | null
          age_years?: number | null
          age_months?: number | null
          gender?: string | null
          size?: string | null
          color?: string | null
          weight?: number | null
          status?: 'available' | 'pending' | 'adopted'
          is_vaccinated?: boolean
          is_spayed_neutered?: boolean
          medical_history?: string | null
          temperament?: string[] | null
          good_with_kids?: boolean | null
          good_with_dogs?: boolean | null
          good_with_cats?: boolean | null
          energy_level?: string | null
          special_needs?: string | null
          adoption_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          shelter_id?: string
          name?: string
          species?: string
          breed?: string | null
          age_years?: number | null
          age_months?: number | null
          gender?: string | null
          size?: string | null
          color?: string | null
          weight?: number | null
          status?: 'available' | 'pending' | 'adopted'
          is_vaccinated?: boolean
          is_spayed_neutered?: boolean
          medical_history?: string | null
          temperament?: string[] | null
          good_with_kids?: boolean | null
          good_with_dogs?: boolean | null
          good_with_cats?: boolean | null
          energy_level?: string | null
          special_needs?: string | null
          adoption_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      lost_pets: {
        Row: {
          id: string
          post_id: string
          user_id: string
          pet_name: string
          species: string
          breed: string | null
          age_years: number | null
          color: string | null
          last_seen_location: string
          last_seen_date: string
          reward: number | null
          contact_phone: string
          contact_email: string | null
          status: 'lost' | 'found'
          found_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          pet_name: string
          species: string
          breed?: string | null
          age_years?: number | null
          color?: string | null
          last_seen_location: string
          last_seen_date: string
          reward?: number | null
          contact_phone: string
          contact_email?: string | null
          status?: 'lost' | 'found'
          found_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          pet_name?: string
          species?: string
          breed?: string | null
          age_years?: number | null
          color?: string | null
          last_seen_location?: string
          last_seen_date?: string
          reward?: number | null
          contact_phone?: string
          contact_email?: string | null
          status?: 'lost' | 'found'
          found_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          post_id: string
          shelter_id: string
          event_name: string
          event_date: string
          end_date: string | null
          location: string
          event_type: string | null
          capacity: number | null
          registration_required: boolean
          registration_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          shelter_id: string
          event_name: string
          event_date: string
          end_date?: string | null
          location: string
          event_type?: string | null
          capacity?: number | null
          registration_required?: boolean
          registration_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          shelter_id?: string
          event_name?: string
          event_date?: string
          end_date?: string | null
          location?: string
          event_type?: string | null
          capacity?: number | null
          registration_required?: boolean
          registration_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          post_id: string
          pet_id: string | null
          adopter_id: string
          shelter_id: string | null
          story_text: string
          adoption_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          pet_id?: string | null
          adopter_id: string
          shelter_id?: string | null
          story_text: string
          adoption_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          pet_id?: string | null
          adopter_id?: string
          shelter_id?: string | null
          story_text?: string
          adoption_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      adoption_requests: {
        Row: {
          id: string
          pet_id: string
          adopter_id: string
          shelter_id: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          application_data: Json | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          adopter_id: string
          shelter_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          application_data?: Json | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          adopter_id?: string
          shelter_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          application_data?: Json | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      adoptions: {
        Row: {
          id: string
          pet_id: string
          adopter_id: string
          shelter_id: string
          adoption_request_id: string | null
          adoption_date: string
          adoption_fee_paid: number | null
          contract_signed: boolean
          contract_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          adopter_id: string
          shelter_id: string
          adoption_request_id?: string | null
          adoption_date?: string
          adoption_fee_paid?: number | null
          contract_signed?: boolean
          contract_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          adopter_id?: string
          shelter_id?: string
          adoption_request_id?: string | null
          adoption_date?: string
          adoption_fee_paid?: number | null
          contract_signed?: boolean
          contract_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          like_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'like' | 'comment' | 'adoption_request' | 'adoption_status' | 'message'
          title: string
          message: string
          link: string | null
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'like' | 'comment' | 'adoption_request' | 'adoption_status' | 'message'
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'like' | 'comment' | 'adoption_request' | 'adoption_status' | 'message'
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'adopter' | 'shelter'
      adoption_status: 'pending' | 'approved' | 'rejected' | 'completed'
      pet_status: 'available' | 'pending' | 'adopted'
      lost_pet_status: 'lost' | 'found'
      post_type: 'adoptable' | 'lost_pet' | 'event' | 'story' | 'feed'
      notification_type: 'like' | 'comment' | 'adoption_request' | 'adoption_status' | 'message'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
