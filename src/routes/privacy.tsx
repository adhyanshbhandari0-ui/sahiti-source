import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

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

function Privacy() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated 19 September 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Scope</h2>
            <p>
              This policy explains how the Sahiti prototype handles information. It is published in
              line with the Information Technology Act 2000 and the Information Technology
              (Reasonable Security Practices and Procedures and Sensitive Personal Data or
              Information) Rules 2011. Sahiti is a hackathon prototype and is not a commercial
              financial service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Information we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Mobile number and password used to create your account.</li>
              <li>
                Business profile details you choose to enter, such as name, category and locality.
              </li>
              <li>Content you create: posts, comments, saved items, milestones and photos.</li>
              <li>
                Financial figures you enter in the calculators and the return on investment tracker.
              </li>
              <li>Questions you send to the assistant and the replies generated for you.</li>
            </ul>
            <p className="mt-3">
              We do not ask for Aadhaar numbers, PAN, bank account numbers or card details. Please
              do not enter them anywhere in the app.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. How the information is used
            </h2>
            <p>
              Your information is used only to operate the features you use: authenticating you,
              showing your own records, publishing posts you choose to publish, and generating
              assistant replies. We do not sell information and we do not use it for advertising.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Sharing</h2>
            <p>
              Posts, comments and business profile details are visible to other signed-in users of
              the prototype. Calculations, tracker entries, uploaded photos and assistant
              conversations are private to your account. Assistant messages are processed by a third
              party model provider for the purpose of generating a reply. Information may be
              disclosed if required by law or a valid order from a competent authority.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Storage and security</h2>
            <p>
              Data is stored on managed cloud infrastructure with row level access rules so one
              account cannot read another account's private records. Photos are kept in a private
              storage bucket limited to 5 MB per file. No system is completely secure, and this is a
              prototype rather than a hardened production service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Retention and deletion</h2>
            <p>
              Records are retained while your account exists. You can delete your own posts,
              comments, tracker entries, milestones and photos from within the app. Because this is
              a prototype, the entire demonstration database may be reset at any time without
              notice.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Your rights</h2>
            <p>
              You may review and correct the information in your profile at any time, withdraw
              consent by ceasing to use the prototype, and request deletion of your account records
              by contacting the project team through the hackathon submission channel.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Age and location</h2>
            <p>
              The prototype is intended for residents of India aged 18 years or above. It is not
              directed at children.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
