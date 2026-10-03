import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Sahiti" },
      {
        name: "description",
        content:
          "How Sahiti collects, stores, shares and retains personal and business information under the Information Technology Act 2000 and its rules.",
      },
      { property: "og:title", content: "Sahiti Privacy Policy" },
      {
        property: "og:description",
        content: "Data collection, storage, retention and user rights in the Sahiti prototype.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const COLLECTED = [
  "privacyS2P1",
  "privacyS2P2",
  "privacyS2P3",
  "privacyS2P4",
  "privacyS2P5",
] as const;

const SECTIONS = [
  { heading: "privacyS3H", body: "privacyS3" },
  { heading: "privacyS4H", body: "privacyS4" },
  { heading: "privacyS5H", body: "privacyS5" },
  { heading: "privacyS6H", body: "privacyS6" },
  { heading: "privacyS7H", body: "privacyS7" },
  { heading: "privacyS8H", body: "privacyS8" },
] as const;

function Privacy() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t("privacyTitle")} | ${t("titleSuffix")}`;
  }, [t]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold">{t("privacyTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("privacyUpdated")}</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">{t("privacyS1H")}</h2>
            <p>{t("privacyS1")}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">{t("privacyS2H")}</h2>
            <ul className="list-disc space-y-2 pl-5">
              {COLLECTED.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
            <p className="mt-3">{t("privacyS2P6")}</p>
          </section>
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-foreground">{t(section.heading)}</h2>
              <p>{t(section.body)}</p>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
