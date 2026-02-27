import { memo } from "react";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EditProposalDialog = ({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  onSaveChanges,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit2 className="w-5 h-5" />
          Edit Proposal
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1">
        <div>
          <label className="text-sm font-medium mb-1 block">Project Title</label>
          <Input
            value={editForm.title}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Project title"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Summary / Description
          </label>
          <Textarea
            value={editForm.summary}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                summary: e.target.value,
              }))
            }
            placeholder="Project description"
            rows={6}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Budget</label>
            <Input
              value={editForm.budget}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  budget: e.target.value,
                }))
              }
              placeholder="e.g. Rs 30,000"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Timeline</label>
            <Input
              value={editForm.timeline}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  timeline: e.target.value,
                }))
              }
              placeholder="e.g. 2 weeks"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onSaveChanges}>
          <CheckCircle className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default memo(EditProposalDialog);
