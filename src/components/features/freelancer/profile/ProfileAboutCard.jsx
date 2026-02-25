import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ProfileAboutCard = ({ bioText, openEditPersonalModal }) => {
  return (
    <Card className="group rounded-2xl border border-border/60 border-l-2 border-l-primary/50 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          About
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
          onClick={openEditPersonalModal}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <p
        className="mt-3 text-base leading-relaxed text-foreground/85"
        style={{ textWrap: "pretty" }}
      >
        {bioText ||
          "Add your professional summary so clients understand your strengths quickly."}
      </p>
    </Card>
  );
};

export default ProfileAboutCard;
