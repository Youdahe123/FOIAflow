// ---------------------------------------------------------------------------
// Snowden — Core type definitions
// ---------------------------------------------------------------------------

// -- Enums / Union Types ----------------------------------------------------

export type UserRole = "journalist" | "editor" | "admin";

export type SubscriptionTier = "free_trial" | "starter" | "pro" | "newsroom";

export type RequestStatus =
  | "draft"
  | "ready_to_file"
  | "filed"
  | "acknowledged"
  | "processing"
  | "partial_response"
  | "completed"
  | "denied"
  | "appealed"
  | "appeal_pending"
  | "overdue";

export type AgencyLevel = "federal" | "state" | "local";

export type RequestLaw =
  | "foia"              // Federal FOIA — 5 U.S.C. § 552
  | "state_foia"        // State-level FOIA equivalents (e.g., CA PRA, NY FOIL, TX PIA)
  | "data_practices"    // Minnesota Government Data Practices Act (Minn. Stat. Ch. 13)
  | "open_records";     // Generic state/local open records statutes

export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";

export type FollowUpType =
  | "status_check"
  | "deadline_reminder"
  | "appeal"
  | "custom";

export type EntityType = "person" | "organization" | "date" | "location" | "dollar_amount";

export type AgencyCategory =
  | "law_enforcement"
  | "intelligence"
  | "defense"
  | "regulatory"
  | "health"
  | "environment"
  | "finance"
  | "transportation"
  | "housing"
  | "labor"
  | "energy"
  | "agriculture"
  | "science"
  | "veterans"
  | "postal"
  | "social_services"
  | "homeland_security"
  | "state_department"
  | "treasury"
  | "interior"
  | "commerce";

// -- Domain Interfaces ------------------------------------------------------

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  trialEndsAt: string | null;
  avatarUrl: string | null;
}

export interface Request {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description: string;
  generatedLetter: string | null;
  appealLetter: string | null;
  agencyId: string;
  /** Denormalized for display */
  agencyName: string;
  status: RequestStatus;
  /** Quality score from 0 to 100 */
  qualityScore: number | null;
  filedAt: string | null;
  dueDate: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  id: string;
  name: string;
  abbreviation: string;
  level: AgencyLevel;
  jurisdiction: string;
  /** The open-records law this agency operates under */
  requestLaw: RequestLaw;
  /** Human-readable name of the statute (e.g. "Minnesota Government Data Practices Act") */
  requestLawName: string;
  foiaEmail: string;
  foiaUrl: string;
  foiaPhone: string | null;
  mailingAddress: string;
  foiaOfficer: string | null;
  description: string;
  /** Average calendar days to respond */
  averageResponseDays: number;
  /** Compliance rating on a 0 to 5 scale */
  complianceRating: number;
  category: AgencyCategory;
  /** Total requests received — for display purposes */
  requestCount: number;
}

export interface Redaction {
  page: number;
  description: string;
  exemptionCode: string;
  exemptionName: string;
  /** Educated guess on why this was redacted (e.g. "privacy", "national security") */
  likelyReason: string;
}

export interface Entity {
  name: string;
  type: EntityType;
  mentions: number;
}

export interface AnalysisResult {
  keyFindings: string[];
  redactions: Redaction[];
  entities: Entity[];
  /** Detected patterns across names, emails, dates, or redactions */
  patterns: string[];
  suggestedFollowUps: FollowUpSuggestion[];
}

export interface FollowUpSuggestion {
  /** What to request */
  description: string;
  /** Which agency to target */
  suggestedAgency: string;
  /** Why this follow-up matters based on the analysis */
  reasoning: string;
}

export interface Document {
  id: string;
  userId: string;
  requestId: string;
  requestTitle: string;
  fileName: string;
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  storagePath: string;
  analysisStatus: AnalysisStatus;
  analysisResult: AnalysisResult | null;
  redactionCount: number;
  pageCount: number;
  summary: string | null;
  createdAt: string;
}

// -- Teams ------------------------------------------------------------------

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
}

// -- Activity Feed ----------------------------------------------------------

export interface Activity {
  id: string;
  userId: string;
  action: string;
  description?: string;
  requestId?: string | null;
  requestTitle?: string;
  targetType?: "request" | "document" | "agency" | "team" | "account";
  targetId?: string;
  targetTitle?: string;
  metadata?: Record<string, string> | null;
  timestamp?: string;
  createdAt?: string;
}

// -- Pricing ----------------------------------------------------------------

export interface PricingPlanLimits {
  requestsPerMonth: number;
  documentsPerMonth: number;
  teamMembers: number;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  /** Monthly price in USD (0 for free trial) */
  price: number;
  stripePriceId: string;
  popular: boolean;
  features: string[];
  limits: PricingPlanLimits;
}
