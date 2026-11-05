import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, ExternalLink, Flame, GraduationCap, Mail, MapPin, ShieldCheck, UserCheck, UserCog, Users } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { formatDate, formatINR, formatNumber, LANGUAGES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge } from "@/components/ui/campus";
import { DataTable } from "@/components/admin/DataTable";
import { AdminHeader, ConfirmDialog, Drawer, KV, LADDER_STAGES, SectionLabel, StagePill, Status, Tag } from "@/components/admin/kit";

const GOALS = { FIRST_INCOME: "First income", JOB: "Get a job", FREELANCE_CAREER: "Freelance career", SKILL_UP: "Skill up" };

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function StudentDrawer({ student, onClose }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null); // { patch, title, description, label }
  const patch = useMutation({
    mutationFn: (body) => api.patch(`/api/admin/users/${student.id}`, body),
    onSuccess: (u, body) => {
      qc.invalidateQueries({ queryKey: ["admin", "students"] });
      qc.invalidateQueries({ queryKey: ["admin", "mentors"] });
      toast.success(body.role ? `${u.name} is now ${body.role.toLowerCase()}` : body.status === "SUSPENDED" ? `${u.name} suspended` : `${u.name} is active again`);
      setConfirm(null);
      if (body.role) onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const suspended = student.status === "SUSPENDED";
  const lang = LANGUAGES.find((l) => l.code === student.language)?.label;

  return (
    <>
      <Drawer
        open
        onOpenChange={(o) => !o && onClose()}
        size="lg"
        title={student.name}
        description={`@${student.username} · joined ${formatDate(student.createdAt)}`}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            {suspended ? (
              <Button variant="primary" leftIcon={UserCheck} loading={patch.isPending} onClick={() => patch.mutate({ status: "ACTIVE" })}>
                Reactivate
              </Button>
            ) : (
              <Button
                variant="ghost"
                leftIcon={Ban}
                className="text-danger hover:bg-danger-soft"
                onClick={() =>
                  setConfirm({
                    body: { status: "SUSPENDED" },
                    title: `Suspend ${student.name}?`,
                    description: "They won't be able to apply to gigs or post in the community until you reactivate them.",
                    label: "Suspend",
                  })
                }
              >
                Suspend
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon={GraduationCap}
              onClick={() =>
                setConfirm({
                  body: { role: "MENTOR" },
                  title: `Make ${student.name} a mentor?`,
                  description: "They get a mentor profile, the Mentor studio and can review assignments. They'll leave the student list.",
                  label: "Make mentor",
                  tone: "primary",
                })
              }
            >
              Make mentor
            </Button>
            {/* Spec v1.0 §3 staff roles: each opens only its own pages in the staff console */}
            {[
              { role: "EVALUATOR", noun: "an evaluator", label: "Make evaluator", description: "They review and score assessments in the evaluation queue. They'll leave the student list." },
              { role: "PROJECT_MANAGER", noun: "a project manager", label: "Make PM", description: "They search verified talent and send and manage project offers. They'll leave the student list." },
              { role: "FINANCE", noun: "a finance user", label: "Make finance", description: "They verify offline payments, record refunds and manage project payouts. They'll leave the student list." },
            ].map((r) => (
              <Button
                key={r.role}
                variant="outline"
                leftIcon={UserCog}
                onClick={() => setConfirm({ body: { role: r.role }, title: `Make ${student.name} ${r.noun}?`, description: r.description, label: r.label, tone: "primary" })}
              >
                {r.label}
              </Button>
            ))}
            <Button
              variant="outline"
              leftIcon={ShieldCheck}
              onClick={() =>
                setConfirm({
                  body: { role: "ADMIN" },
                  title: `Give ${student.name} admin access?`,
                  description: "Admins can edit courses, pay out gigs and change anyone's role. Only do this for the Campus team.",
                  label: "Make admin",
                })
              }
            >
              Make admin
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} src={student.avatarUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DivisionBadge division={student.division} size="sm" />
                {suspended ? <Status tone="danger">Suspended</Status> : <Status tone="success">Active</Status>}
              </div>
              {student.headline && <p className="mt-1.5 text-sm text-muted">{student.headline}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {[
              ["Season pts", formatNumber(student.seasonPoints)],
              ["Earned", formatINR(student.lifetimeEarnedINR)],
              ["Streak", `${student.streak || 0}d`],
            ].map(([l, v]) => (
              <div key={l} className="bg-surface px-3 py-3">
                <p className="text-xs text-muted">{l}</p>
                <p className="mt-1 text-base font-medium text-fg tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line px-4 py-1">
            <KV label="Email">
              <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                <Mail className="size-3.5" /> {student.email}
              </a>
            </KV>
            <KV label="College">{student.college?.name || "—"}</KV>
            <KV label="Course / year">{[student.stream, student.year && `Year ${student.year}`].filter(Boolean).join(" · ") || "—"}</KV>
            <KV label="City">
              {student.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {student.city}
                  {student.state ? `, ${student.state}` : ""}
                </span>
              ) : (
                "—"
              )}
            </KV>
            <KV label="Ladder">
              <StagePill stage={student.ladderStage} />
            </KV>
            <KV label="Goal">{GOALS[student.goal] || "—"}</KV>
            <KV label="Language">{lang || "—"}</KV>
            <KV label="Wallet">{formatINR(student.walletBalanceINR)}</KV>
            <KV label="Lifetime points">{formatNumber(student.lifetimePoints)}</KV>
            <KV label="Longest streak">
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3.5 text-muted" /> {student.longestStreak || 0} days
              </span>
            </KV>
          </div>

          {student.skills?.length > 0 && (
            <div>
              <SectionLabel>Skills</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {student.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full" to={`/u/${student.username}`} target="_blank" rightIcon={ExternalLink}>
            Open Skill Passport
          </Button>
        </div>
      </Drawer>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.label}
        tone={confirm?.tone || "danger"}
        loading={patch.isPending}
        onConfirm={() => patch.mutate(confirm.body)}
      />
    </>
  );
}

export default function Students() {
  const [q, setQ] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [stage, setStage] = useState("");
  const [openId, setOpenId] = useState(null);
  const dq = useDebounced(q);
  const filters = { q: dq, collegeId, stage };

  const students = useQuery({ queryKey: ["admin", "students", filters], queryFn: () => api.get(`/api/admin/students${qs(filters)}`), placeholderData: keepPreviousData });
  const colleges = useQuery({ queryKey: ["admin", "colleges", ""], queryFn: () => api.get("/api/admin/colleges") });
  const selected = (students.data || []).find((s) => s.id === openId);

  const columns = [
    {
      id: "name",
      header: "Student",
      sortValue: (s) => s.name,
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={s.name} src={s.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium">
              {s.name}
              {s.status === "SUSPENDED" && <Status tone="danger">Suspended</Status>}
            </p>
            <p className="truncate text-xs text-muted">{s.email}</p>
          </div>
        </div>
      ),
    },
    { id: "college", header: "College", sortValue: (s) => s.college?.shortName || "", cell: (s) => <span className="truncate whitespace-nowrap text-fg/90" title={s.college?.name}>{s.college?.shortName || "—"}{s.college?.city ? <span className="text-subtle"> · {s.college.city}</span> : null}</span> },
    { id: "stage", header: "Stage", sortValue: (s) => s.ladderStage, cell: (s) => <StagePill stage={s.ladderStage} /> },
    { id: "division", header: "Division", sortValue: (s) => s.seasonPoints, cell: (s) => <DivisionBadge division={s.division} size="sm" /> },
    { id: "points", header: "Points", align: "right", sortValue: (s) => s.seasonPoints, cell: (s) => <span className="tabular-nums">{formatNumber(s.seasonPoints)}</span> },
    { id: "earned", header: "Earned", align: "right", sortValue: (s) => s.lifetimeEarnedINR, cell: (s) => <span className="tabular-nums">{formatINR(s.lifetimeEarnedINR)}</span> },
    { id: "joined", header: "Joined", align: "right", sortValue: (s) => s.createdAt, cell: (s) => <span className="text-xs whitespace-nowrap text-muted">{formatDate(s.createdAt, { day: "numeric", month: "short", year: "2-digit" })}</span> },
  ];

  return (
    <>
      <AdminHeader
        title="Students"
        description={students.data ? `${formatNumber(students.data.length)} students match your filters.` : "Everyone learning, earning and ranking on Campus."}
      />
      <DataTable
        data={students.data}
        loading={students.isLoading}
        error={students.error}
        onRetry={students.refetch}
        columns={columns}
        initialSort={{ id: "points", desc: true }}
        pageSize={15}
        onRowClick={(s) => setOpenId(s.id)}
        search={{ placeholder: "Name, email, college, city…", value: q, onChange: setQ }}
        toolbar={
          <>
            <Select aria-label="Filter by college" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="h-9 w-full rounded-lg sm:w-56">
              <option value="">All colleges</option>
              {(colleges.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName} · {c.city}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by ladder stage" value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 w-full rounded-lg sm:w-40">
              <option value="">All stages</option>
              {Object.entries(LADDER_STAGES).map(([n, l]) => (
                <option key={n} value={n}>
                  {n} · {l}
                </option>
              ))}
            </Select>
          </>
        }
        empty={{ icon: Users, title: "No students match", description: "Try clearing the college or stage filter." }}
      />
      {selected && <StudentDrawer key={selected.id} student={selected} onClose={() => setOpenId(null)} />}
    </>
  );
}
