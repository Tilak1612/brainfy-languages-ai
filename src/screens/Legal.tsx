import type { Screen } from "../data";
import { BrandLogoIcon } from "../components/icons";

// Public legal pages. Rendered OUTSIDE the auth gate (see App.tsx) so a
// prospective user — or an app store reviewer — can read them without an
// account, which is the whole point of having them.
//
// This is standard, honest boilerplate written to match what the app actually
// does. It is NOT a substitute for review by a lawyer before relying on it for
// a paid product that processes voice data.

const COMPANY = "Brainfy AI Inc.";
const PRODUCT = "Brainfy Languages AI";
const CONTACT = "support@brainfyai.com";
const UPDATED = "23 July 2026";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-7 font-display text-[19px] font-bold tracking-[-.015em]">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[14.5px] leading-[1.65] text-[#403d38]">{children}</p>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="mb-1.5 text-[14.5px] leading-[1.6] text-[#403d38]">{children}</li>;
}

function Privacy() {
  return (
    <>
      <P>
        This Privacy Policy explains what {COMPANY} (&ldquo;we&rdquo;) collects when you use {PRODUCT},
        why, and the choices you have. We collect only what the product needs to work.
      </P>

      <H>What we collect</H>
      <ul className="mb-3 list-disc pl-5">
        <LI><b>Account details.</b> Your email address and display name, to create and secure your account.</LI>
        <LI><b>Learning data.</b> Your progress — XP, streak, lessons completed, review history, skill estimates — so your account remembers where you are.</LI>
        <LI><b>Conversation and voice input.</b> Text you send to a tutor, and, when you use speaking or pronunciation features, short audio recordings you choose to make. Audio is sent to our speech provider to transcribe what you said and is not used to build a voice profile.</LI>
        <LI><b>Payment data.</b> If you subscribe, our payment processor (Stripe) handles your card details. We never see or store your full card number.</LI>
        <LI><b>Basic technical data.</b> Standard request logs from our hosting provider, used to keep the service running and secure.</LI>
      </ul>

      <H>How we use it</H>
      <P>
        To run and improve the learning experience, save your progress, provide AI tutoring and
        pronunciation feedback, process subscriptions, and keep the service secure. We do not sell
        your personal data.
      </P>

      <H>Service providers</H>
      <P>To provide the service we share data with providers who process it on our behalf:</P>
      <ul className="mb-3 list-disc pl-5">
        <LI><b>Supabase</b> — database, authentication, and storage of your account and progress.</LI>
        <LI><b>Vercel</b> — application hosting.</LI>
        <LI><b>Anthropic (Claude)</b> — powers the AI tutor conversations from the text of your messages.</LI>
        <LI><b>NVIDIA</b> — speech-to-text and text-to-speech for voice and pronunciation features.</LI>
        <LI><b>Stripe</b> — subscription billing and payment processing.</LI>
      </ul>
      <P>Each provider processes your data only to deliver its part of the service.</P>

      <H>Retention</H>
      <P>
        We keep your account and learning data for as long as your account exists. Voice recordings
        are processed to produce a transcript and are not retained as a long-term voice archive.
        When you delete your account, your data is deleted (see below).
      </P>

      <H>Your choices and rights</H>
      <P>
        You can edit your display name and reset your progress at any time in Settings. You can
        permanently delete your account and all associated data from Settings &rarr; Delete account;
        this also cancels any active subscription. Depending on where you live, you may have
        additional rights under laws such as the GDPR or CCPA — including access, correction, and
        deletion. To exercise any of these, contact us at {CONTACT}.
      </P>

      <H>Children</H>
      <P>{PRODUCT} is not directed to children under 13, and we do not knowingly collect their data.</P>

      <H>Changes</H>
      <P>
        We may update this policy. Material changes will be reflected by the &ldquo;last updated&rdquo;
        date above.
      </P>

      <H>Contact</H>
      <P>Questions about privacy? Email {CONTACT}.</P>
    </>
  );
}

