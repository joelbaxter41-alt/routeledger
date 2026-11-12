import Link from "next/link";
import { BrandLogo } from "./brand";
import { ArrowUpRight } from "lucide-react";
import { authenticate, resetPassword } from "@/app/actions";
import { Field, Feedback } from "./forms";
import { Submit } from "./submit";
import { configured } from "@/lib/supabase";
export async function AuthPage({
  mode,
  params,
}: {
  mode: "login" | "signup" | "reset" | "password";
  params: Promise<{
    error?: string;
    success?: string;
    verify?: string;
    requested?: string;
  }>;
}) {
  const p = await params;
  const titles = {
    login: "Welcome back.",
    signup: "Build a more profitable business.",
    reset: "Reset your password.",
    password: "Choose a new password.",
  };
  return (
    <main id="main" className="auth">
      <section className="auth-story">
        <Link href="/" className="logo" aria-label="RouteLedger home">
          <BrandLogo inverse />
        </Link>
        <div>
          <span className="eyebrow" style={{ color: "#a5c5a2" }}>
            BUILT FOR THE WAY YOU WORK
          </span>
          <h1>
            Good work deserves
            <br />a healthy profit.
          </h1>
          <p>
            A clearer picture of every customer, every job, and every dollar.
            All in one place.
          </p>
        </div>
        <div className="muted">Run your business. Know your numbers.</div>
      </section>
      <section className="auth-form">
        <div>
          <h1>{titles[mode]}</h1>
          <p className="muted">
            {mode === "login"
              ? "Your business, at a glance. Let’s get to work."
              : mode === "signup"
                ? "Start free. No credit card required."
                : "We’ll help you get back to your business."}
          </p>
          <Feedback params={p} />
          {p.verify && (
            <div className="alert">
              Check your email to verify your account before signing in.
            </div>
          )}
          {p.requested && (
            <div className="alert">
              If this email has an account, a recovery link is on its way.
            </div>
          )}
          {!configured() ? (
            <div className="alert error">
              Authentication is awaiting Supabase configuration. Add the
              environment variables and apply the database migration described
              in the README.
            </div>
          ) : (
            <form
              action={mode === "password" ? resetPassword : authenticate}
              className="stack"
            >
              <input type="hidden" name="mode" value={mode} />
              {mode !== "password" && (
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  required
                />
              )}
              {!["reset"].includes(mode) && (
                <Field
                  label="Password · at least 10 characters"
                  name="password"
                  type="password"
                  required
                />
              )}
              <Submit>
                {mode === "signup"
                  ? "Create your account"
                  : mode === "reset"
                    ? "Send recovery link"
                    : mode === "password"
                      ? "Update password"
                      : "Sign in"}
              </Submit>
            </form>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>
            {mode === "login" ? (
              <>
                New to RouteLedger?{" "}
                <Link className="text-link" href="/signup">
                  Start for free <ArrowUpRight size={13} />
                </Link>
                <br />
                <Link href="/forgot-password">Forgot password?</Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link className="text-link" href="/login">
                  Sign in
                </Link>
              </>
            )}
          </p>
          {mode === "signup" && (
            <p className="definition">
              By creating an account, you agree to our{" "}
              <Link href="/terms">Terms</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
