import React, { memo } from "react";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const TalentItem = ({ name, role, avatar, status = "online", onClick }) => {
  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-300",
  };

  return (
    <li className="group flex cursor-pointer items-center gap-3" onClick={onClick}>
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <span
          className={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-background ${statusColors[status]}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{role}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground transition-colors group-hover:text-primary hover:text-primary"
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </li>
  );
};

export default memo(TalentItem);
