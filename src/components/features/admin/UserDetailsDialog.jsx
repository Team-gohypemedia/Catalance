import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/shared/context/AuthContext";
import User from "lucide-react/dist/esm/icons/user";
import Mail from "lucide-react/dist/esm/icons/mail";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Award from "lucide-react/dist/esm/icons/award";

const UserDetailsDialog = ({ userId, open, onOpenChange }) => {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0 overflow-hidden flex flex-col bg-background">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center flex-1 text-destructive">{error}</div>
        ) : data ? (() => {
          const bioData = parseBio(data.user.bio);
          const isFreelancer = data.user.role === "FREELANCER";
          
          return (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Section - Fixed at top */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b shrink-0">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold">{data.user.fullName}</h3>
                      <Badge variant={data.user.role === "CLIENT" ? "default" : "secondary"}>
                        {data.user.role}
                      </Badge>
                      <Badge variant={data.user.status === "ACTIVE" ? "outline" : "destructive"}>
                        {data.user.status}
                      </Badge>
                    </div>
                    
                    {/* Headline */}
                    {bioData?.headline && (
                      <p className="text-sm text-muted-foreground mt-1">{bioData.headline}</p>
                    )}
                    
                    {/* Contact Info Row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {data.user.email}
                      </span>
                      {bioData?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {bioData.phone}
                        </span>
                      )}
                      {bioData?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {bioData.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {formatDate(data.user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Main Content - Scrollable */}
              <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                {/* Services Row */}
                {bioData?.services && bioData.services.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Services: </span>
                      <span className="text-sm text-muted-foreground">{bioData.services.join(", ")}</span>
                    </div>
                  </div>
                )}



                {/* Freelancer Additional Details - Full Width */}
                {isFreelancer && (
                  <div className="space-y-4">
                    {/* Skills - Full Width */}
                    {data.user.skills?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.user.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info Row */}
                    <div className="flex items-center gap-6 flex-wrap">
                      {/* Hourly Rate */}
                      {data.user.hourlyRate && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">
                            <span className="font-medium">Hourly Rate:</span>{" "}
                            <span className="text-muted-foreground">{formatCurrency(data.user.hourlyRate)}/hr</span>
                          </span>
                        </div>
                      )}

                      {/* Availability */}
                      {bioData?.available !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${bioData.available ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">
                            {bioData.available ? 'Available for work' : 'Not available'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Work Experience */}
                    {bioData?.workExperience && bioData.workExperience.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Work Experience
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {bioData.workExperience.map((exp, idx) => (
                            <div key={idx} className="bg-muted/30 rounded px-3 py-1.5 text-sm">
                              <span className="font-medium">{exp.title || exp.role || exp.company || 'Experience'}</span>
                              {exp.company && exp.title && (
                                <span className="text-muted-foreground"> at {exp.company}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio Links - Check multiple field names */}
                    {(() => {
                      const portfolioLink = bioData?.portfolioUrl || bioData?.portfolio?.portfolioUrl || bioData?.portfolio;
                      const linkedinLink = bioData?.linkedinUrl || bioData?.portfolio?.linkedinUrl || bioData?.linkedin;
                      
                      if (!portfolioLink && !linkedinLink) return null;
                      
                      return (
                        <div className="flex items-center gap-3 pt-3 border-t">
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Links:</span>
                          {portfolioLink && typeof portfolioLink === 'string' && (
                            <a 
                              href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              Portfolio
                            </a>
                          )}
                          {linkedinLink && typeof linkedinLink === 'string' && (
                            <>
                              {portfolioLink && <span className="text-muted-foreground">•</span>}
                              <a 
                                href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                LinkedIn
                              </a>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                    {/* Portfolio Projects - Full Width */}
                    {data.user.portfolioProjects && data.user.portfolioProjects.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">Featured Projects</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {data.user.portfolioProjects.map((project, idx) => (
                            <div key={idx} className="group relative rounded-md border border-border bg-card p-3 shadow-sm hover:shadow-md transition-all">
                              <div className="aspect-video w-full overflow-hidden rounded bg-muted/50 object-cover border border-border/50 relative">
                                {project.image ? (
                                  <img src={project.image} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm bg-secondary/30">No Image</div>
                                )}
                                <a 
                                  href={project.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                >
                                  <ExternalLink className="text-white w-8 h-8 drop-shadow-md" />
                                </a>
                              </div>
                              <div className="mt-3 px-1">
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:text-primary transition-colors truncate block">
                                  {project.title || project.link}
                                </a>
                                <p className="text-xs text-muted-foreground truncate mt-1">{project.link}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio Text */}
                    {bioData?.bio && typeof bioData.bio === 'string' && bioData.bio.length > 5 && (
                      <div className="pt-2 border-t">
                        <h4 className="text-sm font-semibold mb-1">About</h4>
                        <p className="text-sm text-muted-foreground">{bioData.bio}</p>
                      </div>
                    )}
                  </div>
            </div>
          );
        })() : null}
      </DialogContent>
    </Dialog>
  );
};

// Compact stat card component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: "text-blue-500",
    yellow: "text-yellow-500",
    green: "text-green-500",
    emerald: "text-emerald-500",
    purple: "text-purple-500",
    orange: "text-orange-500"
  };
  
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${colorClasses[color]}`} />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

export default UserDetailsDialog;
