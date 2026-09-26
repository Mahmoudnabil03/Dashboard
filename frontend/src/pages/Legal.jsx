import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, FileText, Shield, CheckCircle } from 'lucide-react';

const legalPages = {
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'January 15, 2025',
    version: '2.1',
    sections: [
      { id: 'acceptance', title: '1. Acceptance of Terms', content: `By accessing or using SocialHub ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.` },
      { id: 'definitions', title: '2. Definitions', content: `"Service" refers to SocialHub, the social media management platform operated by Sold Out Technologies. "User" refers to any individual or entity that accesses or uses the Service. "Content" refers to any text, images, videos, or other materials posted through the Service. "Workspace" refers to the organizational unit within SocialHub that contains your accounts, team members, and data.` },
      { id: 'accounts', title: '3. Account Registration', content: `You must be at least 18 years old to register. You must provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use.` },
      { id: 'subscription', title: '4. Subscription & Billing', content: `SocialHub offers free and paid plans. Paid subscriptions auto-renew unless cancelled. Prices are in USD and may change with 30 days notice. Refunds are handled per our Refund Policy. Egyptian users will be charged in EGP at prevailing exchange rates plus applicable taxes.` },
      { id: 'acceptable-use', title: '5. Acceptable Use', content: `You agree not to: (a) violate any laws or regulations; (b) infringe intellectual property rights; (c) spam, scrape, or abuse the Service; (d) attempt to gain unauthorized access; (e) use the Service for illegal activities including those prohibited under Egyptian Law No. 151 of 2020 on Personal Data Protection.` },
      { id: 'intellectual-property', title: '6. Intellectual Property', content: `SocialHub and all related trademarks, logos, and content are owned by Sold Out Technologies. You retain ownership of your Content. By posting Content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your Content solely for providing the Service.` },
      { id: 'third-party', title: '7. Third-Party Services', content: `The Service integrates with third-party platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube, Google, etc.). Your use of these integrations is subject to their respective terms. We are not responsible for their availability, policies, or actions.` },
      { id: 'data', title: '8. Data & Privacy', content: `Your data is processed per our Privacy Policy. We implement appropriate technical and organizational measures to protect personal data in compliance with Egypt Law No. 151 of 2020 and GDPR where applicable.` },
      { id: 'disclaimers', title: '9. Disclaimers', content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED, ERROR-FREE, OR SECURE ACCESS. SOCIAL MEDIA PLATFORM API CHANGES MAY AFFECT FUNCTIONALITY.` },
      { id: 'limitation', title: '10. Limitation of Liability', content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOLD OUT TECHNOLOGIES SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.` },
      { id: 'indemnification', title: '11. Indemnification', content: `You agree to indemnify and hold harmless Sold Out Technologies from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any rights.` },
      { id: 'termination', title: '12. Termination', content: `We may suspend or terminate your access immediately for breach of these Terms. Upon termination, your right to use the Service ceases. Certain provisions survive termination.` },
      { id: 'governing-law', title: '13. Governing Law & Disputes', content: `These Terms are governed by the laws of the Arab Republic of Egypt. Disputes shall be resolved in the competent courts of Cairo, Egypt. For international users, this does not affect mandatory consumer protections in your jurisdiction.` },
      { id: 'changes', title: '14. Changes to Terms', content: `We may modify these Terms at any time. Material changes will be communicated via email or in-app notification 30 days before taking effect. Continued use constitutes acceptance.` },
      { id: 'contact', title: '15. Contact', content: `Questions about these Terms? Contact us at legal@solout.tech or +20 100 000 0000. Sold Out Technologies, Cairo, Egypt.` },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'January 15, 2025',
    version: '2.0',
    sections: [
      { id: 'intro', title: '1. Introduction', content: `Sold Out Technologies ("we", "us", "our") operates SocialHub. We respect your privacy and are committed to protecting your personal data in accordance with Egypt Law No. 151 of 2020 on Personal Data Protection and the EU GDPR where applicable.` },
      { id: 'data-controller', title: '2. Data Controller', content: `Data Controller: Sold Out Technologies, Cairo, Egypt. Email: privacy@solout.tech. Data Protection Officer: dpo@solout.tech.` },
      { id: 'data-collected', title: '3. Data We Collect', content: `Account Data: name, email, password hash, company info. Usage Data: IP address, device info, browser type, access times, feature usage. Social Data: OAuth tokens, profile info, posts, comments, messages (with your consent). Analytics Data: aggregated usage statistics. Payment Data: billing info (processed by Stripe, we don't store full card details).` },
      { id: 'legal-basis', title: '4. Legal Basis for Processing', content: `Contract performance (providing the Service), Legitimate interests (improving, securing the Service), Consent (marketing, optional analytics), Legal obligations (tax, compliance).` },
      { id: 'purposes', title: '5. Purposes of Processing', content: `Provide and maintain the Service; Authenticate and authorize users; Process payments; Send service communications; Improve and personalize the Service; Ensure security and fraud prevention; Comply with legal obligations.` },
      { id: 'sharing', title: '6. Data Sharing', content: `We do not sell your data. We share with: Service providers (hosting, payments, email) under DPAs; Social media platforms (when you connect accounts); Legal authorities when required by law; Business transfers (with notice).` },
      { id: 'international', title: '7. International Transfers', content: `Data may be processed outside Egypt. We ensure adequate protection via Standard Contractual Clauses or adequacy decisions.` },
      { id: 'retention', title: '8. Data Retention', content: `Account data: retained while account is active + 2 years after closure. Usage logs: 12 months. Payment data: per tax law (5 years in Egypt). Backups: 90 days.` },
      { id: 'rights', title: '9. Your Rights (Egypt Law 151/2020 & GDPR)', content: `Right to access, rectify, erase, restrict processing, data portability, object to processing, withdraw consent. Submit requests to privacy@solout.tech. We respond within 30 days.` },
      { id: 'security', title: '10. Security Measures', content: `Encryption in transit (TLS 1.3) and at rest (AES-256); PBKDF2 password hashing; JWT tokens with rotation; Rate limiting; Regular security audits; Incident response plan; SOC 2 aligned practices.` },
      { id: 'cookies', title: '11. Cookies & Tracking', content: `Essential cookies (session, auth, security); Analytics cookies (with consent); Preference cookies. See Cookie Policy for details.` },
      { id: 'children', title: '12. Children\'s Privacy', content: `Service not directed to under 18. We don't knowingly collect children's data. Contact us if you believe we have.` },
      { id: 'changes', title: '13. Changes', content: `We'll notify of material changes via email/in-app 30 days prior. Last updated: January 15, 2025.` },
      { id: 'contact', title: '14. Contact', content: `Privacy questions: privacy@solout.tech or +20 100 000 0000. DPO: dpo@solout.tech. Sold Out Technologies, Cairo, Egypt.` },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    lastUpdated: 'January 15, 2025',
    version: '1.0',
    sections: [
      { id: 'what', title: '1. What Are Cookies', content: `Cookies are small text files stored on your device. They help the website function, remember preferences, and provide analytics.` },
      { id: 'categories', title: '2. Cookie Categories', content: `Essential (required): session management, authentication, security, load balancing. Analytics (with consent): usage statistics, feature adoption, performance monitoring. Preferences: theme, language, dashboard layout. Marketing: none currently used.` },
      { id: 'list', title: '3. Specific Cookies', content: `session_id (essential, session): authentication token. csrf_token (essential, session): CSRF protection. user_prefs (preferences, 1 year): theme, language. analytics_consent (preferences, 1 year): consent record. _ga/_gid (analytics, 2 years/24h): Google Analytics (if enabled).` },
      { id: 'control', title: '4. Controlling Cookies', content: `Browser settings can block/delete cookies. Disabling essential cookies breaks the Service. Analytics cookies can be toggled in Settings → Privacy.` },
      { id: 'third-party', title: '5. Third-Party Cookies', content: `Stripe (payments): __stripe_sid, __stripe_mid. Google Analytics: _ga, _gid (if enabled). Social media OAuth: platform-specific session cookies.` },
      { id: 'contact', title: '6. Contact', content: `Questions: privacy@solout.tech` },
    ],
  },
  compliance: {
    title: 'Egypt Compliance',
    lastUpdated: 'January 15, 2025',
    version: '1.0',
    sections: [
      { id: 'overview', title: '1. Regulatory Framework', content: `SocialHub complies with: Egypt Law No. 151 of 2020 on Personal Data Protection; Egypt Law No. 175 of 2018 on Anti-Cybercrime; Egypt Law No. 15 of 2004 on E-Signature; Central Bank of Egypt regulations for payment processing; NTRA guidelines for digital services.` },
      { id: 'data-localization', title: '2. Data Localization', content: `Primary data center: AWS Bahrain (meets Egypt data residency requirements). Backups: encrypted, stored in-region. No personal data leaves approved jurisdictions without safeguards.` },
      { id: 'dpo', title: '3. Data Protection Officer', content: `Appointed per Law 151/2020: dpo@solout.tech. Responsible for compliance monitoring, DPIAs, and authority liaison.` },
      { id: 'breach', title: '4. Breach Notification', content: `We notify NTRA and affected users within 72 hours of discovering a personal data breach, per Law 151/2020 Article 25.` },
      { id: 'cross-border', title: '5. Cross-Border Transfers', content: `Transfers rely on: NTRA-approved standard contractual clauses; Adequacy decisions; Explicit user consent where required.` },
      { id: 'user-rights', title: '6. User Rights Under Egyptian Law', content: `Right to information, access, correction, deletion, objection, restriction, portability, and not to be subject to automated decision-making.` },
      { id: 'retention-schedule', title: '7. Retention Schedule', content: `Personal data: 5 years post-relationship (tax law). Logs: 1 year. Marketing: until opt-out. Legal holds: as required.` },
      { id: 'vendor-management', title: '8. Vendor Management', content: `All subprocessors sign DPAs with Egypt-law compliant terms. Current subprocessors listed at /subprocessors.` },
      { id: 'audits', title: '9. Audits & Certifications', content: `Annual internal privacy audits. ISO 27001 aligned controls. SOC 2 Type II in progress. Penetration testing quarterly.` },
      { id: 'contact', title: '10. Contact', content: `Compliance inquiries: compliance@solout.tech. DPO: dpo@solout.tech. Sold Out Technologies, Cairo, Egypt.` },
    ],
  },
};

function LegalPage({ page }) {
  const data = legalPages[page];
  if (!data) return null;

  return (
    <div className="container py-12 lg:py-16 max-w-4xl">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm mb-6">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <header>
          <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-tertiary)]">
            <span>Version {data.version}</span>
            <span>•</span>
            <time dateTime={new Date(data.lastUpdated).toISOString().split('T')[0]}>Last updated: {data.lastUpdated}</time>
          </div>
        </header>
      </div>

      <div className="card-glass p-8 lg:p-12">
        <nav className="mb-8 p-4 bg-[var(--bg-input)] rounded-lg border border-[var(--border-subtle)]" aria-label="Table of Contents">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Table of Contents</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="prose prose-invert max-w-none">
          {data.sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-10 pb-8 last:pb-0 last:border-0 border-b border-[var(--border-subtle)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{section.title}</h2>
              <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
                {section.content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
          <Link to="/" className="inline-flex items-center gap-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LegalPage;