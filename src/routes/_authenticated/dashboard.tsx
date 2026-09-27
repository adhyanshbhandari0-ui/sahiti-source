import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Calculator, Map, MessageCircle, Newspaper } from "lucide-react";
import marketImg from "@/assets/market-cluster.jpg";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Sahiti" },
      {
        name: "description",
        content:
          "Your Sahiti dashboard: business snapshot, monthly performance, milestones and quick links to planning tools.",
      },
      { property: "og:title", content: "Sahiti dashboard" },
      { property: "og:description", content: "Business snapshot and planning shortcuts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const shortcuts = [
  {
    to: "/calculations" as const,
    icon: Calculator,
    title: "Run a calculation",
    body: "Loan structure, paperwork, returns and scheme applications.",
  },
  {
    to: "/feed" as const,
    icon: Newspaper,
    title: "Business feed",
    body: "Scheme explainers and what others are running into.",
  },
  {
    to: "/heatmap" as const,
    icon: Map,
    title: "Lohegaon map",
    body: "Real local shops, plus research zones with competition scores.",
  },
  {
    to: "/assistant" as const,
    icon: MessageCircle,
    title: "Ask Sahiti AI",
    body: "Type or speak a question and hear the answer back.",
  },
];

function Dashboard() {
  const { user } = useSession();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [profile, roi, milestones] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase
          .from("roi_entries")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("milestones")
          .select("*")
          .eq("user_id", user!.id)
          .order("achieved_on", { ascending: false })
          .limit(5),
      ]);
      return {
        profile: profile.data,
        roi: roi.data ?? [],
        milestones: milestones.data ?? [],
      };
    },
  });

  const entries = data?.roi ?? [];
  const sales = entries.reduce((sum, row) => sum + Number(row.sales), 0);
  const expenses = entries.reduce((sum, row) => sum + Number(row.expenses), 0);
  const profit = sales - expenses;
  const roiPercent = expenses > 0 ? (profit / expenses) * 100 : 0;

  const stats = [
    { label: "Recorded sales", value: formatINR(sales) },
    { label: "Recorded expenses", value: formatINR(expenses) },
    { label: "Net profit", value: formatINR(profit) },
    { label: "Return on investment", value: `${roiPercent.toFixed(1)}%` },
  ];

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-lg border shadow-[0_18px_50px_rgb(30_58_138_/_0.1)]">
        <img
          src={marketImg}
          alt="Fresh vegetables and fruit stacked at a Delhi market stall"
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-primary/35" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-6">
          <h2 className="sahiti-kicker text-saffron">Your business snapshot</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/90">
            Figures come from months you log in the ROI tracker. Map and scheme tools sit one tap
            away.
          </p>
        </div>
      </section>

      <PageHeader
        title={`Namaste, ${data?.profile?.display_name ?? "entrepreneur"}`}
        description={
          data?.profile?.business_name
            ? `${data.profile.business_name} · ${data.profile.category} · ${data.profile.block}, ${data.profile.district}`
            : "Add your business details in the profile page to personalise this dashboard."
        }
        action={
          <Button asChild variant="outline">
            <Link to="/profile">Edit profile</Link>
          </Button>
        }
      />

      <section
        aria-label="Business performance"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="sahiti-panel border-t-4 border-t-saffron p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </section>
      {entries.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          These stay at zero until you log a month in the ROI tracker.
        </p>
      )}

      <section aria-label="Shortcuts" className="mt-10 grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="sahiti-panel sahiti-panel-hover group flex items-start gap-4 p-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
              <item.icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-primary">{item.title}</h2>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                />
              </span>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </span>
          </Link>
        ))}
      </section>

      <section aria-label="Milestones" className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Recent milestones</h2>
        {data?.milestones.length ? (
          <ul className="mt-4 space-y-3">
            {data.milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="sahiti-panel flex items-center justify-between gap-3 p-4 text-sm"
              >
                <span className="font-medium">{milestone.title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {milestone.achieved_on}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="sahiti-panel mt-4 p-5">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add milestones from your profile as you go.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
