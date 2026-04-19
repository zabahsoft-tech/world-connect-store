import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Mail, Lock, Eye, EyeOff, User as UserIcon, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Medium", color: "bg-amber-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && user && !done) navigate({ to: "/" });
  }, [user, loading, navigate, done]);

  const strength = useMemo(() => getStrength(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) {
      toast.error("Passwords do not match");
      return;
    }
    if (!agree) {
      toast.error("Please accept the terms");
      return;
    }
    setBusy(true);
    const { error } = await signUp(email, password, fullName.trim() || undefined);
    setBusy(false);
    if (error) toast.error(error);
    else {
      setDone(true);
      toast.success("Account created! Check your email to confirm.");
    }
  };

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent you a confirmation link.">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>.
            Click the link in the email to activate your account, then sign in.
          </p>
          <Button asChild className="w-full h-11">
            <Link to="/login">Go to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create an account" subtitle="Join us — it only takes a minute.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full name <span className="text-muted-foreground">(optional)</span></Label>
          <div className="relative">
            <UserIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="ps-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="ps-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="ps-10 pe-10 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i <= strength.score ? strength.color : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium text-foreground">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className={cn("ps-10 h-11", mismatch && "border-destructive focus-visible:ring-destructive")}
            />
          </div>
          {mismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
          <span>
            I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" className="w-full h-11" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
