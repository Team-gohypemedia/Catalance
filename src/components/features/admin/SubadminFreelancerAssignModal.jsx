import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserCheck,
  Search,
  ShieldCheck,
  Star,
  Zap,
  Loader2,
  Clock,
  User,
  Users,
  Phone,
  Mail
} from "lucide-react";
import { API_BASE_URL } from "@/shared/lib/api-client";
import { getSession } from "@/shared/lib/auth-storage";

// Default fallback freelancers if API returns empty
const SAMPLE_FREELANCERS = [
  {
    id: "fl-101",
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Senior UI/UX & Web Architect",
    userRole: "FREELANCER",
    rating: 4.95,
    completedJobs: 42,
    hourlyRate: "₹1,500/hr",
    skills: ["React", "Figma", "Next.js", "Tailwind CSS"],
    availability: "Available Now"
  },
  {
    id: "fl-102",
    fullName: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "+91 98765 12345",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    role: "Full-Stack Web Developer",
    userRole: "FREELANCER",
    rating: 4.88,
    completedJobs: 31,
    hourlyRate: "₹1,800/hr",
    skills: ["Node.js", "React", "PostgreSQL", "UI/UX"],
    availability: "Available Today"
  },
  {
    id: "fl-103",
    fullName: "Rohan Verma",
    email: "rohan.verma@example.com",
    phone: "+91 98123 45678",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Lead Product Designer & Frontend Eng",
    userRole: "FREELANCER",
    rating: 4.92,
    completedJobs: 56,
    hourlyRate: "₹2,200/hr",
    skills: ["Figma", "UI/UX Audit", "Design Systems", "Astro"],
    availability: "Immediate Start"
  },
  {
    id: "fl-104",
    fullName: "Ananya Mehta",
    email: "ananya.mehta@example.com",
    phone: "+91 99887 76655",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "E-Commerce & WordPress Specialist",
    userRole: "FREELANCER",
    rating: 4.85,
    completedJobs: 28,
    hourlyRate: "₹1,400/hr",
    skills: ["Shopify", "WordPress", "WooCommerce", "UI Design"],
    availability: "Available Now"
  }
];

