import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import { Button } from "@/components/ui/button";
import User from "lucide-react/dist/esm/icons/user";
import Mail from "lucide-react/dist/esm/icons/mail";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Award from "lucide-react/dist/esm/icons/award";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/users/${userId}`);
      const result = await res.json();
      if (result?.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Parse bio JSON
  const parseBio = (bio) => {
    if (!bio) return null;
    try {
      const parsed = JSON.parse(bio);
      return typeof parsed === 'object' ? parsed : { bio };
    } catch {
      return { bio };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
     return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const bioData = parseBio(data.user.bio);
  const isFreelancer = data.user.role === "FREELANCER";

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="bg-background border-b p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>
            
            <div className="flex items-start gap-6 max-w-5xl mx-auto w-full">
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">{data.user.fullName}</h1>
                    <Badge variant={data.user.role === "CLIENT" ? "default" : "secondary"}>
                    {data.user.role}
                    </Badge>
                    <Badge variant={data.user.status === "ACTIVE" ? "outline" : "destructive"}>
                    {data.user.status}
                    </Badge>
                </div>
                
                {/* Headline */}
                {bioData?.headline && (
                    <p className="text-lg text-muted-foreground mb-4">{bioData.headline}</p>
                )}
                
                {/* Contact Info Row */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {data.user.email}
                    </span>
                    {bioData?.phone && (
                    <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {bioData.phone}
                    </span>
                    )}
                    {bioData?.location && (
                    <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {bioData.location}
                    </span>
                    )}
                    <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(data.user.createdAt)}
                    </span>
                </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-muted/10">
          <div className="max-w-5xl mx-auto w-full p-8 space-y-10">
            
            {/* Services Row */}
            {bioData?.services && bioData.services.length > 0 && (
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Services</h4>
                        <div className="flex flex-wrap gap-2">
                            {bioData.services.map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="font-normal">
                                    {service}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* Freelancer Additional Details */}
            {isFreelancer && (
              <div className="space-y-10">
                {/* Skills */}
                {data.user.skills?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground/80">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.user.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info Row - Availability */}
                {bioData?.available !== undefined && (
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${bioData.available ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} />
                        <span className="font-medium">
                        {bioData.available ? 'Currently available for new projects' : 'Currently unavailable'}
                        </span>
                    </div>
                )}

                {/* Work Experience */}
                {bioData?.workExperience && bioData.workExperience.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground/80">
                      <Award className="h-5 w-5" />
                      Work Experience
                    </h3>
                    <div className="grid gap-4">
                      {bioData.workExperience.map((exp, idx) => (
                        <div key={idx} className="bg-card border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-semibold text-lg block">{exp.title || exp.role || 'Experience'}</span>
                                {exp.company && (
                                    <span className="text-muted-foreground">{exp.company}</span>
                                )}
                              </div>
                              {exp.period && (
                                <Badge variant="secondary" className="text-xs">{exp.period}</Badge>
                              )}
                          </div>
                          {exp.description && (
                              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Portfolio Projects */}
                {data.user.portfolioProjects && data.user.portfolioProjects.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-foreground/80">Featured Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.user.portfolioProjects.map((project, idx) => (
                        <div key={idx} className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block aspect-video w-full bg-muted/50 relative group-hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            {project.image ? (
                              <img src={project.image} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm bg-secondary/30 text-muted-foreground">No Image Preview</div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                              <div className="bg-background/90 text-foreground px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <ExternalLink className="w-4 h-4" />
                                Visit Site
                              </div>
                            </div>
                          </a>
                          <div className="p-4 border-t">
                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors truncate block text-lg mb-1">
                              {project.title || project.link.replace(/^https?:\/\//, '')}
                            </a>
                            <p className="text-xs text-muted-foreground truncate">{project.link}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                {(() => {
                  // Helper to safely get string or null
                  const getString = (val) => (typeof val === 'string' && val.trim().length > 0 ? val : null);
                  const portfolioObj = (typeof bioData?.portfolio === 'object' && bioData?.portfolio) ? bioData.portfolio : {};

                  // Check all possible locations for links
                  const portfolioLink = getString(data.user.portfolio) || getString(bioData?.portfolioUrl) || getString(portfolioObj?.portfolioUrl) || getString(portfolioObj?.website);
                  const linkedinLink = getString(data.user.linkedin) || getString(bioData?.linkedinUrl) || getString(portfolioObj?.linkedinUrl) || getString(portfolioObj?.linkedin);
                  const githubLink = getString(data.user.github) || getString(bioData?.githubUrl) || getString(portfolioObj?.githubUrl) || getString(portfolioObj?.github);
                  
                  if (!portfolioLink && !linkedinLink && !githubLink) return null;
                  
                  return (
                    <div>
                         <h3 className="text-xl font-semibold mb-4 text-foreground/80">Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portfolioLink && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                    <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                                        <ExternalLink className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Portfolio / Website</p>
                                        <a 
                                            href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                                        >
                                            {portfolioLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {linkedinLink && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                    <div className="p-2 rounded-full bg-blue-600/10 shrink-0">
                                        <ExternalLink className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">LinkedIn</p>
                                        <a 
                                            href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                                        >
                                            {linkedinLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {githubLink && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                                    <div className="p-2 rounded-full bg-gray-500/10 shrink-0">
                                        <ExternalLink className="h-4 w-4 text-gray-700" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">GitHub</p>
                                        <a 
                                            href={githubLink.startsWith('http') ? githubLink : `https://${githubLink}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium hover:text-primary transition-colors truncate block"
                                        >
                                            {githubLink}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                  );
                })()}

                {/* Bio Text */}
                {bioData?.bio && typeof bioData.bio === 'string' && bioData.bio.length > 5 && (
                  <div className="bg-card p-8 rounded-xl border">
                    <h3 className="text-xl font-semibold mb-4">About</h3>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">{bioData.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetails;
