import Check from "lucide-react/dist/esm/icons/check";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Upload from "lucide-react/dist/esm/icons/upload";
import UserRound from "lucide-react/dist/esm/icons/user-round";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fieldLabelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground";
const inputClassName =
  "h-14 rounded-2xl border-white/8 bg-accent px-5 text-base text-white shadow-none placeholder:text-muted-foreground/55 focus-visible:border-[#facc15]/45 focus-visible:ring-[#facc15]/15";
const selectTriggerClassName =
  "h-14 w-full rounded-2xl border-white/8 bg-accent px-5 text-left text-base text-white shadow-none data-[placeholder]:text-muted-foreground/55 focus-visible:border-[#facc15]/45 focus-visible:ring-[#facc15]/15";
const textAreaClassName =
  "min-h-[164px] rounded-[22px] border-white/8 bg-accent px-5 py-4 text-base text-white shadow-none placeholder:text-muted-foreground/45 focus-visible:border-[#facc15]/45 focus-visible:ring-[#facc15]/15";

const FreelancerBasicProfileSlide = ({
  slide,
  basicProfileForm,
  onBasicProfileFieldChange,
}) => {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[3.2rem] lg:leading-[1.04]">
            {slide.title}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {slide.description}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-card px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="space-y-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative">
                <Avatar className="size-28 border-4 border-white/80 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] sm:size-32">
                  <AvatarFallback className="bg-white text-[#171717]">
                    <UserRound className="size-14" />
                  </AvatarFallback>
                  <AvatarBadge className="bottom-1 right-0 size-9 border-[3px] border-card bg-[#facc15] text-black ring-0 [&>svg]:size-4 sm:size-10">
                    <Pencil className="size-4" />
                  </AvatarBadge>
                </Avatar>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl border-[#facc15] bg-transparent px-6 text-sm font-semibold text-[#facc15] shadow-none hover:bg-[#facc15]/10 hover:text-[#facc15]"
              >
                <Upload className="size-4" />
                Upload
              </Button>
            </div>

            <div className="space-y-3">
              <Label className={fieldLabelClassName}>Username</Label>
              <div className="relative">
                <Input
                  value={basicProfileForm.username}
                  onChange={(event) =>
                    onBasicProfileFieldChange("username", event.target.value)
                  }
                  placeholder="artisan_max"
                  className={`${inputClassName} pr-14`}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#facc15] text-black">
                  <Check className="size-4" />
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={fieldLabelClassName}>Profile Details</Label>
              <Textarea
                value={basicProfileForm.profileDetails}
                onChange={(event) =>
                  onBasicProfileFieldChange("profileDetails", event.target.value)
                }
                placeholder="Tell us about your background, expertise, and what makes you unique..."
                className={textAreaClassName}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className={fieldLabelClassName}>Country</Label>
                <Select
                  value={basicProfileForm.country}
                  onValueChange={(value) =>
                    onBasicProfileFieldChange("country", value)
                  }
                >
                  <SelectTrigger className={selectTriggerClassName}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {slide.countryOptions.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className={fieldLabelClassName}>State / Province</Label>
                <Select
                  value={basicProfileForm.state}
                  onValueChange={(value) =>
                    onBasicProfileFieldChange("state", value)
                  }
                >
                  <SelectTrigger className={selectTriggerClassName}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {slide.stateOptions.map((stateOption) => (
                      <SelectItem key={stateOption} value={stateOption}>
                        {stateOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={fieldLabelClassName}>Select Language</Label>
              <Select
                value={basicProfileForm.language}
                onValueChange={(value) =>
                  onBasicProfileFieldChange("language", value)
                }
              >
                <SelectTrigger className={selectTriggerClassName}>
                  <SelectValue placeholder="select language" />
                </SelectTrigger>
                <SelectContent>
                  {slide.languageOptions.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerBasicProfileSlide;