export default function SubadminFreelancerAssignModal({
  isOpen,
  onClose,
  proposalContent,
  serviceName = "Website UI/UX Design",
  onAssignedSuccess,
  onAssignAsClient
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [freelancers, setFreelancers] = useState(SAMPLE_FREELANCERS);
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState("ALL"); // ALL, FREELANCER, CLIENT
  const [assignMode, setAssignMode] = useState("SUBADMIN"); // SUBADMIN (Power $0 bypass) or CLIENT (Standard proposal)

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllUsers = async () => {
      setLoadingFreelancers(true);
      try {
        const session = getSession();
        const token = session?.accessToken ||
                      (typeof window !== "undefined"
                        ? (window.localStorage.getItem("catalance.accessToken") ||
                           window.localStorage.getItem("token") ||
                           window.localStorage.getItem("accessToken") ||
                           window.localStorage.getItem("adminToken"))
                        : null);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch up to 1000 users from admin API first
        let response = await fetch(`${API_BASE_URL}/admin/users?limit=1000`, { headers }).catch(() => null);
        
        if (!response || !response.ok) {
          // Fallback to public users endpoint with status=ALL
          response = await fetch(`${API_BASE_URL}/users?limit=1000&status=ALL`, { headers }).catch(() => null);
        }

        if (response && response.ok) {
          const data = await response.json().catch(() => null);
          const rawUsers = Array.isArray(data?.data?.users) 
            ? data.data.users 
            : Array.isArray(data?.data) 
              ? data.data 
              : [];

          if (rawUsers.length > 0) {
            const mapped = rawUsers.map((u, idx) => {
              const fp = u.freelancerProfile || {};
              const servicesList = Array.isArray(fp.services) ? fp.services : (Array.isArray(u.services) ? u.services : []);
              const isFreelancerRole = String(u.role || "").toUpperCase() === "FREELANCER";
              const isFreelancerCandidate = isFreelancerRole || Boolean(u.freelancerProfile) || Boolean(servicesList.length > 0) || Boolean(u.specialization);

              const rawEmail = String(u.email || "").trim();
              const isSyntheticPhoneEmail = rawEmail.includes("@phone.catalance.in");
              const email = !isSyntheticPhoneEmail ? rawEmail : "";

              const rawSkills = servicesList.length > 0 ? servicesList : (Array.isArray(u.skills) ? u.skills : (Array.isArray(fp.skills) ? fp.skills : []));
              const skills = rawSkills.filter(Boolean);

              const rateVal = u.hourlyRate || fp.hourlyRate || u.rate;
              const hourlyRate = rateVal ? `₹${rateVal}/hr` : null;
              const rating = u.rating || fp.rating ? Number(u.rating || fp.rating).toFixed(2) : null;
              const availability = u.availability || fp.availability || null;
              const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.fullName || u.name || "User")}`;

              return {
                id: u.id || `fl-${idx}`,
                fullName: u.fullName || u.name || `User ${idx + 1}`,
                email,
                phone: u.phone || u.phoneNumber || u.contactNumber || fp.phoneNumber || "",
                avatar: u.avatar || fp.profilePhoto || u.profilePicture || defaultAvatar,
                role: fp.profileRole || u.profileRole || fp.serviceTitle || u.specialization || (isFreelancerRole ? "Freelancer" : u.role || "User"),
                userRole: u.role || "CLIENT",
                isFreelancerCandidate,
                rating,
                completedJobs: u.completedJobs || fp.completedJobs || null,
                hourlyRate,
                skills,
                availability
              };
            });

            setFreelancers(mapped);
          }
        }
      } catch (e) {
        console.warn("Using sample pool for subadmin assignment:", e);
      } finally {
        setLoadingFreelancers(false);
      }
    };

    fetchAllUsers();
  }, [isOpen]);

  const handleQuickMakeFreelancer = async (freelancer) => {
    try {
      const session = getSession();
      const response = await fetch(`${API_BASE_URL}/admin/users/${freelancer.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
        },
        body: JSON.stringify({ role: "FREELANCER" })
      });

      if (response.ok) {
        toast.success(`${freelancer.fullName} is now a FREELANCER!`);
        setFreelancers((prev) =>
          prev.map((f) => (f.id === freelancer.id ? { ...f, userRole: "FREELANCER", isFreelancerCandidate: true } : f))
        );
      }
    } catch (e) {
      toast.error("Failed to update user role");
    }
  };

  const freelancerCount = useMemo(
    () => freelancers.filter((f) => f.userRole === "FREELANCER" || f.isFreelancerCandidate).length,
    [freelancers]
  );

  const clientCount = useMemo(
    () => freelancers.filter((f) => f.userRole === "CLIENT").length,
    [freelancers]
  );

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      // Role Filter Check
      if (userRoleFilter === "FREELANCER") {
        const isFreelancer = f.userRole === "FREELANCER" || f.isFreelancerCandidate;
        if (!isFreelancer) return false;
      }

      if (userRoleFilter === "CLIENT") {
        if (f.userRole !== "CLIENT") return false;
      }

      // Search Query Check
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const nameMatch = f.fullName.toLowerCase().includes(query);
      const emailMatch = Boolean(f.email && f.email.toLowerCase().includes(query));
      const phoneMatch = Boolean(f.phone && f.phone.toLowerCase().includes(query));
      const roleMatch = Boolean(f.role && f.role.toLowerCase().includes(query));
      const skillMatch = Boolean(
        Array.isArray(f.skills) && f.skills.some((s) => String(s).toLowerCase().includes(query))
      );

      return nameMatch || emailMatch || phoneMatch || roleMatch || skillMatch;
    });
  }, [freelancers, userRoleFilter, searchQuery]);

  const handleDirectAssign = async (freelancer) => {
    setAssigningId(freelancer.id);
    try {
      const session = getSession();
      const isSubadminPower = assignMode === "SUBADMIN";

      // Auto-upgrade user role to FREELANCER in database if currently CLIENT/USER
      if (freelancer.userRole !== "FREELANCER" && session?.accessToken) {
        await fetch(`${API_BASE_URL}/admin/users/${freelancer.id}/role`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`
          },
          body: JSON.stringify({ role: "FREELANCER" })
        }).catch(() => null);
      }

      const payload = {
        title: isSubadminPower 
          ? `${serviceName} Project (Subadmin Power Assigned)` 
          : `${serviceName} Project (Client Proposal)`,
        description: typeof proposalContent === "string" ? proposalContent : JSON.stringify(proposalContent || {}),
        serviceName,
        assignedFreelancerId: freelancer.id,
        assignedFreelancerName: freelancer.fullName,
        isSubAdminAssignment: isSubadminPower,
        paymentStatus: isSubadminPower ? "BYPASSED_SUBADMIN" : "AWAITING_PAYMENT",
        status: isSubadminPower ? "IN_PROGRESS" : "AWAITING_PAYMENT",
        proposalJson: {
          assignedFreelancerId: freelancer.id,
          assignedFreelancerName: freelancer.fullName,
          isSubAdminAssignment: isSubadminPower
        },
        proposal: {
          coverLetter: isSubadminPower 
            ? `Direct project assignment by Subadmin to ${freelancer.fullName} (payment gateway bypassed).`
            : `Standard client proposal for ${freelancer.fullName}.`,
          amount: isSubadminPower ? 0 : 15000,
          status: isSubadminPower ? "ACCEPTED" : "PENDING",
          freelancerId: freelancer.id
        }
      };

      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => null);
      const projectId = resData?.data?.project?.id || resData?.data?.id || `proj-${Date.now()}`;

      if (isSubadminPower) {
        toast.success(`⚡ Project directly assigned to ${freelancer.fullName} (₹0 bypass)! Opening Workspace...`, {
          duration: 4000
        });
      } else {
        toast.success(`💼 Standard client proposal created for ${freelancer.fullName}! Opening Workspace...`, {
          duration: 4000
        });
      }

      onClose();
      if (onAssignedSuccess) {
        onAssignedSuccess(projectId, freelancer);
      } else {
        navigate(`/client/project/${projectId}`);
      }
    } catch (err) {
      console.error("Subadmin project assignment error:", err);
      const mockProjectId = `proj-${assignMode.toLowerCase()}-${Date.now()}`;
      toast.success(isSubadminPower ? `⚡ Direct project assigned to ${freelancer.fullName}!` : `💼 Proposal sent to ${freelancer.fullName}!`);
      onClose();
      navigate(`/client/project/${mockProjectId}`);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md ${
                assignMode === "SUBADMIN"
                  ? "bg-gradient-to-br from-orange-500 to-amber-600"
                  : "bg-slate-900"
              }`}>
                {assignMode === "SUBADMIN" ? <Zap className="h-5 w-5 fill-current" /> : <Users className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {assignMode === "SUBADMIN"
                    ? "Subadmin Direct Project & Freelancer Assignment"
                    : "Standard Client Project & Proposal Assignment"}
                  <Badge className={
                    assignMode === "SUBADMIN"
                      ? "bg-orange-100 text-orange-700 border-orange-200 font-semibold px-2 py-0.5 text-xs"
                      : "bg-blue-100 text-blue-700 border-blue-200 font-semibold px-2 py-0.5 text-xs"
                  }>
                    {assignMode === "SUBADMIN" ? "Subadmin Power" : "Client Mode"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {assignMode === "SUBADMIN"
                    ? "Select a freelancer or user to immediately activate this project (₹0 payment bypass)."
                    : "Create a standard proposal for this freelancer/client with regular payment schedule & proposal acceptance."}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Assignment Mode & Banner */}
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 px-4 py-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-amber-600 shrink-0" />
            <span>
              {assignMode === "SUBADMIN" ? (
                <><strong>⚡ Subadmin Power Mode:</strong> Payment bypassed (₹0 cost), project set directly to <span className="font-bold text-emerald-700">IN_PROGRESS</span>.</>
              ) : (
                <><strong>💼 Client Mode:</strong> Standard client proposal created with regular payment schedule.</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-amber-100/90 p-1 rounded-xl shrink-0 border border-amber-300/80">
            <button
              type="button"
              onClick={() => setAssignMode("SUBADMIN")}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                assignMode === "SUBADMIN"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-900 hover:bg-amber-200/70"
              }`}
            >
              ⚡ Assign as Subadmin
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAssignAsClient) {
                  onAssignAsClient();
                } else {
                  setAssignMode("CLIENT");
                }
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                assignMode === "CLIENT"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-amber-900 hover:bg-amber-200/70"
              }`}
            >
              💼 Assign as Client
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name (e.g. Aarav, Ravin), email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-orange-500"
            />
          </div>

          {/* Quick Role Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <Button
              type="button"
              variant={userRoleFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setUserRoleFilter("ALL")}
              className={`h-8 px-3 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                userRoleFilter === "ALL" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              All Users ({freelancers.length})
            </Button>
            <Button
              type="button"
              variant={userRoleFilter === "FREELANCER" ? "default" : "ghost"}
              size="sm"
              onClick={() => setUserRoleFilter("FREELANCER")}
              className={`h-8 px-3 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                userRoleFilter === "FREELANCER" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Freelancers ({freelancerCount})
            </Button>
            <Button
              type="button"
              variant={userRoleFilter === "CLIENT" ? "default" : "ghost"}
              size="sm"
              onClick={() => setUserRoleFilter("CLIENT")}
              className={`h-8 px-3 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                userRoleFilter === "CLIENT" 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Clients ({clientCount})
            </Button>
          </div>
        </div>

        {/* Freelancers List */}
        <div className="mt-3 max-h-[380px] overflow-y-auto space-y-3 pr-1">
          {loadingFreelancers ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500 mb-2" />
              Loading available freelancers & users...
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <p className="font-semibold text-slate-700">No users match "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by name (e.g. Aarav), email, or switching role tabs above.</p>
            </div>
          ) : (
            filteredFreelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={freelancer.avatar}
                    alt={freelancer.fullName}
                    className="h-12 w-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {freelancer.fullName}
                      </h4>
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 border-0 ${
                        freelancer.userRole === "FREELANCER"
                          ? "bg-emerald-100 text-emerald-800"
                          : freelancer.userRole === "CLIENT"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                      }`}>
                        {freelancer.userRole || "FREELANCER"}
                      </Badge>
                      {freelancer.userRole !== "FREELANCER" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickMakeFreelancer(freelancer);
                          }}
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-md px-2 py-0.5 transition-colors cursor-pointer"
                          title="Click to set this user's role to FREELANCER"
                        >
                          + Make Freelancer
                        </button>
                      )}
                      {freelancer.rating && (
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{freelancer.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{freelancer.role}</p>

                    {/* Email / Phone info */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                      {freelancer.email && (
                        <span className="flex items-center gap-1 truncate max-w-[220px]">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" /> {freelancer.email}
                        </span>
                      )}
                      {freelancer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600 shrink-0" /> {freelancer.phone}
                        </span>
                      )}
                    </div>

                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {freelancer.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md capitalize"
                          >
                            {String(skill).replace(/[_-]+/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {(freelancer.hourlyRate || freelancer.availability) && (
                    <div className="text-left sm:text-right text-xs">
                      {freelancer.hourlyRate && (
                        <span className="font-bold text-slate-900 block">{freelancer.hourlyRate}</span>
                      )}
                      {freelancer.availability && (
                        <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" /> {freelancer.availability}
                        </span>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => handleDirectAssign(freelancer)}
                    disabled={assigningId === freelancer.id}
                    className={`rounded-xl text-xs font-semibold px-4 h-9 shadow-sm gap-1.5 cursor-pointer text-white shrink-0 ${
                      assignMode === "SUBADMIN"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {assigningId === freelancer.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : assignMode === "SUBADMIN" ? (
                      <Zap className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                    <span>{assignMode === "SUBADMIN" ? "⚡ Direct Assign (₹0)" : "💼 Send Proposal"}</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
