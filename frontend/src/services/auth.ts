import { api } from "./api";
import type { AuthResponse } from "@/types";

export function registerUser(name: string, email: string, password: string) {
  return api
    .post<AuthResponse>("/api/auth/register", { name, email, password })
    .then((res) => res.data);
}

export function loginUser(email: string, password: string) {
  return api
    .post<AuthResponse>("/api/auth/login", { email, password })
    .then((res) => res.data);
}
