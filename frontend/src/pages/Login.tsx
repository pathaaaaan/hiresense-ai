import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  async function onSubmit(data: LoginForm) {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/resume");
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
        <p className="text-ink-muted mb-8">Log in to pick up where you left off.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {serverError && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <div>
            <label className="label" htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>

          <p className="text-sm text-ink-muted text-center">
            No account yet?{" "}
            <Link to="/register" className="text-signal hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
