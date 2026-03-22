export type ApiDomain =
  | 'auth'
  | 'adoption'
  | 'donations'
  | 'dvmf'
  | 'events'
  | 'healthcare'
  | 'explore'
  | 'lost-pets'
  | 'onboarding'
  | 'pets'
  | 'posts'
  | 'profile'
  | 'reports'
  | 'roles'
  | 'store'
  | 'stories'
  | 'volunteer';

type UnknownArgs = unknown[];

export type ApiActionArgsByDomain = {
  auth: {
    signUp: [unknown];
    login: [{ email: string; password: string }];
    logout: [];
    clientLogout: [];
    getSession: [];
    getCurrentUser: [];
    getUserProfile: [string];
    updateUserProfile: [string, Record<string, unknown>];
    checkUsernameAvailability: [string];
    resetPassword: [string];
    updatePassword: [string];
  };
  adoption: {
    createAdoptionRequest: UnknownArgs;
    cancelAdoptionRequest: UnknownArgs;
    updateAdoptionRequestStatus: UnknownArgs;
    completeAdoption: UnknownArgs;
    getAdoptionRequests: UnknownArgs;
    getUserAdoptionRequests: UnknownArgs;
    getAdoptionRequestForPet: UnknownArgs;
    getMyAdoptionRequestForPet: UnknownArgs;
    getAdoptionRequestCountForPet: UnknownArgs;
    getAdoptedPets: UnknownArgs;
  };
  dvmf: {
    getDvmfRegistryRecords: UnknownArgs;
    createDvmfRegistryRecord: UnknownArgs;
    createDvmfRegistryFromAdoptable: UnknownArgs;
    updateDvmfRegistryRecord: UnknownArgs;
    deleteDvmfRegistryRecord: UnknownArgs;
  };
  events: {
    getEvents: [
      {
        upcoming?: boolean;
        shelterId?: string;
        eventType?: string;
      }?
    ];
    createEvent: [
      {
        event_name: string;
        event_type: string;
        event_date: string;
        end_date?: string;
        location: string;
        description: string;
        post_title?: string;
        post_tags?: string[];
        max_attendees?: number;
        registration_required?: boolean;
        participant_approval_mode?: 'auto' | 'manual';
        is_volunteer_event?: boolean;
        volunteers_needed?: number;
        media_urls?: string[];
        donation_monetary_enabled?: boolean;
        donation_in_kind_enabled?: boolean;
        donation_goal_php?: number;
        donation_beneficiary?: string;
        donation_notes?: string;
        donation_dropoff_place_id?: string;
        donation_dropoff_address?: string;
        donation_dropoff_lat?: number;
        donation_dropoff_lng?: number;
        donation_dropoff_map_url?: string;
      }
    ];
    rsvpEvent: [string];
    registerParticipant: [string];
    cancelParticipantRegistration: [string];
    getMyParticipantRegistrationStatus: [string];
    getEventParticipantsForOrganizer: [string];
    reviewParticipantRegistration: [string, 'approved' | 'declined'];
  };
  healthcare: {
    getHealthcareServices: [string?];
    getDvmfHealthcareBranches: [];
    getHealthcareEligiblePets: [];
    getAvailableHealthcareSlots: [
      string,
      {
        serviceType?: 'spay_neuter' | 'vaccination' | 'deworming';
        serviceId?: string;
        date?: string;
        from?: string;
        to?: string;
      }?
    ];
    getBranchAvailabilitySlots: [string, string, string];
    createHealthcareAppointmentRequest: [
      {
        dvmf_id: string;
        pet_id: string;
        service_id: string;
        preferred_date: string;
        preferred_time: string;
        reason?: string;
        requester_notes?: string;
      }
    ];
    getMyHealthcareAppointmentRequests: [];
    getDvmfHealthcareAppointmentRequests: [
      {
        status?:
          | 'pending_approval'
          | 'approved_pending_payment'
          | 'paid_scheduled'
          | 'rejected'
          | 'completed'
          | 'cancelled';
      }?
    ];
    reviewHealthcareAppointmentRequest: [string, 'approve' | 'reject', string?];
    manageHealthcareAppointmentStatus: [
      string,
      'mark_paid' | 'mark_completed' | 'mark_cancelled',
      string?
    ];
    createHealthcareSlot: [
      {
        service_id: string;
        slot_start: string;
        slot_end: string;
        capacity: number;
        notes?: string;
      }
    ];
    getDvmfHealthcareCalendarWeek: [string?];
    getDvmfHealthcareCalendar: ['day' | 'week' | 'month', string?];
    getDvmfHealthcareServicesForOwner: [];
    saveDvmfHealthcareService: [
      {
        id?: string;
        service_type?: 'spay_neuter' | 'vaccination' | 'deworming';
        service_name: string;
        description?: string;
        is_paid: boolean;
        base_fee: number;
        duration_minutes: number;
        is_active?: boolean;
      }
    ];
    removeDvmfHealthcareService: [string];
    getDvmfBranchProfile: [];
    updateDvmfBranchProfile: [
      {
        organization_name: string;
        description?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        operating_hours: {
          slot_minutes: number;
          days: Record<
            string,
            {
              is_open: boolean;
              open_time: string;
              close_time: string;
              capacity_per_slot: number;
            }
          >;
        };
      }
    ];
    initiateMayaCheckout: [string];
    syncMayaPaymentStatus: [string, { assumePaidOnSuccessReturn?: boolean }?];
  };
  donations: {
    createDonationCheckout: [
      {
        campaign_id: string;
        amount_php: number;
        donor_message?: string;
        is_anonymous?: boolean;
      }
    ];
    syncDonationPaymentStatus: [string, { assumePaidOnSuccessReturn?: boolean }?];
    syncDonationPaymentStatusByRequestRef: [string, { assumePaidOnSuccessReturn?: boolean }?];
    getMyDonationTransactions: [];
    getOrganizerDonationDashboard: [];
    upsertOrganizerBillingAccount: [
      {
        id?: string;
        account_type: 'bank' | 'e_wallet';
        provider_name: string;
        account_name: string;
        account_number: string;
        account_metadata?: Record<string, unknown>;
        is_default?: boolean;
        is_active?: boolean;
      }
    ];
    getOrganizerBillingAccounts: [];
    createWithdrawalRequest: [
      {
        billing_account_id: string;
        amount_requested: number;
      }
    ];
    getOrganizerWithdrawalRequests: [];
    getPendingWithdrawalRequests: [];
    reviewWithdrawalRequest: [string, 'approve' | 'reject', string?];
    completeWithdrawalRequest: [
      {
        request_id: string;
        payout_reference: string;
        proof_urls: string[];
        actual_transfer_fee?: number;
      }
    ];
    createInKindDonationIntent: [
      {
        campaign_id: string;
        item_summary: string;
        quantity_label?: string;
        donor_notes?: string;
        estimated_dropoff_at?: string;
      }
    ];
    getInKindDonationIntents: [string?];
    getDonationCampaignDonors: [string];
  };
  explore: {
    getExplorePets: UnknownArgs;
    getFeaturedShelters: UnknownArgs;
    getRecommendedPets: UnknownArgs;
  };
  'lost-pets': {
    getLostPets: UnknownArgs;
    createLostPet: UnknownArgs;
    updateLostPetStatus: UnknownArgs;
  };
  onboarding: {
    submitVolunteerOnboarding: UnknownArgs;
    submitNgoOnboarding: UnknownArgs;
    submitCityPoundOnboarding: UnknownArgs;
    submitAdopterOnboarding: UnknownArgs;
    submitShelterOnboarding: UnknownArgs;
    updateAdopterProfile: UnknownArgs;
    updateShelterProfile: UnknownArgs;
    getAdopterProfile: UnknownArgs;
    getShelterProfile: UnknownArgs;
    submitRegularUserOnboarding: UnknownArgs;
  };
  pets: {
    createPet: UnknownArgs;
    updatePet: UnknownArgs;
    updatePetStatus: UnknownArgs;
    deletePet: UnknownArgs;
    getPet: UnknownArgs;
    getAvailablePets: UnknownArgs;
    getShelterPets: UnknownArgs;
    searchPets: UnknownArgs;
    createAdopterPet: UnknownArgs;
    updateAdopterPet: UnknownArgs;
    getAdopterOwnPets: UnknownArgs;
    getAdopterAllPets: UnknownArgs;
    deleteAdopterPet: UnknownArgs;
  };
  posts: {
    likePost: [string];
    createComment: [string, string, string?];
    deleteComment: [string];
    getFeedPosts: [unknown?];
    getPostWithComments: [string];
    deletePost: [string];
    updatePost: [string, { description: string }];
    getEventPostByEventId: [string];
    createFeedPost: [string, string[], string[]];
    savePost: [string];
    getSavedPosts: [string];
  };
  profile: {
    getUserProfile: UnknownArgs;
    updateAdopterProfileByUserId: UnknownArgs;
    updateShelterProfileByUserId: UnknownArgs;
    updateUserBasicInfo: UnknownArgs;
    updateUserPhotos: UnknownArgs;
    getShelterPetsByStatus: UnknownArgs;
    getShelterEvents: UnknownArgs;
    getUserPosts: UnknownArgs;
    followUser: UnknownArgs;
  };
  reports: {
    createReport: UnknownArgs;
    getReports: UnknownArgs;
    getReport: UnknownArgs;
    updateReportStatus: UnknownArgs;
    updateReport: UnknownArgs;
    assignReport: UnknownArgs;
    getReportHistory: UnknownArgs;
    getMyReports: UnknownArgs;
    getReportStats: UnknownArgs;
    uploadReportMedia: UnknownArgs;
  };
  roles: {
    getUserRoles: UnknownArgs;
    hasRole: UnknownArgs;
    getUserPermissions: UnknownArgs;
    grantRole: UnknownArgs;
    revokeRole: UnknownArgs;
    getUserWithRoles: UnknownArgs;
    initializeUserRole: UnknownArgs;
  };
  store: {
    getStoreProducts: UnknownArgs;
    getProductCategories: UnknownArgs;
    addToCart: UnknownArgs;
    getCartItems: UnknownArgs;
    removeFromCart: UnknownArgs;
  };
  stories: {
    getSuccessStories: UnknownArgs;
    createSuccessStory: UnknownArgs;
  };
  volunteer: {
    applyAsVolunteer: UnknownArgs;
    getVolunteerProfile: UnknownArgs;
    getVolunteerApplications: UnknownArgs;
    reviewVolunteerApplication: UnknownArgs;
    updateVolunteerProfile: UnknownArgs;
    applyToEvent: [
      {
        event_id: string;
        volunteer_id: string;
        application_message?: string;
      }
    ];
    cancelMyEventVolunteerApplication: [string];
    reviewEventVolunteer: [
      string,
      {
        status: 'approved' | 'rejected' | 'attended' | 'no_show' | 'pending';
      }
    ];
    checkInVolunteer: [string];
    checkOutVolunteer: [string, number?];
    getMyEventApplications: [];
    getMyEventVolunteerApplication: [string];
    getEventVolunteerApplicationsForOrganizer: [
      string,
      ('pending' | 'approved' | 'rejected' | 'attended' | 'no_show')?
    ];
    getVolunteerStats: UnknownArgs;
  };
};

export type ApiDomainAction<D extends ApiDomain> = Extract<
  keyof ApiActionArgsByDomain[D],
  string
>;

export type ApiActionArgs<
  D extends ApiDomain,
  A extends ApiDomainAction<D>
> = ApiActionArgsByDomain[D][A];
