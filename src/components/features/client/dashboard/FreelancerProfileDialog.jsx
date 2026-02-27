import { memo } from "react";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Star from "lucide-react/dist/esm/icons/star";
import User from "lucide-react/dist/esm/icons/user";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Zap from "lucide-react/dist/esm/icons/zap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FreelancerProfileDialog = ({
  open,
  onOpenChange,
  viewingFreelancer,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
      {viewingFreelancer && (
        <>
          <DialogHeader>
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/10">
                <AvatarImage
                  src={viewingFreelancer.avatar}
                  alt={viewingFreelancer.fullName}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {(viewingFreelancer.fullName || viewingFreelancer.name)?.charAt(0) ||
                    "F"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  {viewingFreelancer.fullName || viewingFreelancer.name}
                  {viewingFreelancer.rating && (
                    <div className="flex items-center text-sm font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                      {viewingFreelancer.rating}
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription className="text-base font-medium text-foreground/80 mt-1">
                  {viewingFreelancer.role || "Freelancer"}
                </DialogDescription>

                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  {viewingFreelancer.location && (
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {viewingFreelancer.location}
                    </span>
                  )}
                  {viewingFreelancer.hourlyRate && (
                    <span className="flex items-center">
                      <Wallet className="w-3.5 h-3.5 mr-1" />
                      {viewingFreelancer.hourlyRate}/hr
                    </span>
                  )}
                  {viewingFreelancer.experience && (
                    <span className="flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1" />
                      {viewingFreelancer.experience} Exp.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-6 space-y-8 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div>
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> About
              </h4>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {viewingFreelancer.cleanBio || "No bio available."}
              </p>
            </div>

            {Array.isArray(viewingFreelancer.skills) &&
              viewingFreelancer.skills.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingFreelancer.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {Array.isArray(viewingFreelancer.languages) &&
              viewingFreelancer.languages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" /> Languages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingFreelancer.languages.map((lang, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {(() => {
              let projects = [];
              if (
                Array.isArray(viewingFreelancer.portfolioProjects) &&
                viewingFreelancer.portfolioProjects.length > 0
              ) {
                projects = viewingFreelancer.portfolioProjects;
              } else if (
                typeof viewingFreelancer.portfolio === "string" &&
                viewingFreelancer.portfolio.startsWith("[")
              ) {
                try {
                  projects = JSON.parse(viewingFreelancer.portfolio);
                } catch {
                  projects = [];
                }
              } else if (Array.isArray(viewingFreelancer.portfolio)) {
                projects = viewingFreelancer.portfolio;
              }

              if (projects.length === 0) return null;

              return (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" /> Portfolio
                    Projects
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {projects.map((project, i) => (
                      <a
                        key={i}
                        href={project.link || project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group/card h-full"
                      >
                        <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-all h-full relative">
                          {project.image || project.imageUrl || project.thumbnail ? (
                            <div className="w-full aspect-video bg-muted relative overflow-hidden">
                              <img
                                src={project.image || project.imageUrl || project.thumbnail}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                <p className="text-white font-medium text-sm truncate">
                                  {project.title || "View Project"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full aspect-video bg-muted flex items-center justify-center text-muted-foreground p-4 text-center">
                              <span className="font-medium text-sm">
                                {project.title || "View Project"}
                              </span>
                            </div>
                          )}
                        </Card>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default memo(FreelancerProfileDialog);
