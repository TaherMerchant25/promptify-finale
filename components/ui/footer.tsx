import React from "react";
import { Linkedin, Instagram } from "lucide-react";
import { PromptifyLogo } from "./promptify-logo";

interface FooterProps {
  logo: React.ReactNode;
  brandName: string;
  socialLinks: Array<{
    icon: React.ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks?: string[];
  legalLinks?: string[];
  copyright: {
    text: string;
    license?: string;
  };
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="pb-6 pt-12 lg:pb-8 lg:pt-16 bg-[#030303] border-t border-white/[0.08]">
      <div className="px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-x-3">
            {logo}
            <span className="font-bold text-xl text-white">{brandName}</span>
          </div>

          {/* Social Links */}
          <ul className="flex list-none space-x-3">
            {socialLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/60 hover:bg-white/[0.1] hover:text-white transition-all"
                >
                  {link.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation Links (non-clickable) and Copyright */}
        <div className="mt-8 pt-6 border-t border-white/[0.05] flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Copyright - Left */}
          <div className="text-sm text-white/40 order-2 md:order-1">
            <div>{copyright.text}</div>
            {copyright.license && <div className="mt-1">{copyright.license}</div>}
          </div>

          {/* Links - Right */}
          {(mainLinks || legalLinks) && (
            <div className="order-1 md:order-2 text-right">
              {mainLinks && mainLinks.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-start md:justify-end mb-2">
                  {mainLinks.map((label, i) => (
                    <span key={i} className="text-sm text-white/50">
                      {label}
                    </span>
                  ))}
                </div>
              )}
              {legalLinks && legalLinks.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-start md:justify-end">
                  {legalLinks.map((label, i) => (
                    <span key={i} className="text-sm text-white/30">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// Pre-configured AIMS DTU Footer
export function AIMSFooter() {
  return (
    <Footer
      logo={<PromptifyLogo size={40} />}
      brandName="Promptify"
      socialLinks={[
        {
          icon: <Linkedin className="h-5 w-5" />,
          href: "https://www.linkedin.com/company/aims-dtu/",
          label: "AIMS DTU LinkedIn",
        },
        {
          icon: <Instagram className="h-5 w-5" />,
          href: "https://www.instagram.com/aimsdtu/",
          label: "AIMS DTU Instagram",
        },
      ]}
      mainLinks={["Products", "About", "Blog", "Contact"]}
      legalLinks={["Privacy", "Terms"]}
      copyright={{
        text: "© 2024 AIMS DTU",
        license: "All rights reserved",
      }}
    />
  );
}
