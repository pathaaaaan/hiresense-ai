export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EducationItem {
  institution?: string;
  degree?: string;
  year?: string;
}

export interface ExperienceItem {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

export interface ProjectItem {
  name?: string;
  description?: string;
  technologies?: string[];
}

export interface WeaknessItem {
  area: string;
  issue: string;
}

export interface SuggestionItem {
  area: string;
  suggestion: string;
}

export interface ResumeAnalysis {
  id: string;
  filename: string;
  target_role: string | null;
  skills: string[];
  education: EducationItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  ats_score: number | null;
  missing_skills: string[];
  weaknesses: WeaknessItem[];
  suggestions: SuggestionItem[];
  created_at: string;
}

export interface ResumeListItem {
  id: string;
  filename: string;
  target_role: string | null;
  ats_score: number | null;
  created_at: string;
}

export type QuestionType = "HR" | "TECHNICAL" | "PROJECT";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type SessionStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED";

export interface InterviewQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: Difficulty;
  order_index: number;
}

export interface Evaluation {
  technical_accuracy: number;
  communication: number;
  clarity: number;
  confidence: number;
  completeness: number;
  overall_score: number;
  feedback: string | null;
  improvement_suggestions: string | null;
  ideal_answer: string | null;
}

export interface SubmitAnswerResult {
  question_id: string;
  evaluation: Evaluation;
}

export interface QuestionResult {
  question: InterviewQuestion;
  answer_text: string | null;
  evaluation: Evaluation | null;
}

export interface InterviewReport {
  session_id: string;
  resume_id: string;
  target_role: string;
  status: SessionStatus;
  overall_score: number | null;
  overall_feedback: string | null;
  rubric_averages: Record<string, number>;
  answered_questions: number;
  total_questions: number;
  results: QuestionResult[];
  created_at: string;
}

export interface InterviewListItem {
  id: string;
  resume_id: string;
  target_role: string;
  status: SessionStatus;
  overall_score: number | null;
  created_at: string;
}

export interface RoadmapPlanItem {
  title?: string;
  description?: string;
  duration?: string;
}

export interface RoadmapResource {
  skill?: string;
  title?: string;
  url?: string;
  type?: string;
}

export interface Roadmap {
  id: string;
  resume_id: string;
  target_role: string;
  missing_skills: string[];
  weak_skills: string[];
  strong_skills: string[];
  beginner_plan: RoadmapPlanItem[];
  intermediate_plan: RoadmapPlanItem[];
  advanced_plan: RoadmapPlanItem[];
  resources: RoadmapResource[];
  estimated_duration: string | null;
  created_at: string;
}

export interface ProgressPoint {
  date: string;
  score: number;
  target_role: string;
}

export interface DashboardAnalytics {
  interviews_taken: number;
  average_score: number;
  average_ats_score: number;
  weak_areas: string[];
  strong_areas: string[];
  progress_history: ProgressPoint[];
}
