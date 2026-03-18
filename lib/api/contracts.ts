export type ApiDomain =
  | 'auth'
  | 'adoption'
  | 'dvmf'
  | 'events'
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
      }
    ];
    rsvpEvent: [string];
    registerParticipant: [string];
    cancelParticipantRegistration: [string];
    getMyParticipantRegistrationStatus: [string];
    getEventParticipantsForOrganizer: [string];
    reviewParticipantRegistration: [string, 'approved' | 'declined'];
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
