import { api } from "./api";
import type {
  InterviewListItem,
  InterviewQuestion,
  InterviewReport,
  SubmitAnswerResult,
} from "@/types";

export function createInterview(resumeId: string, targetRole: string) {
  return api
    .post<{ session_id: string }>("/api/interviews/create", {
      resume_id: resumeId,
      target_role: targetRole,
    })
    .then((res) => res.data);
}

export function listInterviews() {
  return api.get<InterviewListItem[]>("/api/interviews").then((res) => res.data);
}

export function getQuestions(sessionId: string) {
  return api
    .get<InterviewQuestion[]>(`/api/interviews/${sessionId}/questions`)
    .then((res) => res.data);
}

export function submitAnswer(sessionId: string, questionId: string, answer: string) {
  return api
    .post<SubmitAnswerResult>(`/api/interviews/${sessionId}/questions/${questionId}/submit`, {
      answer,
    })
    .then((res) => res.data);
}

export function finishInterview(sessionId: string) {
  return api.post<InterviewReport>(`/api/interviews/${sessionId}/finish`).then((res) => res.data);
}

export function getResults(sessionId: string) {
  return api.get<InterviewReport>(`/api/interviews/${sessionId}/results`).then((res) => res.data);
}
