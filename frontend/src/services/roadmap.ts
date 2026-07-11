import { api } from "./api";
import type { Roadmap } from "@/types";

export function getRoadmap(resumeId: string) {
  return api.get<Roadmap>(`/api/roadmaps/${resumeId}`).then((res) => res.data);
}
