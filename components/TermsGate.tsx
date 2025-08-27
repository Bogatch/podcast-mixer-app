// components/TermsGate.tsx
import React, { useMemo, useState } from "react";

type Locale = "sk" | "en";

interface TermsGateProps {
  locale?: Locale;
  emailDefault?: string;
  onSuccessRedirect?: (url: string) => void;
}

const I18N: Record<Locale, any> = {
  en: {
    title: "Confirm terms to continue",
    emailLabel: "Email address",
    emailPlaceholder: "your.email@example.com",
    mustAccept: "You must accept the License Agreement to continue.",
    emailInvalid: "Please enter a valid email address.",
    primaryCta: "Continue to payment",
    openTerms: "View License Agreement",
    checkbox: "I have read and agree to the License Agreement",
    loading: "Preparing secure checkout…",
    serverError: "Could not connect to the payment server. Please try again.",
    modalTitle: "License Agreement",
    modalAgree: "I agree",
    modalClose: "Close",
  },
  sk: {
    title: "Potvrďte podmienky pre pokračovanie",
    emailLabel: "E-mailová adresa",
    emailPlaceholder: "vas@email.sk",
    mustAccept: "Pred pokračovaním musíte súhlasiť s Licenčnou zmluvou.",
    emailInvalid: "Zadajte platnú e-mailovú adresu.",
    primaryCta: "Pokračovať k platbe",
    openTerms: "Zobraziť Licenčnú zmluvu",
    checkbox: "Prečítal(a) som si Licenčnú zmluvu a súhlasím",
    loading: "Pripravuje sa bezpečný checkout…",
    serverError: "Nepodarilo sa pripojiť k platobnému serveru. Skúste znova.",
    modalTitle: "Licenčná zmluva",
    modalAgree: "Súhlasím",
    modalClose: "Zavrieť",
  },
};

const TERMS_HTML_EN = `
<div style="font-family: Inter, Arial, sans-serif; font-size:15px; line-height:1.6; color:#111; padding: 0; max-width: 800px; margin: 0 auto;">
  <h2 style="font-size:22px; font-weight:700; margin-bottom:10px; text-align:center;">📄 License Agreement</h2>
  <p style="text-align:center;"><strong>Effective date:</strong> August 1, 2025</p>

  <p>This <strong>License Agreement</strong> (“Agreement”) governs your use of the software <strong>Podcast Mixer Studio PRO</strong>.
  By proceeding to purchase and/or use the software, you accept this Agreement.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">1. License Grant</h3>
  <p>We grant you a <strong>non-exclusive, non-transferable license</strong> to install and use the software for your internal business or personal use.
  <em>The license key may be used up to the number of activations assigned to your purchase.</em></p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">2. Restrictions</h3>
  <ul style="margin-left:20px; list-style-type:disc;">
    <li>No resale, sub-licensing, renting, or distribution of the license key.</li>
    <li>No reverse engineering, decompiling, or circumventing license enforcement.</li>
    <li>No use that violates applicable laws.</li>
  </ul>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">3. Updates & Support</h3>
  <p>We may provide updates at our discretion.
  Support is provided as described on our website or purchase materials.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">4. Warranty & Liability</h3>
  <p>Software is provided <strong>“as is”</strong> without any warranty.
  To the maximum extent permitted by law, our liability is <strong>limited to the amount you paid</strong>.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">5. Termination</h3>
  <p>We may terminate the license for breach of its terms.
  Upon termination, you must stop using the software and uninstall it.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">6. Governing Law</h3>
  <p>This Agreement is governed by applicable law in your jurisdiction unless otherwise required by mandatory consumer law.</p>
</div>
`;

