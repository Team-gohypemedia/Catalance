import Check from "lucide-react/dist/esm/icons/check";
import Edit from "lucide-react/dist/esm/icons/edit";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_OPTIONS, statusClassName } from "./shared";

const AdminEngagementQuestionBank = ({
  search,
  setSearch,
  status,
  setStatus,
  counts,
  loading,
  questions,
  actionLoading,
  openEditDialog,
  handleApprove,
  handleReject,
}) => (
  <Card className="border-white/10 bg-card">
    <CardHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="text-xl">Question Bank</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions..."
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, value]) => (
          <Badge key={key} className={statusClassName[key] || statusClassName.DRAFT}>
            {key.replace(/_/g, " ")}: {value}
          </Badge>
        ))}
      </div>
      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading questions
                  </span>
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No questions found.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-[520px]">
                    <p className="line-clamp-2 font-medium">{question.questionText}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Correct: {question.correctOptionId}
                    </p>
                  </TableCell>
                  <TableCell>{question.categoryLabel}</TableCell>
                  <TableCell>{question.difficulty}</TableCell>
                  <TableCell>
                    <Badge
                      className={statusClassName[question.status] || statusClassName.DRAFT}
                    >
                      {question.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Edit"
                        onClick={() => openEditDialog(question)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      {question.status !== "APPROVED" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Approve"
                          disabled={actionLoading === `approve-${question.id}`}
                          onClick={() => handleApprove(question.id)}
                        >
                          <Check className="size-4 text-emerald-300" />
                        </Button>
                      ) : null}
                      {question.status !== "REJECTED" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Reject"
                          disabled={actionLoading === `reject-${question.id}`}
                          onClick={() => handleReject(question.id)}
                        >
                          <X className="size-4 text-red-300" />
                        </Button>
                      ) : null}
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

export default AdminEngagementQuestionBank;
