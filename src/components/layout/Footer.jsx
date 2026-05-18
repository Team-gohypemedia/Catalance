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
                  color: "border-[#1877F2]/20 hover:bg-[#1877F2]/5",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" {...props}>
                      <circle cx="12" cy="12" r="12" fill="#1877F2" />
                      <path
                        d="M15.12 12.32H13.12V21H9.58V12.32H8.11V9.29H9.58V7.33C9.58 4.76 11.04 3 13.8 3C14.73 3 15.65 3.07 15.65 3.07V6.04H14.13C12.87 6.04 12.35 6.82 12.35 7.62V9.29H15.42L15.12 12.32Z"
                        fill="white"
                      />
                    </svg>
                  ),
                },
                {
                  href: "https://www.linkedin.com/company/catalance/?viewAsMember=true",
                  label: "LinkedIn",
                  color: "border-[#0A66C2]/20 hover:bg-[#0A66C2]/5",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" {...props}>
                      <rect width="24" height="24" rx="4" fill="#0A66C2" />
                      <path
                        d="M6.12 19.5H3.18V10.14H6.12V19.5ZM4.65 8.86C3.71 8.86 2.95 8.1 2.95 7.16C2.95 6.22 3.71 5.46 4.65 5.46C5.59 5.46 6.35 6.22 6.35 7.16C6.35 8.1 5.59 8.86 4.65 8.86ZM21.05 19.5H18.11V14.89C18.11 13.79 18.09 12.38 16.58 12.38C15.05 12.38 14.81 13.58 14.81 14.81V19.5H11.87V10.14H14.7V11.42H14.74C15.13 10.67 16.1 9.88 17.54 9.88C20.55 9.88 21.11 11.86 21.11 14.44V19.5H21.05Z"
                        fill="white"
                      />
                    </svg>
                  ),
                },
                {
                  href: "https://www.instagram.com/catalance_official/",
                  label: "Instagram",
                  color: "border-[#E4405F]/20 hover:bg-[#E4405F]/5",
                  icon: (props) => (
                    <svg viewBox="0 0 24 24" {...props}>
                      <defs>
                        <linearGradient id="instagram-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#feda75" />
                          <stop offset="25%" stopColor="#fa7e1e" />
                          <stop offset="50%" stopColor="#d62976" />
                          <stop offset="75%" stopColor="#962fbf" />
                          <stop offset="100%" stopColor="#4f5bd5" />
                        </linearGradient>
                      </defs>
                      <rect width="24" height="24" rx="5" fill="url(#instagram-grad)" />
                      <path
                        d="M12 6.81C9.14 6.81 6.81 9.14 6.81 12C6.81 14.86 9.14 17.19 12 17.19C14.86 17.19 17.19 14.86 17.19 12C17.19 9.14 14.86 6.81 12 6.81ZM12 15.38C10.13 15.38 8.62 13.87 8.62 12C8.62 10.13 10.13 8.62 12 8.62C13.87 8.62 15.38 10.13 15.38 12C15.38 13.87 13.87 15.38 12 15.38ZM18.59 6.66C18.59 7.33 18.05 7.87 17.38 7.87C16.71 7.87 16.17 7.33 16.17 6.66C16.17 5.99 16.71 5.45 17.38 5.45C18.05 5.45 18.59 5.99 18.59 6.66Z"
                        fill="white"
                      />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background transition-all duration-300",
                    social.color
                  )}
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
                <Link to="/marketplace" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Browse Talent
                </Link>
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
                  className="h-12 w-full rounded-xl border border-border/60 bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
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
      {/* Large Background Text */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2 translate-y-[20%] select-none overflow-hidden pb-4">
        <span className="whitespace-nowrap text-[15vw] font-black leading-none tracking-tighter text-foreground/[0.03] sm:text-[18vw] lg:text-[22vw]">
          CATALANCE
        </span>
      </div>
    </footer>
  );
};

export default Footer;