function Terms() {
  return (
    <>
      <P>
        These Terms govern your use of {PRODUCT}, provided by {COMPANY}. By using the app you agree
        to them.
      </P>

      <H>Your account</H>
      <P>
        You are responsible for keeping your login secure and for activity under your account. Give
        accurate information when you sign up, and let us know of any unauthorized use.
      </P>

      <H>Acceptable use</H>
      <P>You agree not to:</P>
      <ul className="mb-3 list-disc pl-5">
        <LI>break the law or infringe others&rsquo; rights while using the service;</LI>
        <LI>attempt to disrupt, reverse-engineer, or gain unauthorized access to the service or its infrastructure;</LI>
        <LI>abuse the AI features — for example to generate harmful content or to resell access to the underlying models; or</LI>
        <LI>use automated means to access the service beyond normal personal use.</LI>
      </ul>

      <H>Subscriptions and payment</H>
      <P>
        Some features require a paid subscription. Prices, billing period, and any free trial are
        shown before you subscribe. Subscriptions renew automatically until cancelled; you can cancel
        at any time and keep access until the end of the current period. Payments are processed by
        Stripe. Except where required by law, payments are non-refundable.
      </P>

      <H>The AI tutor</H>
      <P>
        The tutors are AI language partners. They can make mistakes and are not a substitute for a
        certified teacher, translator, or professional advice. Practice with them accordingly.
      </P>

      <H>Your content</H>
      <P>
        You keep ownership of what you write and record. You grant us the limited right to process it
        to provide the service (for example, sending your message to the AI model or your audio to be
        transcribed), as described in the Privacy Policy.
      </P>

      <H>Availability and changes</H>
      <P>
        We may update, suspend, or discontinue features. We aim to keep the service running but do not
        guarantee uninterrupted availability.
      </P>

      <H>Disclaimers and liability</H>
      <P>
        The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
        extent permitted by law, {COMPANY} is not liable for indirect or consequential damages arising
        from your use of the service.
      </P>

      <H>Termination</H>
      <P>
        You may stop using the service and delete your account at any time. We may suspend or terminate
        access if these Terms are breached.
      </P>

      <H>Contact</H>
      <P>Questions about these Terms? Email {CONTACT}.</P>
    </>
  );
}

export default function Legal({
  kind,
  onNavigate,
}: {
  kind: "privacy" | "terms";
  onNavigate: (s: Screen) => void;
}) {
  const isPrivacy = kind === "privacy";
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-[#E4E1DA] bg-cream/[.85] backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-4">
          <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-[11px]" aria-label="Back to Brainfy">
            <div className="grad-brand-3 flex h-[32px] w-[32px] items-center justify-center rounded-[9px]">
              <BrandLogoIcon />
            </div>
            <span className="font-display text-[15px] font-bold tracking-[-.02em]">Brainfy</span>
          </button>
          <button
            onClick={() => onNavigate("dashboard")}
            className="text-[13.5px] font-bold text-brand transition hover:brightness-110"
          >
            &larr; Back to app
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 py-10">
        <h1 className="m-0 font-display text-[30px] font-extrabold tracking-[-.025em]">
          {isPrivacy ? "Privacy Policy" : "Terms of Service"}
        </h1>
        <div className="mb-6 mt-1.5 text-[13px] text-muted">Last updated: {UPDATED}</div>

        {isPrivacy ? <Privacy /> : <Terms />}

        <div className="mt-10 border-t border-[#E4E1DA] pt-5 text-[13.5px] text-muted">
          {isPrivacy ? (
            <>See also our <button onClick={() => onNavigate("terms")} className="font-semibold text-brand underline underline-offset-2">Terms of Service</button>.</>
          ) : (
            <>See also our <button onClick={() => onNavigate("privacy")} className="font-semibold text-brand underline underline-offset-2">Privacy Policy</button>.</>
          )}
        </div>
      </main>
    </div>
  );
}
