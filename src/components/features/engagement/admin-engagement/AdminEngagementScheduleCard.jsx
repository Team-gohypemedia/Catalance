import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAILY_SET_SIZE, statusClassName } from "./shared";

const AdminEngagementScheduleCard = ({
  scheduleDayKey,
  setScheduleDayKey,
  scheduleStatus,
  setScheduleStatus,
  scheduledQuestionIds,
  selectedDailySet,
  scheduleLoading,
  approvedQuestions,
  toggleScheduledQuestion,
  handleSaveDailySet,
  scheduleSaving,
  dailySets,
}) => (
  <Card id="contest-feed" className="border-white/10 bg-card">
    <CardHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-xl">Calendar Daily Set</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a date and assign the exact approved questions freelancers should see on that day.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="grid gap-2">
            <Label htmlFor="growth-quest-day-key">Date</Label>
            <Input
              id="growth-quest-day-key"
              type="date"
              value={scheduleDayKey}
              onChange={(event) => setScheduleDayKey(event.target.value)}
              className="w-full sm:w-48"
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={scheduleStatus} onValueChange={setScheduleStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge className="border-primary/20 bg-primary/10 text-primary">
          Selected {scheduledQuestionIds.length}/{DAILY_SET_SIZE}
        </Badge>
        {selectedDailySet ? (
          <Badge className={statusClassName[selectedDailySet.status] || statusClassName.DRAFT}>
            Existing set: {selectedDailySet.status}
          </Badge>
        ) : (
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            No set saved for this date yet
          </Badge>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-md border border-white/10">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium">Approved Questions</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Only approved questions can be scheduled to a calendar date.
            </p>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            {scheduleLoading ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading approved questions
              </div>
            ) : approvedQuestions.length === 0 ? (
              <div className="h-24 content-center text-center text-sm text-muted-foreground">
                No approved questions available.
              </div>
            ) : (
              <div className="space-y-3">
                {approvedQuestions.map((question) => {
                  const checked = scheduledQuestionIds.includes(question.id);
                  return (
                    <label
                      key={question.id}
                      className="flex cursor-pointer gap-3 rounded-lg border border-white/10 bg-background/40 p-3 transition-colors hover:border-primary/20"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleScheduledQuestion(question.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium">{question.questionText}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{question.categoryLabel}</span>
                          <span>{question.difficulty}</span>
                          <span>Correct: {question.correctOptionId}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-white/10 p-4">
            <p className="text-sm font-medium">Selected for {scheduleDayKey}</p>
            <div className="mt-3 space-y-3">
              {scheduledQuestionIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Choose {DAILY_SET_SIZE} approved questions to build this day&apos;s set.
                </p>
              ) : (
                scheduledQuestionIds.map((questionId, index) => {
                  const question = approvedQuestions.find((entry) => entry.id === questionId);
                  return (
                    <div
                      key={questionId}
                      className="rounded-lg border border-white/10 bg-background/40 p-3"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Slot {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {question?.questionText || questionId}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={handleSaveDailySet}
              disabled={scheduleSaving || scheduleLoading}
            >
              {scheduleSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Daily Set
            </Button>
          </div>

          <div className="rounded-md border border-white/10 p-4">
            <p className="text-sm font-medium">Upcoming Scheduled Dates</p>
            <div className="mt-3 space-y-3">
              {dailySets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled calendar dates saved yet.</p>
              ) : (
                dailySets.slice(0, 8).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setScheduleDayKey(entry.dayKey)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-background/40 px-3 py-3 text-left transition-colors hover:border-primary/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.dayKey}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.questionCount} questions • {entry.generatedBy}
                      </p>
                    </div>
                    <Badge className={statusClassName[entry.status] || statusClassName.DRAFT}>
                      {entry.status}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminEngagementScheduleCard;
