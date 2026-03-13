import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Send from "lucide-react/dist/esm/icons/send";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Settings from "lucide-react/dist/esm/icons/settings";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Clock from "lucide-react/dist/esm/icons/clock";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Users from "lucide-react/dist/esm/icons/users";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Plus from "lucide-react/dist/esm/icons/plus";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [checklist, setChecklist] = useState({
    sourceCodeTransferred: false,
    documentationFinalized: false,
    credentialsShared: false,
    finalFilesDelivered: false,
    noPendingIssues: false,
  });

  const details = useAsyncResource(
    () => pmApi.getProjectDetails(authFetch, projectId),
    [authFetch, projectId]
  );
  
  const messages = useAsyncResource(
    () => pmApi.getProjectMessages(authFetch, projectId),
    [authFetch, projectId]
  );

  useEffect(() => {
    if (details.data?.handoverChecklist) {
        setChecklist(prev => ({ ...prev, ...details.data.handoverChecklist }));
    }
  }, [details.data]);

  const handleSendMessage = async () => {
    if (!composer.trim() || sending) return;
    setSending(true);
    try {
        await pmApi.sendProjectMessage(authFetch, projectId, composer);
        setComposer("");
        messages.refresh();
        toast.success("Message sent");
    } catch (e) {
        toast.error(e.message || "Failed to send message");
    } finally {
        setSending(false);
    }
  };

  const handleApproveMilestone = async (phase) => {
    try {
        await pmApi.approveMilestone(authFetch, projectId, phase, "Approved via PM Dashboard");
        details.refresh();
        toast.success(`Phase ${phase} approved`);
    } catch (e) {
        toast.error(e.message || "Approval failed");
    }
  };

  const handleFinalizeHandover = async () => {
    try {
        await pmApi.finalizeHandover(authFetch, projectId, checklist);
        details.refresh();
        toast.success("Project handover finalized");
    } catch (e) {
        toast.error(e.message || "Failed to finalize handover");
    }
  };

  const project = details.data?.project || {};
  const clientProfile = details.data?.clientProfile || {};
  const freelancerProfile = details.data?.freelancerProfile || null;
  const milestoneRows = details.data?.milestones || [];
  const conversationRows = messages.data?.messages || [];
  const logs = details.data?.logs || [];

  if (details.loading) {
    return <PmShell title="Loading..." subtitle="Fetching project details from vault..."><div className="p-20 text-center font-bold text-slate-400">Syncing project data...</div></PmShell>;
  }

  if (!details.data && !details.loading) {
      return <PmShell title="Project Not Found" subtitle="Error 404"><div className="p-20 text-center"><Button onClick={() => navigate("/project-manager/projects")}>Back to Projects</Button></div></PmShell>;
  }

  return (
    <PmShell 
      title={project.title} 
      subtitle={project.description}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-xl border-rose-100 bg-rose-50 px-5 text-xs font-bold text-rose-600 hover:bg-rose-100" onClick={() => toast.info("Escalation module opening...")}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Escalate to Admin
          </Button>
          <Button className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
            Project Settings
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/project-manager" className="hover:text-blue-600">Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/project-manager/projects" className="hover:text-blue-600">Projects</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">{project.title}</span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Badge className={`${project.status?.color === 'red' ? 'bg-rose-600' : 'bg-blue-600'} text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase`}>
            {project.status?.label || "ACTIVE"}
        </Badge>
        <span className="text-xs font-medium text-slate-400">Project ID: #{project.id}</span>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8 h-auto w-full justify-start gap-8 rounded-none border-b border-slate-100 bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Messages</TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Milestones</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-none border-b-2 border-transparent px-0 pb-3 font-bold text-slate-400 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600">Project Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="mb-6 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                             <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">Client Profile</h3>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                       <Avatar className="h-14 w-14 rounded-2xl shadow-sm">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${clientProfile.clientName}`} />
                          <AvatarFallback>C</AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="text-base font-bold text-slate-900">{clientProfile.clientName}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{clientProfile.company || "Direct Client"}</p>
                       </div>
                    </div>
                    <div className="space-y-5">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Project Scope</p>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3">{project.description}</p>
                       </div>
                       <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Allocation</p>
                          <p className="text-xl font-black text-slate-900">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="mb-6 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                             <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">Professional Lead</h3>
                       </div>
                    </div>
                    {freelancerProfile ? (
                        <>
                            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-50">
                               <Avatar className="h-14 w-14 rounded-2xl shadow-sm">
                                  <AvatarImage src={freelancerProfile.avatar} />
                                  <AvatarFallback className="bg-slate-100">{freelancerProfile.freelancerName?.[0]}</AvatarFallback>
                               </Avatar>
                               <div>
                                  <p className="text-base font-bold text-slate-900">{freelancerProfile.freelancerName}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                     <span className="text-yellow-500 text-xs">★</span>
                                     <span className="text-xs font-bold text-slate-900">{freelancerProfile.rating}</span>
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">({freelancerProfile.reviewsCount} reviews)</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-6">
                               {freelancerProfile.skills.slice(0, 4).map(skill => (
                                 <Badge key={skill} variant="secondary" className="bg-white border border-slate-100 text-slate-600 text-[9px] font-bold rounded-lg px-2 py-0.5 shadow-sm">{skill.toUpperCase()}</Badge>
                               ))}
                               {freelancerProfile.skills.length > 4 && <span className="text-[9px] font-bold text-slate-400">+{freelancerProfile.skills.length - 4}</span>}
                            </div>
                            <Button variant="outline" className="w-full h-11 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-black tracking-widest text-slate-600 hover:bg-white hover:border-indigo-100 hover:text-indigo-600 transition-all uppercase" onClick={() => window.open(freelancerProfile.portfolio || '#', '_blank')}>
                               VIEW FULL PORTFOLIO
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 space-y-3 border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/30">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100">
                               <Plus className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NO TALENT ASSIGNED</p>
                            <Button variant="default" className="h-9 rounded-lg bg-blue-600 text-[10px] font-black tracking-widest uppercase px-4" onClick={() => navigate("/project-manager/marketplace")}>Browse Marketplace</Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>              <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-10">
                  <div className="mb-10 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                           <CreditCard className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                           <h3 className="text-base font-bold text-slate-900">Milestone Payout Tracker</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Escrow Distribution</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">COMPLETION</span>
                        <Badge className="bg-emerald-500 text-[10px] font-black text-white px-3 py-1 rounded-lg">
                           {milestoneRows.filter(m => m.status === 'Approved' || m.status === 'Completed').length} / {milestoneRows.length} PHASES
                        </Badge>
                     </div>
                  </div>
                  
                  <div className="space-y-8">
                     {milestoneRows.map((milestone, i) => (
                       <div key={i} className={`group flex items-start justify-between relative ${milestone.status === 'Locked' ? 'opacity-40 grayscale' : ''}`}>
                          {i !== milestoneRows.length - 1 && <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-100 -mb-8" />}
                          <div className="flex items-start gap-6">
                             <div className={`mt-1 flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${milestone.status === 'Approved' || milestone.status === 'Completed' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-50' : milestone.status === 'Pending Approval' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 ring-4 ring-blue-50' : 'bg-slate-100 text-slate-400'}`}>
                                {milestone.status === 'Approved' || milestone.status === 'Completed' ? <CheckCircle className="h-6 w-6" /> : milestone.status === 'Pending Approval' ? <MoreHorizontal className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">Phase {milestone.phase}: {milestone.title}</h4>
                                <p className="text-xs font-medium text-slate-500 max-w-md leading-relaxed">{milestone.validationNotes || "Pending requirements for this phase."}</p>
                                {milestone.status === 'Approved' && (
                                   <div className="mt-3 flex items-center gap-2">
                                      <Badge variant="outline" className="text-[9px] font-bold border-emerald-100 bg-emerald-50/50 text-emerald-600 uppercase">Verification Passed</Badge>
                                      <span className="text-[9px] font-medium text-slate-400 italic">on {new Date().toLocaleDateString()}</span>
                                   </div>
                                )}
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-3">
                             <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-0.5">ESCROW AMOUNT</p>
                                <p className="text-lg font-black text-slate-900">INR {milestone.amount?.toLocaleString("en-IN")}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${milestone.status === 'Approved' || milestone.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : milestone.status === 'Pending Approval' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {milestone.status}
                                </span>
                                {milestone.eligibleForApproval && (
                                  <Button 
                                    onClick={() => handleApproveMilestone(milestone.phase)}
                                    className="h-10 rounded-xl bg-blue-600 px-6 text-[10px] font-black tracking-widest uppercase text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                                  >
                                     Approve Payout
                                  </Button>
                                )}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-[40px] border-2 border-dashed border-blue-100 bg-blue-50/30 p-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="h-48 w-48 text-blue-600" />
                 </div>
                 <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[30px] bg-white text-blue-600 shadow-xl shadow-blue-600/5">
                       <Download className="h-8 w-8" />
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                       <h3 className="mb-2 text-xl font-bold text-slate-900">Handover Documentation</h3>
                       <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                          Ensure all deliverables, source files, and credentials have been securely verified by you before initiating Final Release.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-slate-100">
                             <Checkbox 
                                checked={checklist.sourceCodeTransferred} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, sourceCodeTransferred: !!v}))}
                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Sources</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-slate-100">
                             <Checkbox 
                                checked={checklist.documentationFinalized} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, documentationFinalized: !!v}))}
                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Docs</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-slate-100">
                             <Checkbox 
                                checked={checklist.credentialsShared} 
                                onCheckedChange={(v) => setChecklist(p => ({...p, credentialsShared: !!v}))}
                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm" 
                             />
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">Access</span>
                          </label>
                       </div>
                       <Button 
                           onClick={handleFinalizeHandover}
                           disabled={!checklist.sourceCodeTransferred || !checklist.documentationFinalized || !checklist.credentialsShared}
                           className="h-14 rounded-2xl bg-blue-600 px-10 text-xs font-black tracking-widest uppercase text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                       >
                          Finalize Project Closure
                       </Button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
               <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden flex flex-col h-[750px] bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                     <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                           <Avatar className="h-8 w-8 border-2 border-white">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${project.title}`} />
                           </Avatar>
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-slate-900">Assigned Workspace</h4>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">• ACTIVE SYNC</p>
                        </div>
                     </div>
                     <Settings className="h-4 w-4 text-slate-400" />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-slate-50/10">
                     {messages.loading ? (
                         <div className="flex h-full items-center justify-center text-xs font-bold text-slate-300">Syncing messages...</div>
                     ) : conversationRows.length > 0 ? (
                         conversationRows.map((msg) => (
                           <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PROJECT_MANAGER' ? 'items-end' : 'items-start'}`}>
                              <p className="mb-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                 {msg.senderLabel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <div className={`max-w-[90%] rounded-2xl p-4 text-sm font-medium ${msg.senderRole === 'PROJECT_MANAGER' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' : 'bg-white border border-slate-100 text-slate-900 rounded-tl-none shadow-sm'}`}>
                                 {msg.content}
                              </div>
                           </div>
                         ))
                     ) : (
                         <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-4">
                             <MessageCircle className="h-12 w-12 text-slate-100" />
                             <p className="text-sm font-bold text-slate-400">No messages yet. Start the conversation with the client and freelancer.</p>
                         </div>
                     )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-white">
                     <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                        <Input 
                           value={composer}
                           onChange={(e) => setComposer(e.target.value)}
                           className="h-14 w-full rounded-2xl border-none bg-slate-50 px-6 pr-14 text-sm font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20" 
                           placeholder="Drop an update or ask a question..."
                           disabled={sending}
                        />
                        <button 
                            type="submit"
                            disabled={sending || !composer.trim()}
                            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                     </form>
                  </div>
               </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-0 focus-visible:outline-none">
           <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col h-[700px]">
              <div className="p-10 text-center space-y-4">
                 <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-8 w-8" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900">Communication Terminal</h2>
                 <p className="text-sm font-medium text-slate-400 max-w-lg mx-auto">This project's full message stream and history for archival and alignment tracking.</p>
                 <Button onClick={() => navigate(`/project-manager/messages?projectId=${projectId}`)} className="h-12 rounded-2xl bg-slate-900 text-[10px] font-black tracking-widest uppercase text-white px-8 mt-4">Open Full Screen Terminal</Button>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-0 focus-visible:outline-none">
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UNLOCKED FUNDS</p>
                    <p className="text-2xl font-black text-emerald-600">INR {milestoneRows.filter(m => m.status === 'Approved' || m.status === 'Completed').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ESCROW HOLD</p>
                    <p className="text-2xl font-black text-blue-600">INR {milestoneRows.filter(m => m.status === 'Locked' || m.status === 'Pending Approval').reduce((acc, m) => acc + (m.amount || 0), 0).toLocaleString("en-IN")}</p>
                 </Card>
                 <Card className="rounded-3xl border-slate-100 p-8 shadow-sm bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL BUDGET</p>
                    <p className="text-2xl font-black text-slate-900">INR {Number(project.budget || 0).toLocaleString("en-IN")}</p>
                 </Card>
              </div>

              <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                 <div className="p-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-8">Detailed Milestone Audit</h3>
                    <div className="space-y-12">
                       {milestoneRows.map((milestone, idx) => (
                          <div key={idx} className="flex gap-10">
                             <div className="flex flex-col items-center">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${milestone.status === 'Approved' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                   {idx + 1}
                                </div>
                                {idx < milestoneRows.length - 1 && <div className="flex-1 w-0.5 bg-slate-100 my-4" />}
                             </div>
                             <div className="flex-1 pb-10 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-4">
                                   <div>
                                      <h4 className="text-lg font-black text-slate-900">{milestone.title}</h4>
                                      <Badge variant="outline" className={`mt-2 font-black text-[9px] uppercase ${milestone.status === 'Approved' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400'}`}>{milestone.status}</Badge>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-xl font-black text-slate-900">INR {milestone.amount?.toLocaleString("en-IN")}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payout Volume</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deliverables Verified</p>
                                      <ul className="space-y-2">
                                         <li className="flex items-center gap-2 text-xs font-medium text-slate-600"><CheckCircle className="h-3 w-3 text-emerald-500" /> Source Assets Integration</li>
                                         <li className="flex items-center gap-2 text-xs font-medium text-slate-600"><CheckCircle className="h-3 w-3 text-emerald-500" /> QA Documentation</li>
                                      </ul>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PM Notes</p>
                                      <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{milestone.validationNotes || "No specific auditor notes for this phase."}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="logs">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
                <CardContent className="p-10">
                    <div className="space-y-8">
                        {logs.length > 0 ? logs.map((log) => (
                            <div key={log.id} className="flex gap-6 items-start">
                                <div className="h-3 w-3 rounded-full bg-blue-600 mt-2 shrink-0 shadow-lg shadow-blue-500/20" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{log.type}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{log.content}</p>
                                    <p className="text-xs font-medium text-slate-400">Actor: {log.actor}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-20 text-slate-400 font-bold">No activity logs recorded yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-16 flex items-center justify-between border-t border-slate-100 pt-8 pb-8">
         <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
               <span className="text-white text-[10px] font-bold">🚀</span>
            </div>
            <span className="text-xs text-slate-400">© 2024 Catalance Platform. All rights reserved.</span>
         </div>
      </div>
    </PmShell>
  );
};

export default ProjectDetailsPage;
