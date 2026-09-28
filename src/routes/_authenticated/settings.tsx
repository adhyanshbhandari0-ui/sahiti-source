import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { languageOptions, useLanguage, type Locale } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Sahiti" },
      {
        name: "description",
        content:
          "Choose your app language, review session security and account details in the Sahiti prototype.",
      },
      { property: "og:title", content: "Sahiti settings" },
      { property: "og:description", content: "Language, session and account preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { locale, setLocale, t } = useLanguage();
  const { user, signOut } = useSession();
  const navigate = useNavigate();

  async function changeLocale(next: Locale) {
    setLocale(next);
    if (user) await supabase.from("profiles").update({ locale: next }).eq("id", user.id);
  }

  return (
    <>
      <PageHeader title={t("settings")} description={t("settingsDescription")} />

      <div className="max-w-2xl space-y-8">
        <section className="rounded-md border p-5">
          <h2 className="text-base font-semibold">{t("language")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("settingsLanguageDesc")}</p>
          <div className="mt-4 max-w-xs">
            <Label htmlFor="locale">{t("settingsAppLanguage")}</Label>
            <Select value={locale} onValueChange={(value) => void changeLocale(value as Locale)}>
              <SelectTrigger id="locale" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="rounded-md border p-5">
          <h2 className="text-base font-semibold">{t("settingsSecurityTitle")}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t("settingsSecurity1")}</li>
            <li>{t("settingsSecurity2")}</li>
            <li>{t("settingsSecurity3")}</li>
          </ul>
        </section>

        <section className="rounded-md border p-5">
          <h2 className="text-base font-semibold">{t("settingsAccountTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("settingsSignedInSince")}{" "}
            {user?.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString(locale)
              : t("settingsNow")}
            .
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={async () => {
              await signOut();
              await navigate({ to: "/" });
            }}
          >
            {t("logout")}
          </Button>
        </section>
      </div>
    </>
  );
}
