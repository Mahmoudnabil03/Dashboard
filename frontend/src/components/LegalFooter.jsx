import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Shield, Scale, FileText, Github, Twitter, Linkedin } from 'lucide-react';

export default function LegalFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6" aria-label="SocialHub Home">
              <div className="w-10 h-10 rounded-xl bg-[var(--gradient-brand)] flex items-center justify-center">
                <span className="font-bold text-white text-lg">SH</span>
              </div>
              <span className="font-bold text-xl text-[var(--text-primary)]">SocialHub</span>
            </Link>
            <p className="text-[var(--text-tertiary)] text-sm mb-6 max-w-xs">
              Manage. Connect. Grow. Your all-in-one social media command center.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-tertiary)]">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:hello@solout.tech" className="hover:text-[var(--brand-primary)] transition-colors">hello@solout.tech</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+20 100 000 0000</span>
              </div>
            </div>
            <p className="text-[var(--text-tertiary)] text-xs mt-4 opacity-70">
              Powered by <strong className="text-[var(--text-primary)]">Sold Out Technologies</strong>
            </p>
          </div>

          {/* Product Links */}
          <nav aria-label="Product">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/posts" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Posts & Scheduling</Link></li>
              <li><Link to="/calendar" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Content Calendar</Link></li>
              <li><Link to="/analytics" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Analytics</Link></li>
              <li><Link to="/campaigns" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Campaigns</Link></li>
              <li><Link to="/content" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Content Ideas</Link></li>
              <li><Link to="/ai-agent" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">AI Agent</Link></li>
              <li><Link to="/accounts" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Integrations</Link></li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">About Us</Link></li>
              <li><Link to="/careers" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Careers</Link></li>
              <li><Link to="/blog" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Blog</Link></li>
              <li><Link to="/press" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Press Kit</Link></li>
              <li><Link to="/partners" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Partners</Link></li>
              <li><Link to="/contact" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Contact</Link></li>
            </ul>
          </nav>

          {/* Legal & Compliance */}
          <nav aria-label="Legal & Compliance">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Scale size={18} className="text-[var(--brand-primary)]" />
              Legal & Compliance
            </h4>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><FileText size={14} /> Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Shield size={14} /> Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Shield size={14} /> Cookie Policy</Link></li>
              <li><Link to="/dpa" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><FileText size={14} /> Data Processing Addendum</Link></li>
              <li><Link to="/security" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Shield size={14} /> Security</Link></li>
              <li><Link to="/compliance" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><Scale size={14} /> Compliance (Egypt)</Link></li>
              <li><Link to="/subprocessors" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors text-sm flex items-center gap-2"><FileText size={14} /> Subprocessors</Link></li>
            </ul>
          </nav>
        </div>

        <div className="divider mt-12 mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-tertiary)] text-sm">
            © {currentYear} SocialHub. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Terms</Link>
            <Link to="/privacy" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Privacy</Link>
            <Link to="/cookies" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors text-sm">Cookies</Link>
            
            <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-4">
              <a href="https://github.com/SoldOutTech" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="https://twitter.com/SoldOutTech" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com/company/soldout-tech" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}