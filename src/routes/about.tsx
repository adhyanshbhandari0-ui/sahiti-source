import { createFileRoute } from "@tanstack/react-router";
import marketImg from "@/assets/market-cluster.jpg";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Sahiti | Hyper-local business advisory prototype" },
      {
        name: "description",
        content:
          "Sahiti is a Smart India Hackathon 2026 prototype for MoSJE problem statement 26091, built to help rural micro-entrepreneurs structure finance and read their local market.",
      },
      { property: "og:title", content: "About Sahiti" },
      {
        property: "og:description",
        content: "Why Sahiti exists, who it is for and what the prototype does not do.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const INCLUDED = [
  "A loan calculator that turns your margin capital into project cost, loan size and EMI.",
  "A document checklist grouped by what you actually have to go and collect.",
  "An ROI tracker that rates risk and points at schemes that match your numbers.",
  "A real-time scheme finder, then a four-step application you can follow through.",
  "A map of real local shops from OpenStreetMap next to Lohegaon research zones.",
  "An assistant you can talk to and have read the answer back.",
];

function About() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-lg border shadow-[0_18px_50px_rgb(30_58_138_/_0.08)]">
          <img
            src={marketImg}
            alt="Fresh vegetables and fruit stacked at a Delhi market stall"
            className="h-56 w-full object-cover"
          />
        </div>
        <p className="sahiti-kicker mt-10 text-primary">About the project</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-primary">
          About Sahiti
        </h1>

        <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            Sahiti is a prototype built for Smart India Hackathon 2026, against the Ministry of
            Social Justice and Empowerment problem statement 26091.
          </p>
          <p>
            The problem it works on is narrow. A first-time rural business owner usually does not
            know how much finance their own savings can unlock, what paperwork the bank will ask
            for, or how crowded their own locality already is. Most of that knowledge sits with
            people who have already borrowed. Sahiti tries to put it in one place.
          </p>

          <h2 className="font-display text-xl font-semibold text-foreground">What is inside</h2>
          <ul className="space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-saffron"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-xl font-semibold text-foreground">What it is not</h2>
          <p>
            Sahiti is not a lender, not a government portal and not a financial adviser. Scheme
            terms and eligibility change, so confirm them with the bank or on udyamimitra.in before
            you act. The Lohegaon zone scores are demonstration research built for this prototype.
            Shop listings come from OpenStreetMap and are factual locations, not endorsements.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
