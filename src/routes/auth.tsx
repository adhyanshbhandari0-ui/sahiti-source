import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import authPortrait from "@/assets/auth-portrait.jpg";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account | Sahiti" },
      {
        name: "description",
        content:
          "Access Sahiti business planning tools with your mobile number and password. Demonstration sign-in for the hackathon prototype.",
      },
      { property: "og:title", content: "Access Sahiti" },
      { property: "og:description", content: "Sign in to Sahiti business planning tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "+91", password: "" });

  const passwordSchema = z
    .string()
    .min(8, t("authPwLength"))
    .regex(/[A-Z]/, t("authPwUppercase"))
    .regex(/[0-9]/, t("authPwNumber"))
    .regex(/[^A-Za-z0-9]/, t("authPwSpecial"));

  const phoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, t("authPhoneFormat"));

  const phoneEmail = (phone: string) => `${phone.replace(/\D/g, "")}@phone.sahiti.demo`;

  useEffect(() => {
    if (session) void navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const phone = phoneSchema.safeParse(form.phone);
    if (!phone.success) {
      setError(phone.error.issues[0]?.message ?? t("authErrPhone"));
      return;
    }
    const password = passwordSchema.safeParse(form.password);
    if (!password.success) {
      setError(password.error.issues[0]?.message ?? t("authErrPassword"));
      return;
    }
    if (mode === "signup" && (form.name.trim().length < 3 || form.name.trim().length > 100)) {
      setError(t("authErrName"));
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: phoneEmail(form.phone),
          password: form.password,
        });
        if (signUpError) throw signUpError;
        if (!data.user) throw new Error(t("authErrAccount"));
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          phone: form.phone,
          display_name: form.name.trim(),
        });
        if (profileError) throw profileError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: phoneEmail(form.phone),
          password: form.password,
        });
        if (signInError) throw signInError;
      }
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authErrGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src={authPortrait}
          alt={t("authPortraitAlt")}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <BrandLogo invert />
          <div>
            <p className="sahiti-kicker text-saffron">Sahiti</p>
            <h1 className="mt-4 max-w-lg font-display text-5xl font-semibold leading-[1.08] tracking-tight">
              {t("authHeroTitle")}
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-white/85">{t("authHeroBody")}</p>
          </div>
          <p className="text-sm text-white/70">{t("authPrototypeLine")}</p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-background p-4 sm:p-8">
        <div className="sahiti-panel w-full max-w-md p-6 sm:p-8">
          <div className="mb-8 h-1 w-12 rounded-full bg-saffron" />
          <div className="mb-9 lg:hidden">
            <BrandLogo />
          </div>
          <p className="text-sm font-semibold text-primary">
            {mode === "login" ? t("authWelcomeBack") : t("authCreateTitle")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-[2rem]">
            {mode === "login" ? t("authSignInTitle") : t("authStartPlanning")}
          </h2>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">{t("authFullName")}</Label>
                <Input
                  id="name"
                  className="mt-2 h-11 bg-muted"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="phone">{t("authMobileNumber")}</Label>
              <Input
                id="phone"
                className="mt-2 h-11 bg-muted"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("authPhoneHint")}</p>
            </div>
            <div>
              <Label htmlFor="password">{t("authPassword")}</Label>
              <Input
                id="password"
                className="mt-2 h-11 bg-muted"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {mode === "signup" && (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("authPwHint")}</p>
              )}
            </div>
            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}
            <Button className="h-12 w-full" disabled={busy}>
              {busy
                ? t("authPleaseWait")
                : mode === "login"
                  ? t("authSignIn")
                  : t("authCreateAccount")}
            </Button>
          </form>

          <button
            type="button"
            className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? t("authNewToSahiti") : t("authHaveAccount")}
          </button>

          <p className="mt-8 text-xs leading-5 text-muted-foreground">{t("authDisclaimer")}</p>
        </div>
      </section>
    </main>
  );
}
