import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Users from "lucide-react/dist/esm/icons/users";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Lock from "lucide-react/dist/esm/icons/lock";
import Globe from "lucide-react/dist/esm/icons/globe";
import Lightbulb from "lucide-react/dist/esm/icons/lightbulb";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { useAuth } from "@/shared/context/AuthContext";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const sumMilestones = (rows) =>
  rows.reduce((sum, row) => sum + Number(row.percentage || 0), 0);

const fetchUsers = async (authFetch, role) => {
  const response = await authFetch(`/users?role=${role}&status=ACTIVE`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to load ${role}`);
  }
  return Array.isArray(payload?.data) ? payload.data : [];
};

const ProjectSetupPage = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);
  const preselectedFreelancerId = String(searchParams.get("freelancerId") || "").trim();

  const [step1, setStep1] = useState({
    projectName: "",
    clientId: "",
    category: "",
    description: "",
    visibility: "private",
  });
  const [step2, setStep2] = useState({
    totalBudget: "",
    timeline: "",
    milestones: [
      { key: "kickoff", label: "Kickoff", percentage: 20 },
      { key: "architecture", label: "Architecture / Prototype", percentage: 20 },
      { key: "implementation", label: "Implementation", percentage: 40 },
      { key: "testing", label: "Testing / UAT", percentage: 20 },
    ],
  });
  const [step3, setStep3] = useState({
    assignPmId: user?.id || "",
    freelancerId: "",
    shortlistTalentIds: "",
    meetingPreferences: "",
    communicationSetup: "",
  });

  const clients = useAsyncResource(() => fetchUsers(authFetch, "CLIENT"), [authFetch]);
  const pms = useAsyncResource(() => fetchUsers(authFetch, "PROJECT_MANAGER"), [authFetch]);
  const freelancers = useAsyncResource(() => fetchUsers(authFetch, "FREELANCER"), [authFetch]);

  useEffect(() => {
    if (!preselectedFreelancerId) return;
    const rows = Array.isArray(freelancers.data) ? freelancers.data : [];
    const hasFreelancer = rows.some(
      (entry) => String(entry?.id || "") === preselectedFreelancerId
    );
    if (!hasFreelancer) return;

    setStep3((prev) =>
      prev.freelancerId === preselectedFreelancerId
        ? prev
        : { ...prev, freelancerId: preselectedFreelancerId }
    );
    setStep((current) => (current < 2 ? 2 : current));
  }, [freelancers.data, preselectedFreelancerId]);

  const milestoneTotal = useMemo(() => sumMilestones(step2.milestones), [step2.milestones]);
  const progress = Math.round(((step + 1) / 4) * 100);

  const canGoNext = () => {
    if (step === 0) return Boolean(step1.projectName && step1.clientId && step1.description);
    if (step === 1) return Number(step2.totalBudget || 0) > 0 && milestoneTotal === 100;
    return true;
  };

  const steps = [
    { title: "DETAILS", icon: FileText },
    { title: "TEAM", icon: Users },
    { title: "BUDGET", icon: CreditCard },
    { title: "REVIEW", icon: CheckCircle2 },
  ];

  if (result) {
    return (
      <PmShell title="Project Published" subtitle="Your new project is live.">
        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden">
          <CardContent className="space-y-6 p-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Project Successfully Created</h2>
                <p className="text-slate-500 font-medium">Project ID: <span className="text-slate-900 font-bold">#{result.projectId}</span></p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button className="h-14 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20" onClick={() => navigate("/project-manager/projects")}>
                View Project Dashboard
              </Button>
              <Button variant="outline" className="h-14 rounded-2xl border-slate-200 px-8 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={() => navigate("/project-manager/marketplace")}>
                Find Freelancers
              </Button>
            </div>
          </CardContent>
        </Card>
      </PmShell>
    );
  }

  return (
    <PmShell 
      title="Project Configuration" 
      subtitle="Define objectives, budget, and team alignment for this operation."
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* Progress Steper Card */}
        <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Step {step + 1} of 4</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-100 rounded-full indicator-blue-600" />
            
            <div className="relative flex justify-between">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 -z-10" />
                {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = step === idx;
                    const isCompleted = step > idx;
                    return (
                        <div key={idx} className="flex flex-col items-center gap-3 bg-white px-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30 text-white' : isCompleted ? 'bg-white border-blue-100 text-blue-400' : 'bg-white border-slate-100 text-slate-300'}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{s.title}</span>
                        </div>
                    );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {step === 0 && (
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Project Details</h1>
                    <p className="text-slate-400 font-medium">Fill in the basic information to kick off your new project workspace.</p>
                </div>
                <CardContent className="p-10 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label>
                        <div className="relative">
                            <Input 
                                placeholder="eg. Q3 Digital Transformation Campaign" 
                                value={step1.projectName} 
                                onChange={(e) => setStep1(p => ({...p, projectName: e.target.value}))}
                                className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 text-base font-bold text-slate-900 focus-visible:ring-blue-600/20 focus-visible:border-blue-600/50"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><FileText className="h-6 w-6" /></div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Organization</label>
                            <Select value={step1.clientId} onValueChange={(v) => setStep1(p => ({...p, clientId: v}))}>
                                <SelectTrigger className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-900">
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    {(clients.data || []).map(c => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Category</label>
                            <Select value={step1.category} onValueChange={(v) => setStep1(p => ({...p, category: v}))}>
                                <SelectTrigger className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-900">
                                    <SelectValue placeholder="Choose category" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    <SelectItem value="web">Web Development</SelectItem>
                                    <SelectItem value="mobile">Mobile App</SelectItem>
                                    <SelectItem value="design">UI/UX Design</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Brief & Description</label>
                        <Textarea 
                            placeholder="Describe the project goals, scope, and key deliverables..." 
                            value={step1.description} 
                            onChange={(e) => setStep1(p => ({...p, description: e.target.value}))}
                            className="min-h-[160px] rounded-[2rem] border-slate-100 bg-slate-50/50 p-6 text-base font-medium text-slate-900 focus-visible:ring-blue-600/20 focus-visible:border-blue-600/50"
                        />
                        <div className="flex items-center gap-2 opacity-40 px-2 mt-2">
                            <div className="h-1 w-1 rounded-full bg-slate-900" />
                            <span className="text-[10px] font-bold">Markdown formatting is supported</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Visibility</label>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div 
                                onClick={() => setStep1(p => ({...p, visibility: 'private'}))}
                                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-6 ${step1.visibility === 'private' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                            >
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${step1.visibility === 'private' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {step1.visibility === 'private' && <div className="h-3 w-3 rounded-full bg-blue-600" />}
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-black text-slate-900">Private</span>
                                    <span className="block text-xs font-medium text-slate-400">Only invited members can see</span>
                                </div>
                                <Lock className={`h-6 w-6 opacity-30 ${step1.visibility === 'private' ? 'text-blue-600' : ''}`} />
                            </div>
                            <div 
                                onClick={() => setStep1(p => ({...p, visibility: 'public'}))}
                                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-6 ${step1.visibility === 'public' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                            >
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${step1.visibility === 'public' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {step1.visibility === 'public' && <div className="h-3 w-3 rounded-full bg-blue-600" />}
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-black text-slate-900">Team Public</span>
                                    <span className="block text-xs font-medium text-slate-400">Visible to entire organization</span>
                                </div>
                                <Globe className={`h-6 w-6 opacity-30 ${step1.visibility === 'public' ? 'text-blue-600' : ''}`} />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="ghost" className="text-sm font-black text-slate-400 hover:text-slate-900">Cancel</Button>
                    <Button 
                        disabled={!canGoNext()}
                        onClick={() => setStep(1)}
                        className="h-14 rounded-2xl bg-blue-600 px-10 text-sm font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all group"
                    >
                        Save & Continue <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </Card>

            <Card className="rounded-3xl border-slate-100 bg-blue-50/50 border-none">
                <CardContent className="p-10 flex items-start gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-blue-600 mb-1">Pro Tip: Defining Project Scope</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            Clear project names and detailed briefs help freelancers understand your requirements faster, leading to better match quality and more accurate proposals.
                        </p>
                    </div>
                </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Define Milestones & Budget</h1>
                    <p className="text-slate-400 font-medium">Set up your project phases and financial structure to ensure transparency.</p>
                </div>
                
                <CardContent className="p-10 space-y-12">
                    {/* Budget & Timeline Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Project Budget & Timeline</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Project Budget (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <Input 
                                        type="number" 
                                        placeholder="5,000" 
                                        value={step2.totalBudget}
                                        onChange={(e) => setStep2(p => ({...p, totalBudget: e.target.value}))}
                                        className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 pl-10 pr-6 text-base font-bold text-slate-900 focus-visible:ring-blue-600/20 focus-visible:border-blue-600/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Timeline (Months)</label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        placeholder="6" 
                                        value={step2.timeline}
                                        onChange={(e) => setStep2(p => ({...p, timeline: e.target.value}))}
                                        className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 text-base font-bold text-slate-900 focus-visible:ring-blue-600/20 focus-visible:border-blue-600/50"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Months</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Milestones Section */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                    <Users className="h-4 w-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Payment Milestones</h3>
                            </div>
                            <Button variant="link" className="text-xs font-black text-blue-600 hover:no-underline">+ Add Custom Phase</Button>
                        </div>

                        <div className="space-y-4">
                            {step2.milestones.map((m, idx) => (
                                <div key={m.key} className={`p-8 rounded-3xl border-2 transition-all group ${m.percentage > 0 ? 'border-blue-100 bg-blue-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-base font-black text-slate-900">Phase {idx + 1}: {m.label}</h4>
                                            <p className="text-xs font-medium text-slate-400">Initial planning and requirements gathering.</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout</span>
                                            <div className="relative w-24">
                                                <Input 
                                                    type="number" 
                                                    value={m.percentage}
                                                    onChange={(e) => setStep2(prev => ({
                                                        ...prev,
                                                        milestones: prev.milestones.map((row, i) => i === idx ? {...row, percentage: Number(e.target.value)} : row)
                                                    }))}
                                                    className="h-12 rounded-xl border-slate-100 bg-white px-4 text-center font-bold text-slate-900"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`p-4 rounded-2xl flex items-center gap-3 transition-colors ${milestoneTotal === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <CheckCircle2 className={`h-4 w-4 ${milestoneTotal === 100 ? 'opacity-100' : 'opacity-20'}`} />
                            <span className="text-xs font-black uppercase tracking-wider">
                                {milestoneTotal === 100 ? 'Total payout equals 100% of the project budget.' : `Milestone total: ${milestoneTotal}% (must be 100%)`}
                            </span>
                        </div>
                    </div>
                </CardContent>

                <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="ghost" className="text-sm font-black text-slate-400 hover:text-slate-900" onClick={() => setStep(0)}>Back to Step 1</Button>
                    <div className="flex gap-4">
                        <Button variant="outline" className="h-14 rounded-2xl border-slate-200 bg-white px-8 text-sm font-black text-slate-600">Save Draft</Button>
                        <Button 
                            disabled={!canGoNext()}
                            onClick={() => setStep(2)}
                            className="h-14 rounded-2xl bg-blue-600 px-10 text-sm font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all"
                        >
                            Next Step
                        </Button>
                    </div>
                </div>
              </Card>

              <p className="text-center text-[10px] font-bold text-slate-400 pb-10">
                Catalance Project Management Suite © 2024. All milestones are subject to smart contract escrow terms.
              </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Team Alignment</h1>
                    <p className="text-slate-400 font-medium">Assign managers and specialists to ensure project success.</p>
                </div>
                
                <CardContent className="p-10 space-y-10">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Project Manager</label>
                            <Select value={step3.assignPmId} onValueChange={(v) => setStep3(p => ({...p, assignPmId: v}))}>
                                <SelectTrigger className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-900">
                                    <SelectValue placeholder="Select PM" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    {(pms.data || []).map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Specialist</label>
                            <Select value={step3.freelancerId} onValueChange={(v) => setStep3(p => ({...p, freelancerId: v}))}>
                                <SelectTrigger className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-900">
                                    <SelectValue placeholder="Assign freelancer" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    {(freelancers.data || []).map(f => <SelectItem key={f.id} value={f.id}>{f.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shortlist Talent IDs</label>
                        <Input 
                            placeholder="Enter specialist IDs (comma separated)" 
                            value={step3.shortlistTalentIds}
                            onChange={(e) => setStep3(p => ({...p, shortlistTalentIds: e.target.value}))}
                            className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-900"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting & Communication</label>
                        <Textarea 
                            placeholder="Preferences for weekly syncs, Slack channels, or timezone requirements..." 
                            value={step3.communicationSetup}
                            onChange={(e) => setStep3(p => ({...p, communicationSetup: e.target.value}))}
                            className="min-h-[120px] rounded-[2rem] border-slate-100 bg-slate-50/50 p-6 font-medium text-slate-900"
                        />
                    </div>
                </CardContent>

                <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <Button variant="ghost" className="text-sm font-black text-slate-400 hover:text-slate-900" onClick={() => setStep(1)}>Back to Step 2</Button>
                    <Button 
                        onClick={() => setStep(3)}
                        className="h-14 rounded-2xl bg-blue-600 px-10 text-sm font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                    >
                        Review Selection
                    </Button>
                </div>
              </Card>
          </div>
        )}

        {step === 3 && (
            <div className="space-y-6">
                <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl overflow-hidden">
                    <div className="p-10 border-b border-slate-100">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Review & Publish</h1>
                        <p className="text-slate-400 font-medium">Verify all details before launching your project.</p>
                    </div>

                    <CardContent className="p-10 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-[2rem] bg-slate-50/50 space-y-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Identity</span>
                                <h4 className="text-xl font-bold text-slate-900">{step1.projectName || 'Untitled Project'}</h4>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500 font-medium">Organization: <span className="text-slate-900">{step1.clientId || 'N/A'}</span></p>
                                    <p className="text-sm text-slate-500 font-medium">Category: <span className="text-slate-900 uppercase tracking-tighter">{step1.category || 'N/A'}</span></p>
                                </div>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-slate-50/50 space-y-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</span>
                                <h4 className="text-xl font-bold text-slate-900">${step2.totalBudget || '0'} Total</h4>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500 font-medium">Timeline: <span className="text-slate-900">{step2.timeline || '0'} Months</span></p>
                                    <p className="text-sm text-slate-500 font-medium">Milestones: <span className="text-slate-900">{step2.milestones.length} Phases</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] border-2 border-dashed border-slate-100 space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Assignment</span>
                            <div className="flex items-center gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-400">Assigned PM ID</p>
                                    <p className="text-sm font-bold text-slate-900">#{step3.assignPmId || 'Not Assigned'}</p>
                                </div>
                                <div className="h-4 w-[1px] bg-slate-100" />
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-400">Assigned Professional ID</p>
                                    <p className="text-sm font-bold text-slate-900">#{step3.freelancerId || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <Button variant="ghost" className="text-sm font-black text-slate-400 hover:text-slate-900" onClick={() => setStep(2)}>Back to Team</Button>
                        <Button 
                            onClick={async () => {
                                setPublishing(true);
                                try {
                                    const payload = {
                                        step1,
                                        step2: { ...step2, totalBudget: Number(step2.totalBudget || 0) },
                                        step3: {
                                            ...step3,
                                            shortlistTalentIds: step3.shortlistTalentIds.split(",").map(id => id.trim()).filter(Boolean)
                                        }
                                    };
                                    const created = await pmApi.createProjectSetup(authFetch, payload);
                                    setResult(created);
                                    toast.success("Project published successfully!");
                                } catch (e) {
                                    toast.error(e.message || "Failed to publish project");
                                } finally {
                                    setPublishing(false);
                                }
                            }}
                            disabled={publishing}
                            className="h-16 rounded-2xl bg-blue-600 px-12 text-base font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                        >
                            {publishing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publish Workspace"}
                        </Button>
                    </div>
                </Card>
            </div>
        )}
      </div>
    </PmShell>
  );
};

export default ProjectSetupPage;
