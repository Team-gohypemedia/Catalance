/**
 * B (payments): the course page's enrol/checkout action (spec §5.1 steps 3–6, §6.2).
 * Free → "Enrol free". Paid → price + GST note, opens the checkout dialog (100% advance; consents; Razorpay / offline / demo).
 * Also shows a pending offline payment, resumes a failed one, and explains closed enrolment (full, paused, not open yet).
 * Props: { course, enrollment, onEnrolled(enrollment), className, size }. Renders nothing once enrolled.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { usePlatformConfig } from "@/lib/platform";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckoutDialog } from "./CheckoutDialog";

/** Why a course can't take new students right now (mirrors the API's 409 reasons), or null. */
export function closedReason(course) {
  const status = course.status || "PUBLISHED";
  if (status === "FULL") return { label: "Course full", hint: "This course is full. Check back for the next batch." };
  if (status === "PAUSED") return { label: "Enrolment paused", hint: "Enrolment for this course is paused right now." };
  if (status === "DRAFT" || status === "ARCHIVED") return { label: "Not available", hint: "This course is not available." };
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt) > new Date()) return { label: `Opens ${formatDate(course.enrolmentOpensAt)}`, hint: `Enrolment opens on ${formatDate(course.enrolmentOpensAt)}.` };
  if (course.enrolmentClosesAt && new Date(course.enrolmentClosesAt) < new Date()) return { label: "Enrolment closed", hint: "Enrolment for this course has closed." };
  if (course.enrolmentOpen === false) return { label: "Enrolment closed", hint: "This course is not open for enrolment right now." };
  return null;
}

export function useMyOrders(enabled = true) {
  return useQuery({ queryKey: ["my-orders"], queryFn: () => api.get("/api/me/orders"), enabled, staleTime: 15_000 });
}

export function EnrolButton({ course, enrollment, onEnrolled, className, size = "lg" }) {
  const qc = useQueryClient();
  const { isAuthed } = useAuth();
  const { pricing } = usePlatformConfig();
  const [open, setOpen] = useState(false);
  const paidCourse = (course?.priceINR || 0) > 0;
  const orders = useMyOrders(Boolean(isAuthed && paidCourse && !enrollment));

  const done = (e) => {
    qc.invalidateQueries({ queryKey: ["enrollments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    onEnrolled?.(e);
  };

  const enrol = useMutation({
    mutationFn: () => api.post(`/api/courses/${course.id}/enroll`),
    onSuccess: (e) => {
      toast.success("You're enrolled");
      done(e);
    },
    onError: (e) => {
      if (e.status === 402) return setOpen(true);
      toast.error(e.message);
    },
  });

  if (!course || enrollment) return null;
  const full = cn("w-full", className);

  if (!isAuthed) {
    return (
      <Button size={size} className={full} to={`/login?next=${encodeURIComponent(`/app/courses/${course.id}`)}`} rightIcon={ArrowRight}>
        Log in to enrol
      </Button>
    );
  }

  const latest = (orders.data || []).find((o) => o.courseId === course.id && o.status !== "CANCELLED") || null;
  const paid = latest?.status === "PAID";
  const closed = !paid && closedReason(course);

  if (closed) {
    return (
      <div className={cn("space-y-2", className)}>
        <Button size={size} className="w-full" disabled leftIcon={Lock}>
          {closed.label}
        </Button>
        <p className="text-center text-xs text-muted">{closed.hint}</p>
      </div>
    );
  }

  if (!paidCourse) {
    return (
      <Button size={size} className={full} loading={enrol.isPending} onClick={() => enrol.mutate()} rightIcon={ArrowRight}>
        Enrol free
      </Button>
    );
  }

  // paid already (e.g. offline payment verified) but no enrolment yet → the API lets them in
  if (paid) {
    return (
      <Button size={size} className={full} loading={enrol.isPending} onClick={() => enrol.mutate()} rightIcon={ArrowRight}>
        Start course
      </Button>
    );
  }

  const gst = course.gstPercent ?? pricing?.gstPercent ?? 18;
  const pending = latest?.status === "PENDING" && latest.provider === "OFFLINE";

  return (
    <div className={cn("space-y-2", className)}>
      {pending ? (
        <Button size={size} variant="outline" className="w-full" leftIcon={Clock} onClick={() => setOpen(true)}>
          {latest.offlineReference ? "Payment being checked" : "Complete payment"}
        </Button>
      ) : (
        <Button size={size} className="w-full" onClick={() => setOpen(true)} loading={orders.isLoading} rightIcon={ArrowRight}>
          Enrol · {formatINR(course.priceINR)}
        </Button>
      )}
      <p className="text-center text-xs text-muted">+ {gst}% GST · paid in full before you start</p>
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        course={course}
        existingOrder={latest}
        onEnrolled={(e) => done(e)}
      />
    </div>
  );
}

export default EnrolButton;
