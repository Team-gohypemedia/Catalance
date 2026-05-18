import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusClassName } from "./shared";

const AdminEngagementUserDailyHistoryCard = ({
  userDailyHistory,
  userDailyHistoryLoading,
  userDailyHistorySearch,
  setUserDailyHistorySearch,
  userDailyHistoryDayKey,
  setUserDailyHistoryDayKey,
}) => (
  <Card className="border-white/10 bg-card">
    <CardHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="text-xl">Profile-Based Daily AI Sets</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the saved five-question AI sets generated from each freelancer profile.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userDailyHistorySearch}
              onChange={(event) => setUserDailyHistorySearch(event.target.value)}
              placeholder="Search freelancer or question..."
              className="pl-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-daily-history-day">Date</Label>
            <Input
              id="user-daily-history-day"
              type="date"
              value={userDailyHistoryDayKey}
              onChange={(event) => setUserDailyHistoryDayKey(event.target.value)}
              className="w-full sm:w-48"
            />
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/[0.05] hover:bg-transparent">
              <TableHead className="px-6">Freelancer</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Profile Focus</TableHead>
              <TableHead className="px-6">Questions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userDailyHistoryLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                  Loading profile-based AI sets
                </TableCell>
              </TableRow>
            ) : userDailyHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  No saved daily AI sets found for this filter yet.
                </TableCell>
              </TableRow>
            ) : (
              userDailyHistory.map((entry) => (
                <TableRow key={entry.id} className="border-white/[0.05]">
                  <TableCell className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{entry.userName || "Freelancer"}</p>
                      <p className="text-xs text-muted-foreground">{entry.userEmail || entry.userId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        entry.generationSource === "ai"
                          ? statusClassName.APPROVED
                          : statusClassName.DRAFT
                      }
                    >
                      {entry.generationSource}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="text-sm font-medium text-white">
                      {entry.profileSnapshot?.serviceTitle ||
                        entry.profileSnapshot?.serviceCategory ||
                        entry.profileSnapshot?.services?.[0] ||
                        "General freelancer profile"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.dayKey}</p>
                  </TableCell>
                  <TableCell className="max-w-[520px] px-6">
                    <div className="space-y-2 py-4">
                      {(Array.isArray(entry.questionSnapshots) ? entry.questionSnapshots : [])
                        .slice(0, 5)
                        .map((question, index) => (
                          <div key={`${entry.id}-${question.id || index}`} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                            <p className="text-sm font-medium text-white">{question.questionText}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {question.focusReason || question.categoryLabel || "Profile-based question"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

export default AdminEngagementUserDailyHistoryCard;