const TERMS_HTML_SK = `
<div style="font-family: Inter, Arial, sans-serif; font-size:15px; line-height:1.6; color:#111; padding: 0; max-width: 800px; margin: 0 auto;">
  <h2 style="font-size:22px; font-weight:700; margin-bottom:10px; text-align:center;">📄 Licenčná zmluva</h2>
  <p style="text-align:center;"><strong>Účinnosť od:</strong> 1. august 2025</p>

  <p>Táto <strong>Licenčná zmluva</strong> („Zmluva“) upravuje používanie softvéru <strong>Podcast Mixer Studio PRO</strong>.  
  Pokračovaním v nákupe a/alebo používaní softvéru túto Zmluvu akceptujete.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">1. Poskytnutie licencie</h3>
  <p>Udeľujeme vám <strong>nevýhradnú, neprenosnú licenciu</strong> na inštaláciu a používanie softvéru na vaše interné podnikateľské alebo osobné účely.  
  <em>Licenčný kľúč možno použiť najviac do počtu aktivácií priradených k vášmu nákupu.</em></p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">2. Obmedzenia</h3>
  <ul style="margin-left:20px; list-style-type:disc;">
    <li>Zákaz ďalšieho predaja, sublicencovania, prenajímania alebo distribúcie licenčného kľúča.</li>
    <li>Zákaz spätného inžinierstva, dekompilácie alebo obchádzania licenčného mechanizmu.</li>
    <li>Zákaz použitia v rozpore s platnými právnymi predpismi.</li>
  </ul>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">3. Aktualizácie a podpora</h3>
  <p>Aktualizácie môžeme poskytovať podľa vlastného uváženia.  
  Podpora je poskytovaná podľa informácií na našom webe alebo v nákupných podkladoch.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">4. Záruka a zodpovednosť</h3>
  <p>Softvér sa poskytuje <strong>„tak ako je“</strong> bez akejkoľvek záruky.  
  V maximálnom rozsahu povolenom zákonom je naša zodpovednosť <strong>obmedzená na sumu, ktorú ste zaplatili</strong>.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">5. Ukončenie</h3>
  <p>Zmluvu môžeme ukončiť pri porušení jej podmienok.  
  Po ukončení musíte softvér prestať používať a odinštalovať ho.</p>

  <h3 style="margin-top:20px; font-size:17px; font-weight:600;">6. Rozhodné právo</h3>
  <p>Táto Zmluva sa spravuje príslušným právom vašej jurisdikcie, pokiaľ povinné spotrebiteľské právo neustanovuje inak.</p>
</div>
`;

const TERMS_VERSION = "2025-08-01";

const LicenseModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
  locale: Locale;
}> = ({ open, onClose, onAgree, locale }) => {
  if (!open) return null;
  const t = I18N[locale];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-[95%] max-w-3xl bg-white text-[#111] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{t.modalTitle}</h3>
          <button
            onClick={onClose}
            aria-label={t.modalClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 20,
            overflow: "auto",
          }}
          dangerouslySetInnerHTML={{
            __html: locale === "sk" ? TERMS_HTML_SK : TERMS_HTML_EN,
          }}
        />

        <div
          style={{
            padding: 16,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#e5e7eb",
              border: "1px solid #d1d5db",
              cursor: "pointer",
            }}
          >
            {t.modalClose}
          </button>
          <button
            onClick={onAgree}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              border: "1px solid #1d4ed8",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {t.modalAgree}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TermsGate: React.FC<TermsGateProps> = ({
  locale,
  emailDefault,
  onSuccessRedirect,
}) => {
  const computedLocale: Locale = useMemo(() => {
    if (locale) return locale;
    const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
    return nav.toLowerCase().startsWith("sk") ? "sk" : "en";
  }, [locale]);

  const t = I18N[computedLocale];

  const [email, setEmail] = useState(emailDefault || "");
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const emailValid = /^\S+@\S+\.\S+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!emailValid) {
      setErr(t.emailInvalid);
      return;
    }
    if (!accepted) {
      setErr(t.mustAccept);
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          metadata: {
            accepted_terms: true,
            terms_version: TERMS_VERSION,
            terms_embedded: true,
            locale: computedLocale,
          },
        }),
      });

      const data = await resp.json().catch(() => ({} as any));
      if (!resp.ok || !data?.ok || !data?.url) {
        throw new Error(data?.message || t.serverError);
      }

      if (onSuccessRedirect) onSuccessRedirect(data.url);
      else window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message || t.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: "rgba(17,17,17,0.85)",
        color: "#fff",
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
        {t.title}
      </h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email" style={{ fontSize: 14, opacity: 0.9 }}>
          {t.emailLabel}
        </label>
        <div style={{ position: "relative", marginTop: 6, marginBottom: 16 }}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder={t.emailPlaceholder}
            aria-invalid={!emailValid}
            required
            style={{
              width: "100%",
              borderRadius: 10,
              padding: "12px 14px",
              background: "rgba(31,41,55,0.7)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <input
            id="accept"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.currentTarget.checked)}
            style={{ marginTop: 3 }}
          />
          <label htmlFor="accept" style={{ fontSize: 14, lineHeight: 1.5 }}>
            {t.checkbox}{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              style={{
                color: "#60a5fa",
                textDecoration: "underline",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              ({t.openTerms})
            </button>
          </label>
        </div>

        {err && (
          <div
            role="alert"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#fecaca",
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 14,
            }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={!emailValid || !accepted || loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            background: loading ? "#1d4ed8" : "#2563eb",
            border: "1px solid #1d4ed8",
            color: "#fff",
            fontWeight: 800,
            cursor: loading ? "default" : "pointer",
            opacity: !emailValid || !accepted ? 0.6 : 1,
          }}
        >
          {loading ? t.loading : t.primaryCta}
        </button>
      </form>

      <LicenseModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAgree={() => {
          setAccepted(true);
          setShowTerms(false);
        }}
        locale={computedLocale}
      />
    </div>
  );
};

export default TermsGate;
