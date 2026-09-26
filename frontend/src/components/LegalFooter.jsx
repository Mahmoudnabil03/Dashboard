import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Shield, Scale, FileText } from "lucide-react";
export default function LegalFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6" aria-label="SocialHub Home">
              <div className="w-10 h-10 rounded-xl bg-[var(--gradient-brand)] flex items-center justify-center">
                <span className="font-bold text-white text-lg">SH</span>
              </div>
              <span className="font-bold text-xl text-[var(--text-primary)]">SocialHub</span>
            </Link>
            <p className="text-[var(--text-tertiary)] text-sm mb-6 max-w-xs">Manage. Connect. Grow. Your all-in-one social media command center.</p>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-tertiary)]">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:hello@solout.tech" className="hover:text-[var(--brand-primary)] transition-colors">hello@solout.tech</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+201000000000" className="hover:text-[var(--brand-primary)] transition-colors">+20 100 000 0000</a>
              </div>
            </div>
            <p className="text-[var(--text-tertiary)] text-xs mt-4 opacity-70">Powered by <strong className="text-[var(--text-primary)]">Sold Out Technologies</strong></p>
          </div>
          <nav aria-label="Product">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/posts" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Posts and Scheduling</Link></li>
              <li><Link to="/calendar" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Content Calendar</Link></li>
              <li><Link to="/analytics" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Analytics</Link></li>
              <li><Link to="/campaigns" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Campaigns</Link></li>
              <li><Link to="/content" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Content Ideas</Link></li>
              <li><Link to="/ai-agent" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">AI Agent</Link></li>
              <li><Link to="/accounts" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Integrations</Link></li>
            </ul>
          </nav>
          <nav aria-label="Workspace">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Workspace</h4>
            <ul className="space-y-3">
              <li><Link to="/team" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Team</Link></li>
              <li><Link to="/billing" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Billing</Link></li>
              <li><Link to="/reports" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Reports</Link></li>
              <li><Link to="/settings" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Settings</Link></li>
              <li><Link to="/inbox" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Unified Inbox</Link></li>
              <li><Link to="/comments" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Comments</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal and Compliance">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Scale size={18} className="text-[var(--brand-primary)]" />Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><FileText size={14} /> Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Shield size={14} /> Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Shield size={14} /> Cookie Policy</Link></li>
              <li><Link to="/compliance" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Scale size={14} /> Compliance (Egypt)</Link></li>
            </ul>
          </nav>
        </div>
        <div className="divider mt-12 mb-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-tertiary)] text-sm">Copyright {currentYear} SocialHub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Terms</Link>
            <Link to="/privacy" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Privacy</Link>
            <Link to="/cookies" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
