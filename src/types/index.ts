export interface User {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  role_id: number;
  is_active: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  active_services_count?: number;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  base_price: string;
  duration_minutes: number | null;
  is_active: boolean;
  category_id: number;
  service_categories: ServiceCategory;
}

export interface CreateBookingPayload {
  serviceId: number;
  serviceAddress: string;
  serviceArea: string;
  preferredDate: string;
  preferredTime?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
}

export type PaymentMethod = "cash" | "esewa" | "khalti" | "connectips";

export type BookingStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "travelling"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface BookingProvider {
  id: number;
  full_name: string;
  phone: string;
}

export interface Booking {
  id: number;
  service_id: number;
  provider_id: number | null;
  service_address: string;
  service_area: string;
  preferred_date: string;
  preferred_time: string | null;
  notes: string | null;
  status: BookingStatus;
  payment_method: PaymentMethod;
  estimated_price: string | null;
  final_price: string | null;
  created_at: string;
  cancellation_reason: string | null;
  services: Service;
  users_bookings_provider_idTousers: BookingProvider | null;
}
export interface BookingPayment {
  id: number;
  amount: string | number;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
}

export interface BookingReview {
  id: number;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface BookingStatusHistoryEntry {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_by_user_id: number | null;
  changed_by_role: string | null;
  note: string | null;
  created_at: string;
}

export interface BookingDetails extends Booking {
  payments: BookingPayment | null;
  reviews: BookingReview | null;
  booking_status_history: BookingStatusHistoryEntry[];
}

export interface Address {
  id: number;
  label: string;
  full_address: string;
  service_area: string;
  landmark: string | null;
  is_default: boolean;
}

export interface CreateAddressPayload {
  label: string;
  fullAddress: string;
  serviceArea: string;
  landmark?: string;
  isDefault?: boolean;
}
export interface Wallet {
  id: number;
  user_id: number;
  balance: string;
  currency: string;
  is_active: boolean;
}
export interface ProviderUser {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  role_id: number;
  role_name?: string;
  is_active: boolean;
}

export interface ProviderLoginResponse {
  message: string;
  token: string;
  user: ProviderUser;
}

export interface ProviderRegistrationResponse {
  message: string;
  provider_id?: number;
  email?: string;
  email_verification_required: boolean;
  provider?: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    email_verified: boolean;
    email_verification_required: boolean;
    otp_expires_at?: string;
    otp_resend_after_seconds?: number;
    role_id?: number;
    category_experience?: ProviderCategoryExperienceEntry[];
  };
}

export interface ProviderOtpResponse {
  message: string;
  email_verified?: boolean;
  reset_verified?: boolean;
  reset_token?: string;
  reset_token_expires_in?: string;
  otp_expires_at?: string;
  otp_resend_after_seconds?: number;
  retry_after_seconds?: number;
}
export interface ProviderExperienceOption {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
}

export interface ProviderRegistrationCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  experience_options: ProviderExperienceOption[];
}

export interface ProviderRegistrationOptionsResponse {
  message: string;
  categories: ProviderRegistrationCategory[];
}

export interface ProviderCategoryExperienceEntry {
  category_id: number;
  category_name: string;
  experience_type: {
    id: number;
    name: string;
  };
}

export interface RegisterProviderInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  profilePhotoUrl?: string | null;
  categoryIds: number[];
  categoryExperience: { categoryId: number; experienceTypeId: number }[];
}
export interface ProviderProfileDetails {
  id: number;
  address: string | null;
  profile_photo_url: string | null;
  years_of_experience: number | null;
  bio: string | null;
  verification_status: string;
  verification_note: string | null;
  verified_at: string | null;
  suspended_at: string | null;
  rejection_reason: string | null;
  average_rating: string | number;
  total_reviews: number;
  total_completed_jobs: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderCategoryDetails {
  id: number;
  category_id: number;
  created_at: string;
  category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
  };
}

export interface ProviderExperienceDetails {
  id: number;
  experience_type_id: number;
  created_at: string;
  experience_type: {
    id: number;
    name: string;
  };
}

export interface AuthenticatedProvider {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  role_id: number;
  role_name: string;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
  profile: ProviderProfileDetails | null;
  categories: ProviderCategoryDetails[];
  experiences: ProviderExperienceDetails[];
  category_experience: ProviderCategoryExperienceEntry[];
}

export interface ProviderProfileResponse {
  message: string;
  provider: AuthenticatedProvider;
}
export interface ProviderDashboardBooking {
  id: number;
  status: string;
  service_address: string;
  service_area: string;
  preferred_date: string;
  preferred_time: string | null;
  estimated_price: string | number | null;
  final_price: string | number | null;
  created_at: string;
  updated_at: string;

  services: {
    id: number;
    name: string;
    base_price: string | number;
    service_categories: {
      id: number;
      name: string;
      slug: string;
    };
  };

  users_bookings_customer_idTousers: {
    id: number;
    full_name: string;
    phone: string;
  };
}

export interface ProviderDashboardResponse {
  message: string;

  provider: {
    id: number;
    full_name: string;
    email: string | null;
    verification_status: string;
    is_available: boolean;
    average_rating: string | number;
    total_reviews: number;
    total_completed_jobs: number;
  };

