import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "Sahiti AI | Sahiti" },
      {
        name: "description",
        content:
          "Ask Sahiti AI anything about loans, schemes, documents and running your business.",
      },
      { property: "og:title", content: "Sahiti AI" },
      { property: "og:description", content: "Your business AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiPage,
});

const AssistantEmbedded = lazy(() => import("@/components/feed/AssistantEmbedded"));

function AiPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageHeader title={t("assistant")} description={t("aiPageDescription")} />
      <Suspense
        fallback={
          <div className="sahiti-panel flex h-[60dvh] items-center justify-center text-sm text-muted-foreground">
            {t("aiLoading")}
          </div>
        }
      >
        <AssistantEmbedded />
      </Suspense>
    </>
  );
}
