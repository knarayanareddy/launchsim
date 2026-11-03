import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import NotFound from "./NotFound";

/**
 * Minimal Terms + Privacy pages.
 *
 * Signup requires ticking "I agree to the Terms of Service and Privacy Policy"
 * while neither document existed anywhere in the app — a compliance gap for a
 * product storing user emails and product pitches.
 *
 * NOTE: this is a starting scaffold, not legal advice. Replace the placeholder
 * copy with reviewed text before publishing.
 */
const LAST_UPDATED = "3 November 2026";

const Terms = () => (
  <div className="prose prose-invert max-w-3xl mx-auto">
    <h1>Terms of Service</h1>
    <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

    <h2>What LaunchSim is</h2>
    <p>
      LaunchSim generates simulated reactions to product pitches using large
      language models. Output is illustrative, not factual research. Do not treat
      a Launch Readiness Score as evidence of market demand.
    </p>

    <h2>Simulation credits</h2>
    <p>
      Each completed simulation consumes one credit. A run that fails before
      producing a report is refunded automatically. Credits are non-transferable
      and have no cash value.
    </p>

    <h2>Your content</h2>
    <p>
      You keep ownership of the product descriptions and other content you submit.
      You grant us the licence needed to process it and to produce your report.
      Reports are private until you choose to share them; a shared report is
      readable by anyone holding its link.
    </p>

    <h2>Acceptable use</h2>
    <p>
      Do not use LaunchSim to generate unlawful content, to attempt to extract
      system prompts, or to place load on the service beyond normal use. We may
      suspend accounts that do.
    </p>

    <h2>Availability and liability</h2>
    <p>
      The service is provided "as is" without warranties. To the maximum extent
      permitted by law, our aggregate liability is limited to the amount you paid
      us in the twelve months preceding a claim.
    </p>

    <h2>Contact</h2>
    <p>Questions: support@launchsim.app</p>
  </div>
);

const Privacy = () => (
  <div className="prose prose-invert max-w-3xl mx-auto">
    <h1>Privacy Policy</h1>
    <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

    <h2>What we collect</h2>
    <ul>
      <li><strong>Account data</strong> — name, email, avatar, plan and credit balance.</li>
      <li><strong>Product content</strong> — the pitches you submit and the reports generated from them.</li>
      <li><strong>Operational data</strong> — error logs and basic usage counters.</li>
    </ul>

    <h2>How we use it</h2>
    <p>
      To run simulations, maintain your account, send transactional email
      (welcome, report-ready, low-credit notices) and diagnose failures.
      Marketing email is opt-in and can be disabled in{" "}
      <Link to="/settings" className="text-primary">Settings</Link>.
    </p>

    <h2>Sub-processors</h2>
    <ul>
      <li><strong>Supabase / Lovable Cloud</strong> — database, auth, storage, edge functions (EU/US).</li>
      <li><strong>Lovable AI Gateway (Google Gemini)</strong> — model inference. Your product description is sent as prompt context.</li>
      <li><strong>Resend</strong> — transactional email delivery.</li>
      <li><strong>Notion</strong> — only when you explicitly export a report using your own integration token.</li>
    </ul>

    <h2>Retention and deletion</h2>
    <p>
      Simulations and personas are retained until you delete them. Deleting your
      account removes your profile, simulations and personas. Toast us at
      support@launchsim.app for a full export or deletion.
    </p>

    <h2>Your rights</h2>
    <p>
      Under the GDPR you may request access, correction, export or erasure of your
      data. We respond within 30 days.
    </p>
  </div>
);

const Legal = () => {
  const { doc } = useParams<{ doc: string }>();

  if (doc !== "terms" && doc !== "privacy") return <NotFound />;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={doc === "terms" ? "Terms of Service" : "Privacy Policy"}
        description={
          doc === "terms"
            ? "LaunchSim Terms of Service."
            : "How LaunchSim collects, uses and protects your data."
        }
        path={`/legal/${doc}`}
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-6 pt-24 pb-20">
        {doc === "terms" ? <Terms /> : <Privacy />}
      </main>
      <Footer />
    </div>
  );
};

export default Legal;
