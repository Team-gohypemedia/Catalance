import { useEffect, useState } from "react";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Check from "lucide-react/dist/esm/icons/check";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import X from "lucide-react/dist/esm/icons/x";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ClientAboutCard = ({ client, project, onUpdateLink }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [linkValue, setLinkValue] = useState(project?.externalLink || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLinkValue(project?.externalLink || "");
  }, [project?.externalLink]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateLink(linkValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update link", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLinkValue(project?.externalLink || "");
    setIsEditing(false);
  };

  if (!client) return null;

  const displayLink = project?.externalLink || client?.portfolio;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">About</h3>

      <div className="space-y-2.5">
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={linkValue}
                  onChange={(event) => setLinkValue(event.target.value)}
                  className="h-9 border-white/[0.08] bg-[#111111] pl-9 text-sm text-white"
                  placeholder="https://project-link.com"
                  autoFocus
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="group relative min-h-6 flex items-center">
              {displayLink ? (
                <a
                  href={displayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 break-all pr-8 text-sm font-medium text-primary hover:underline"
                >
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {displayLink.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4 shrink-0" />
                  <span>No project link</span>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(event) => {
                  event.preventDefault();
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientInfoCard = ({
  client,
  project,
  onUpdateLink,
  panelClassName,
  eyebrowClassName,
}) => {
  if (!client) return null;

  return (
    <Card className={panelClassName}>
      <CardHeader className="pb-3">
        <CardTitle className={eyebrowClassName}>Client Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border border-white/[0.08] bg-[#111111]">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="bg-[#111111] text-white">
              {(client.fullName || "C").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">
                {client.fullName || "Client Name"}
              </span>
              {client.isVerified ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 text-blue-500"
                  fill="currentColor"
                  stroke="white"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <ClientAboutCard
            client={client}
            project={project}
            onUpdateLink={onUpdateLink}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfoCard;
