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
