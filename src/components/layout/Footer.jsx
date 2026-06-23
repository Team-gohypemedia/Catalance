import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/shared/lib/api-client";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
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
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.9fr] lg:gap-10">
          <div className="flex flex-col gap-7">
            <Link className="flex w-fit items-center gap-2" to="/">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-primary">
                <img src={logo} alt="Catalance logo" className="h-9 w-9 object-contain invert dark:invert-0" />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-primary">
                Catalance
              </span>
            </Link>

            <div className="flex items-center gap-4 text-muted-foreground">
              {[
                {
                  href: "https://www.facebook.com/profile.php?id=61586800500990",
                  label: "Facebook",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" {...props}>
                      <path
                        d="M9.101 23.69h4.837v-10.74h3.244l.477-4.185H13.938v-2.67c0-1.127.265-1.9 1.83-1.9h2.24V.5C17.624.444 16.03 0 14.28 0 10.623 0 8.007 2.23 8.007 6.31v3.454H4.898v4.185H8.01V23.69H9.1z"
                        fill="white"
                      />
                    </svg>
                  ),
                },
                {
                  href: "https://www.linkedin.com/company/catalance/?viewAsMember=true",
                  label: "LinkedIn",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" {...props}>
                      <path
                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                        fill="white"
                      />
                    </svg>
                  ),
                },
                {
                  href: "https://www.instagram.com/catalance_official/",
                  label: "Instagram",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" {...props}>
                      <path
                        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.33.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.33 0 8.74 0 12s.014 3.67.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.257 0 3.666-.014 4.947-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.257-.014-3.67-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.666.014 15.257 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
                        fill="white"
                      />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  className="keep-orange-social flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300"
                  style={{
                    backgroundColor: "#e56a28",
                    borderColor: "#e56a28",
                    color: "#ffffff",
                  }}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-5 w-5 footer-social-icon" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-8">
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Platform</h3>
              <nav className="flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => toast.info("Coming soon!")}
                  className="text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse Talent
                </button>
              </nav>
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  About Us
                </Link>
                <Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Contact
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-foreground">Resources</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Blog
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

        <div className="mt-10 pt-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-md">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
                Stay ahead of the curve
              </h3>
            </div>

            <div className="w-full max-w-md">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleNewsletterSubmit}>
                <input
                  className="h-12 w-full rounded-xl border border-border/60 bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
                  placeholder="name@catalance.in"
                  type="email"
                  autoComplete="email"
                  required
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  disabled={isSubmittingNewsletter}
                />
                <Button
                  size="lg"
                  className="h-12 rounded-xl px-6"
                  type="submit"
                  disabled={isSubmittingNewsletter}
                  aria-label="Subscribe to newsletter"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-center">
            <p className="text-sm text-muted-foreground text-center">
              &copy; {currentYear} Catalance. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      {/* Large Background Text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden pb-4 opacity-[0.025] dark:opacity-[0.015]">
        <span className="block whitespace-nowrap text-center text-[12vw] font-black leading-none tracking-tighter text-foreground sm:text-[16vw] lg:text-[20vw]">
          Catalance
        </span>
      </div>
    </footer>
  );
};

export default Footer;
