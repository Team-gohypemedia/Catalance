import { memo } from "react";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Flag from "lucide-react/dist/esm/icons/flag";
import User from "lucide-react/dist/esm/icons/user";
import Zap from "lucide-react/dist/esm/icons/zap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FreelancerDetailsDialog = ({ open, onOpenChange, viewFreelancer }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage
              src={viewFreelancer?.avatar}
              alt={viewFreelancer?.fullName || viewFreelancer?.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {(viewFreelancer?.fullName || viewFreelancer?.name)?.charAt(0) || "F"}
            </AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl font-bold">
              {viewFreelancer?.fullName || viewFreelancer?.name}
            </DialogTitle>
            <p className="text-muted-foreground">
              {viewFreelancer?.headline || "Freelancer"}
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {viewFreelancer?.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flag className="w-4 h-4" /> {viewFreelancer.location}
          </div>
        )}

        {viewFreelancer?.about && (
          <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> About
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {viewFreelancer.about}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(viewFreelancer?.skills) && viewFreelancer.skills.length > 0 ? (
              viewFreelancer.skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed</p>
            )}
          </div>
        </div>

        {Array.isArray(viewFreelancer?.services) &&
          viewFreelancer.services.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Services
              </h4>
              <div className="flex flex-wrap gap-2">
                {viewFreelancer.services.map((service, idx) => (
                  <Badge key={idx} variant="outline" className="px-3 py-1">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {Array.isArray(viewFreelancer?.workExperience) &&
          viewFreelancer.workExperience.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Work Experience
              </h4>
              <div className="space-y-4">
                {viewFreelancer.workExperience.map((exp, idx) => (
                  <div key={idx} className="border-l-2 border-primary/20 pl-4 py-1">
                    <h5 className="font-semibold">{exp.title}</h5>
                    <p className="text-xs text-muted-foreground mb-1">{exp.period}</p>
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {Array.isArray(viewFreelancer?.portfolioProjects) &&
          viewFreelancer.portfolioProjects.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" /> Portfolio Projects
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewFreelancer.portfolioProjects.map((project, idx) => (
                  <a
                    key={idx}
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                  >
                    <div className="aspect-video bg-muted relative">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <ExternalLink className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {project.title || project.link}
                      </h5>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.link}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
      </div>
    </DialogContent>
  </Dialog>
);

export default memo(FreelancerDetailsDialog);
