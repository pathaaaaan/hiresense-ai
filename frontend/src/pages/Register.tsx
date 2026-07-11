import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  async function onSubmit(data: RegisterForm) {
    setServerError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      navigate("/resume");
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-ink-muted mb-8">Start with a free ATS scan of your resume.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          {serverError && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <div>
            <label className="label" htmlFor="name">Full name</label>
            <Input id="name" placeholder="Jordan Lee" {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </div>

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
              placeholder="At least 8 characters"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Use at least 8 characters" },
              })}
            />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) => value === watch("password") || "Passwords don't match",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-sm text-ink-muted text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-signal hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
