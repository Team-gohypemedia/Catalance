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

const AdminEngagementPersonalizedHistoryCard = ({
  personalizedHistory,
  personalizedHistoryLoading,
  personalizedHistorySearch,
  setPersonalizedHistorySearch,
  personalizedHistoryDayKey,
  setPersonalizedHistoryDayKey,
}) => (
  <Card className="border-white/10 bg-card">
    <CardHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="text-xl">Personalized Question History</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the saved daily personalized questions generated for freelancers.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={personalizedHistorySearch}
              onChange={(event) => setPersonalizedHistorySearch(event.target.value)}
              placeholder="Search freelancer or question..."
              className="pl-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="personalized-history-day">Date</Label>
            <Input
              id="personalized-history-day"
              type="date"
              value={personalizedHistoryDayKey}
              onChange={(event) => setPersonalizedHistoryDayKey(event.target.value)}
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
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Focus</TableHead>
              <TableHead className="px-6">Question</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personalizedHistoryLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                  Loading personalized history
                </TableCell>
              </TableRow>
            ) : personalizedHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No personalized questions saved for this filter yet.
                </TableCell>
              </TableRow>
            ) : (
              personalizedHistory.map((entry) => (
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
                  <TableCell>{entry.categoryLabel}</TableCell>
                  <TableCell>{entry.difficulty}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {entry.focusReason || "No focus note"}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[420px] px-6">
                    <p className="line-clamp-2 text-sm font-medium text-white">
                      {entry.questionText}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.dayKey}</p>
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

export default AdminEngagementPersonalizedHistoryCard;
