import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | Sahiti" },
      {
        name: "description",
        content:
          "Terms of use for the Sahiti prototype: eligibility, acceptable use, prototype disclaimers, liability limits and dispute resolution in New Delhi.",
      },
      { property: "og:title", content: "Sahiti Terms and Conditions" },
      {
        property: "og:description",
        content: "Eligibility, acceptable use, disclaimers and dispute resolution for Sahiti.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated 19 September 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance</h2>
            <p>
              By creating an account or using Sahiti you agree to these terms. If you do not agree,
              do not use the prototype.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
            <p>
              Sahiti is available to residents of India who are 18 years of age or older and who are
              competent to contract under the Indian Contract Act 1872.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Prototype status</h2>
            <p>
              Sahiti is a demonstration prototype built for Smart India Hackathon 2026. Features,
              data and availability may change or be removed without notice. Calculations, scheme
              summaries, market figures and map risk scores are illustrative. Interest rates,
              tenures, eligibility rules and document requirements must be confirmed with the bank
              or the relevant government portal before you act on them.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. No professional advice</h2>
            <p>
              Nothing in Sahiti, including assistant replies, is financial, legal, tax or investment
              advice, and no outcome is guaranteed. Consult a qualified professional, your bank or
              the concerned department before making financial commitments.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your account</h2>
            <p>
              You are responsible for keeping your password confidential and for activity carried
              out through your account. Sessions are signed out automatically after 30 minutes of
              inactivity.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Acceptable use</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Post only business-related content. Personal, political and unlawful content is not
                allowed.
              </li>
              <li>Do not post another person's private information or financial credentials.</li>
              <li>Do not post false claims about government schemes or guaranteed returns.</li>
              <li>Do not attempt to access other accounts or disrupt the service.</li>
            </ul>
            <p className="mt-3">
              You retain ownership of the content you post and grant Sahiti permission to display it
              to other signed-in users of the prototype. Content that breaks these rules may be
              removed.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Limitation of liability</h2>
            <p>
              The prototype is provided on an as-is basis without warranties of any kind. To the
              extent permitted by law, the project team is not liable for any business loss, loss of
              profit or indirect loss arising from use of Sahiti.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Governing law and disputes</h2>
            <p>
              These terms are governed by the laws of India. Any dispute shall be referred to
              arbitration by a sole arbitrator under the Arbitration and Conciliation Act 1996. The
              seat and venue of arbitration shall be New Delhi and the language shall be English.
              Courts at New Delhi shall have exclusive jurisdiction in all other matters.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