  statistics: {
    available_requests: number;
    active_jobs: number;
    accepted_jobs: number;
    assigned_jobs: number;
    in_progress_jobs: number;
    completed_jobs: number;
    cancelled_jobs: number;
  };

  recent_bookings: ProviderDashboardBooking[];
}

export interface ProviderAvailabilityResponse {
  message: string;

  is_available?: boolean;

  availability?: {
    is_available: boolean;
    verification_status: string;
    updated_at: string;
  };
}
export interface ProviderBookingCustomer {
  id: number;
  full_name: string;
  phone?: string;
}

export interface ProviderBookingService {
  id: number;
  name: string;
  description?: string | null;
  base_price: string | number;
  duration_minutes?: number | null;
  category_id?: number;
  service_categories: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface ProviderBooking {
  id: number;
  customer_id: number;
  service_id: number;
  provider_id: number | null;
  service_address: string;
  service_area: string;
  preferred_date: string;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  payment_method: PaymentMethod;
  estimated_price: string | number | null;
  final_price?: string | number | null;
  accepted_at?: string | null;
  assigned_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;

  services: ProviderBookingService;

  users_bookings_customer_idTousers: ProviderBookingCustomer;
}

export interface ProviderBookingListResponse {
  message: string;
  bookings: ProviderBooking[];
}
export interface ProviderBookingAddress {
  id: number;
  label: string | null;
  full_address: string;
  service_area: string;
  landmark: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

export interface ProviderBookingPayment {
  id: number;
  amount: string | number;
  payment_method: string;
  payment_status: string;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface ProviderBookingReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ProviderBookingStatusHistory {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_by_user_id: number | null;
  changed_by_role: string | null;
  note: string | null;
  created_at: string;
}

export interface ProviderBookingDetails extends ProviderBooking {
  customer_address_id: number | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;

  customer_addresses: ProviderBookingAddress | null;
  payments: ProviderBookingPayment | null;
  reviews: ProviderBookingReview[];
  booking_status_history: ProviderBookingStatusHistory[];
}

export interface ProviderBookingDetailsResponse {
  message: string;
  booking: ProviderBookingDetails;
}
export interface ProviderWalletSummary {
  balance: number;
  currency: string;
  is_active: boolean;
  available_balance?: number;
  amount_owed_to_platform?: number;
}

export interface ProviderEarningsSummaryData {
  today: number;
  this_week: number;
  this_month: number;
  total_gross: number;
  total_commission: number;
  total_net: number;
  completed_jobs: number;
}

export interface ProviderWithdrawalSummary {
  pending_amount: number;
}

export interface ProviderEarningsSummaryResponse {
  message: string;
  wallet: ProviderWalletSummary;
  earnings: ProviderEarningsSummaryData;
  withdrawals: ProviderWithdrawalSummary;
}

export interface ProviderEarningHistoryItem {
  id: number;
  booking_id: number;
  gross_amount: string | number;
  commission_percentage: string | number;
  commission_amount: string | number;
  net_amount: string | number;
  status: string;
  credited_at: string | null;
  created_at: string | null;

  bookings: {
    id: number;
    service_address: string;
    service_area: string;
    preferred_date: string;
    completed_at: string | null;

    services: {
      id: number;
      name: string;

      service_categories: {
        id: number;
        name: string;
      } | null;
    };

    users_bookings_customer_idTousers: {
      id: number;
      full_name: string;
      phone?: string;
    };
  };
}

export interface ProviderEarningsStatementRange {
  start_date: string;
  end_date: string;
  is_custom_range: boolean;
}

export interface ProviderEarningsStatementSummary {
  completed_jobs: number;
  total_gross: number;
  total_commission: number;
  total_net: number;
  average_commission_percentage: number;
}

export interface ProviderEarningsStatementResponse {
  message: string;
  range: ProviderEarningsStatementRange;
  summary: ProviderEarningsStatementSummary;
  earnings: ProviderEarningHistoryItem[];
}

export interface ProviderWalletTransaction {
  id: number;
  booking_id: number | null;
  transaction_type: string;
  source_type: string;
  amount: string | number;
  balance_before: string | number;
  balance_after: string | number;
  description: string | null;
  created_at: string | null;

  bookings: {
    id: number;

    services: {
      id: number;
      name: string;
    };
  } | null;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProviderEarningsHistoryResponse {
  message: string;
  earnings: ProviderEarningHistoryItem[];
  pagination: PaginationData;
}

export interface ProviderWalletTransactionsResponse {
  message: string;
  wallet: ProviderWalletSummary;
  transactions: ProviderWalletTransaction[];
  pagination: PaginationData;
}

export interface ProviderWithdrawal {
  id: number;
  amount: string | number;
  status: string;
  payment_method: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  provider_note: string | null;
  admin_note: string | null;
  requested_at: string | null;
  processed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProviderWithdrawalsResponse {
  message: string;
  withdrawals: ProviderWithdrawal[];
  pagination: PaginationData;
}

export interface CreateProviderWithdrawalInput {
  amount: number;
  paymentMethod: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  providerNote?: string;
}

export interface CreateProviderWithdrawalResponse {
  message: string;
  withdrawal: ProviderWithdrawal;
  wallet: {
    balance: string | number;
    currency: string;
  };
}
