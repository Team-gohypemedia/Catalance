import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FreelancerAboutCard = ({ freelancer, project }) => {
  if (!freelancer) return null;
  const projectLink = project?.externalLink || "";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">About</h3>

      <div className="space-y-3">
        {projectLink ? (
          <a
            href={projectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm text-blue-400 hover:underline"
          >
            <div className="w-5 flex justify-center">
              <Link2 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-blue-400" />
            </div>
            <span className="truncate">Project Link</span>
          </a>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4 shrink-0" />
            No project link
          </div>
        )}

        {(() => {
          const desc = (project?.description || "").trim();
          const summaryMatch = desc.match(
            /Summary[:\s]+(.+?)(?=(?:\r?\n\s*(?:Pages & Features|Core pages|Deliverables|Budget|Next Steps|Integrations|Designs|Hosting|Domain|Timeline|Launch Timeline)[:\s])|$)/is,
          );
          const summary = summaryMatch
            ? summaryMatch[1]
                .replace(/^[\s-]+/, "")
                .replace(/[\s-]+$/, "")
                .trim()
            : null;

          return summary ? (
            <div className="border-t border-white/[0.06] pt-3">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#8f96a3]">
                Project Summary
              </span>
              <p className="text-sm leading-6 text-white/80">{summary}</p>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
};

const FreelancerInfoCard = ({
  freelancer,
  project,
  panelClassName,
  eyebrowClassName,
}) => {
  if (!freelancer) return null;

  return (
    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={eyebrowClassName}>
          Freelancer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border border-white/[0.08] bg-[#111111]">
            <AvatarImage src={freelancer.avatar} alt={freelancer.fullName} />
            <AvatarFallback className="bg-[#111111] text-white">
              {(freelancer.fullName || "F").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-white">
                {freelancer.fullName || "Freelancer Name"}
              </span>
              {freelancer.isVerified ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 text-blue-500"
                  fill="currentColor"
                  stroke="white"
                />
              ) : null}
            </div>
            {freelancer.jobTitle ? (
              <span className="text-sm text-muted-foreground">
                {freelancer.jobTitle}
              </span>
            ) : null}
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-4">
          <FreelancerAboutCard freelancer={freelancer} project={project} />
        </div>
      </CardContent>
    </Card>
  );
};

export default FreelancerInfoCard;
