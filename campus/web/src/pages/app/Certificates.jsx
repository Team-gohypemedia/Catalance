import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Award, Copy, ExternalLink, Printer } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { LogoMark } from "@/components/brand/Logo";

/** Quiet seal: hairline rings with ring text and a small star, in the brand colour. */
function Seal({ className, id }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <path id={`seal-ring-${id}`} d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="var(--primary)" strokeWidth="1" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="0.6" opacity="0.6" />
      <circle cx="60" cy="60" r="32" fill="none" stroke="var(--primary)" strokeWidth="0.6" opacity="0.6" />
      <text fontSize="8" fontWeight="500" letterSpacing="3" fill="var(--primary)" fontFamily="Inter, sans-serif">
        <textPath href={`#seal-ring-${id}`}>CATALANCE CAMPUS · COURSE COMPLETION ·</textPath>
      </text>
      <path d="m60 47 3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L60 65.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z" fill="var(--primary)" />
    </svg>
  );
}

function CertificateCard({ cert, userName, onPrint, printing }) {
  const url = `${window.location.origin}/verify/${cert.verifyCode}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Verify link copied. Paste it on LinkedIn or your resume.");
    } catch {
      toast.error("Couldn't copy. Link: " + url);
    }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={cn(printing && "cert-print-target")}>
      <div className="cert-sheet rounded-2xl border border-line bg-surface p-2 shadow-sm sm:p-3">
        <div className="relative rounded-xl border border-line px-6 py-10 text-center sm:px-12 sm:py-14">
          <div className="flex items-center justify-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="text-sm font-medium tracking-tight">Catalance Campus</span>
          </div>
          <p className="eyebrow mt-8">Certificate of completion</p>
          <p className="mt-8 text-sm text-muted">This certifies that</p>
          <p className="mt-3 font-serif text-4xl leading-tight break-words text-fg sm:text-5xl">{userName}</p>
          <div className="mx-auto mt-5 h-px w-16 bg-line-strong" />
          <p className="mt-5 text-sm text-muted">has successfully completed</p>
          <p className="mx-auto mt-2 max-w-md text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl">{cert.courseTitle}</p>
          <p className="mt-2 text-sm text-muted">
            {cert.trackTitle}
            {cert.score != null ? ` · assessment score ${cert.score}/100` : ""}
          </p>

          <div className="mt-12 grid grid-cols-1 items-end gap-6 sm:grid-cols-3">
            <div className="sm:text-left">
              <p className="font-serif text-xl leading-none italic">{cert.mentorName}</p>
              <div className="mx-auto mt-2 h-px w-32 bg-line-strong sm:mx-0" />
              <p className="mt-1.5 text-xs text-muted">Mentor</p>
            </div>
            <Seal id={cert.id} className="mx-auto size-20 sm:size-24" />
            <div className="sm:text-right">
              <p className="text-sm">{formatDate(cert.issuedAt)}</p>
              <p className="mt-1 font-mono text-xs text-muted">{cert.verifyCode}</p>
              <p className="mt-1.5 text-xs text-subtle">Issued · verify code</p>
            </div>
          </div>
        </div>
      </div>
      <div className="cert-actions mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
        <Button size="sm" variant="outline" leftIcon={Copy} onClick={copy}>Copy verify link</Button>
        <Button size="sm" variant="ghost" leftIcon={ExternalLink} href={`/verify/${cert.verifyCode}`} target="_blank" rel="noreferrer">Open</Button>
        <Button size="sm" variant="ghost" leftIcon={Printer} onClick={onPrint}>Print or save PDF</Button>
      </div>
    </motion.div>
  );
}

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 12mm; }
  body * { visibility: hidden !important; }
  .cert-print-target, .cert-print-target * { visibility: visible !important; }
  .cert-print-target { --fg: #1c1b1f; --muted: #5f5c66; --subtle: #8e8a94; --surface: #fff; --surface-2: #f4efe7; --line: #ece6dc; --line-strong: #ddd5c8; --primary: #d9692a; color: #1c1b1f; position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; transform: none !important; opacity: 1 !important; }
  .cert-print-target > * { width: 100%; }
  .cert-print-target .cert-sheet { width: 100%; box-shadow: none !important; background: #fff !important; color: #1c1b1f !important; }
  .cert-print-target .cert-actions { display: none !important; }
}
`;

export default function Certificates() {
  const { user } = useAuth();
  const [printId, setPrintId] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["certificates"], queryFn: () => api.get("/api/me/certificates") });

  const print = (id) => {
    setPrintId(id);
    // let React apply the print-target class before opening the dialog
    setTimeout(() => {
      window.print();
      setPrintId(null);
    }, 50);
  };

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <PageHeader
        eyebrow="Completion"
        title="Course certificates"
        description="A course certificate shows you finished a course. It is not a skill verification: for that, pass the course's assessment."
        actions={<Button to="/app/skills" variant="brandOutline">My skills</Button>}
      />
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted">
          <span className="font-medium text-fg">Certificate</span> = lessons finished. <span className="font-medium text-fg">Skill badge</span> = practical assessment passed and approved. Only badges count for project opportunities.
        </p>
        <Button to="/app/assessments" size="sm" variant="outline" className="shrink-0">Assessments</Button>
      </div>
      {isLoading ? (
        <div className="grid gap-10 xl:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[28rem] rounded-2xl" />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={Award} title="No certificates yet" description="Finish every lesson in a course to get its course certificate." action={<Button to="/app/learn">Continue learning</Button>} />
      ) : (
        <div className="grid gap-10 xl:grid-cols-2">
          {data.map((c) => <CertificateCard key={c.id} cert={c} userName={user?.name} printing={printId === c.id} onPrint={() => print(c.id)} />)}
        </div>
      )}
    </div>
  );
}
