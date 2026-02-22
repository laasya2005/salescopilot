export interface BuyingSignal {
  signal: string;
  evidence: string;
}

export interface Objection {
  objection: string;
  evidence: string;
}

export interface SuggestedQuestion {
  question: string;
  reason: string;
}

export interface CoachingScript {
  script: string;
  sections: {
    greeting: string;
    strengths: string[];
    improvements: string[];
    missedQuestions: { question: string; why: string }[];
    nextCallQuestions: { question: string; why: string }[];
    closing: string;
  };
}

/* ── Financial Intelligence Types ── */

export type BudgetHealth = "Confirmed" | "Exploring" | "Constrained" | "No Budget";

export interface DealEconomics {
  extractedMonthlySpend: number | null;
  extractedAnnualSpend: number | null;
  contractTermMonths: number | null;
  totalContractValue: number | null;
  weightedPipelineValue: number | null;
  reasoning: string;
}

export interface RevenueRiskItem {
  risk: string;
  severity: "Low" | "Medium" | "High";
  evidence: string;
}

export interface RevenueRiskAssessment {
  overallScore: number;
  budgetConstraintSeverity: "None" | "Mild" | "Moderate" | "Severe";
  paymentDelayLikelihood: "Low" | "Medium" | "High";
  cancellationRisk: "Low" | "Medium" | "High";
  risks: RevenueRiskItem[];
  reasoning: string;
}

export interface CompetitorPriceIntel {
  competitor: string;
  mentionedPrice: string | null;
  discountPressure: boolean;
  context: string;
}

export interface CompetitivePricingIntelligence {
  competitorsDetected: CompetitorPriceIntel[];
  discountPressureLevel: "None" | "Low" | "Medium" | "High";
  priceSensitivitySignal: string;
  reasoning: string;
}

export interface ROIPaybackAnalysis {
  prospectCurrentCost: string | null;
  prospectExpectedSavings: string | null;
  impliedROIPercent: number | null;
  paybackPeriodMonths: number | null;
  dataConfidence: "High" | "Medium" | "Low" | "Insufficient";
  reasoning: string;
}

export interface BudgetHealthIndicator {
  status: BudgetHealth;
  approvalProcess: string | null;
  fiscalYearTiming: string | null;
  budgetOwner: string | null;
  reasoning: string;
}

export interface FinancialAnalysis {
  dealEconomics: DealEconomics;
  revenueRisk: RevenueRiskAssessment;
  competitivePricing: CompetitivePricingIntelligence;
  roiPayback: ROIPaybackAnalysis;
  budgetHealth: BudgetHealthIndicator;
}

export interface AnalysisResult {
  leadScore: number;
  leadScoreReasoning: string;
  worthChasing: boolean;
  worthChasingReasoning: string;
  dealRisk: "Low" | "Medium" | "High";
  dealRiskReasoning: string;
  closeForecast: number;
  closeForecastReasoning: string;
  buyingSignals: BuyingSignal[];
  objections: Objection[];
  nextSteps: string[];
  followUpEmail: string;
  coachingSummary: string;
  suggestedQuestions?: SuggestedQuestion[];
  financialAnalysis?: FinancialAnalysis;
}

export type InputMode = "transcript" | "email-thread" | "event-form" | "batch";

export type BudgetStatus = "Yes" | "No" | "Unsure" | "";
export type DecisionMaker = "Them" | "Someone Else" | "Unknown" | "";
export type Timeline = "Immediate" | "This Quarter" | "This Year" | "Just Exploring" | "";
export type InterestLevel = "Hot" | "Warm" | "Cold" | "";

export interface EventFormData {
  prospectName: string;
  prospectTitle: string;
  companyName: string;
  eventName: string;
  painPoint: string;
  budget: BudgetStatus;
  budgetNotes: string;
  decisionMaker: DecisionMaker;
  decisionMakerName: string;
  timeline: Timeline;
  competitorsMentioned: string;
  interestLevel: InterestLevel;
  nextStepsDiscussed: string;
  notableQuotes: string;
  additionalNotes: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  mode: InputMode;
  companyName: string;
  leadScore: number;
  worthChasing: boolean;
  dealRisk: "Low" | "Medium" | "High";
  result: AnalysisResult;
  // Restoration data
  transcript?: string;
  dealStage?: string;
  dealAmount?: string;
  threadContext?: string;
  eventForm?: EventFormData;
}

export type ChatMessageRole = "user" | "assistant";

export interface ExtractedTask {
  task: string;
  owner: string;
  deadline: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: number;
  tasks?: ExtractedTask[];
}

export interface ChatSuggestedQuestion {
  label: string;
  question: string;
}

export type BatchItemStatus = "pending" | "processing" | "completed" | "error";

export interface BatchItem {
  id: string;
  transcript: string;
  preview: string;
  companyName: string;
  dealStage: string;
  dealAmount: string;
  status: BatchItemStatus;
  result?: AnalysisResult;
  error?: string;
}

/* ── Workspace / Deal Room ── */

export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface WorkspaceTask {
  id: string;
  text: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: number;
  completedAt: number | null;
  source: "ai" | "manual";
  sourceEntryId?: string;
}

export interface WorkspaceNote {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceDocument {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: number;
}

export interface WorkspaceData {
  slug: string;
  companyName: string;
  createdAt: number;
  updatedAt: number;
  tasks: WorkspaceTask[];
  notes: WorkspaceNote[];
  documents: WorkspaceDocument[];
}
