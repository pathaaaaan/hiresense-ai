import { api } from "./api";
import type { ResumeAnalysis, ResumeListItem } from "@/types";

export function analyzeResume(file: File, targetRole?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (targetRole) formData.append("target_role", targetRole);

  return api
    .post<ResumeAnalysis>("/api/resumes/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
}

export function listResumes() {
  return api.get<ResumeListItem[]>("/api/resumes").then((res) => res.data);
}

export function getResume(id: string) {
  return api.get<ResumeAnalysis>(`/api/resumes/${id}`).then((res) => res.data);
}
