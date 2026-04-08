import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/shared/lib/api-client";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import logo from "@/assets/logos/logo.svg";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingNewsletter) return;

    const normalizedEmail = newsletterEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsSubmittingNewsletter(true);
    try {
      const response = await subscribeNewsletter(normalizedEmail);
      toast.success(response?.message || "Subscribed successfully.");
      setNewsletterEmail("");
    } catch (error) {
      toast.error(
        error?.message ||
          "We could not complete your subscription right now. Please try again."
      );
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  return (
    <footer className="relative w-full overflow-hidden bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.9fr] lg:gap-10">
          <div className="flex flex-col gap-7">
            <a className="flex w-fit items-center gap-2" href="#">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-primary">
                <img src={logo} alt="Catalance logo" className="h-9 w-9 object-contain" />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-primary">
                Catalance
              </span>
            </a>

            <div className="flex items-center gap-4 text-muted-foreground">
              {[
                {
                  href: "https://www.facebook.com/profile.php?id=61586800500990",
                  label: "Facebook",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
                {
                  href: "https://www.linkedin.com/company/catalance/?viewAsMember=true",
                  label: "LinkedIn",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                    </svg>
                  ),
                },
                {
                  href: "https://www.instagram.com/catalance_official/",
                  label: "Instagram",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-8">
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Platform</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/talent" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Browse Talent
                </Link>
                <Link to="/enterprise" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Enterprise Solutions
                </Link>
                <Link to="/integrations" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Integrations
                </Link>
                <Link to="/features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Features
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  About Us
                </Link>
                <Link to="/contact-us" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Contact Us
                </Link>
                <Link to="/careers" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Careers
                </Link>
                <Link to="/press" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Press
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Resources</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
                <Link to="/help" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Help Center
                </Link>
                <Link to="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Documentation
                </Link>
                <Link to="/community" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Community
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link to="/refund-policy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Refund Policy
                </Link>
                <Link to="/fees-pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Fees and Pricing
                </Link>
                <Link to="/security" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Security
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-md">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
                Stay ahead of the curve
              </h3>
            </div>

            <div className="w-full max-w-md">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleNewsletterSubmit}>
                <input
                  className="h-12 w-full rounded-2xl border border-border/60 bg-card px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
                  placeholder="name@catalance.in"
                  type="email"
                  autoComplete="email"
                  required
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  disabled={isSubmittingNewsletter}
                />
                <button
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSubmittingNewsletter}
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Catalance. All rights reserved.
            </p>

            <div className="flex items-center justify-center gap-3 rounded-full border border-border/60 bg-background px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-foreground">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
