import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { toast } from "sonner";
import { pmApi } from "@/modules/project-manager/services/pm-api";
import { useAuth } from "@/shared/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";

export function SopEditorDialog({ open, onOpenChange, project, currentSop, onSaved }) {
  const { authFetch } = useAuth();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");
  
  // Clone the SOP so we can edit it freely
  const [phases, setPhases] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (open && currentSop) {
      setPhases(JSON.parse(JSON.stringify(currentSop.phases || [])));
      setTasks(JSON.parse(JSON.stringify(currentSop.tasks || [])));
    }
  }, [open, currentSop]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await pmApi.updateProjectSop(authFetch, project.id, { phases, tasks });
      toast.success("SOP updated successfully");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || "Failed to save SOP");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiInstructions.trim()) {
      toast.error("Please enter some instructions for the AI.");
      return;
    }
    setGenerating(true);
    try {
      const response = await pmApi.generateProjectSop(authFetch, {
        projectContext: project || {},
        currentSop: { phases, tasks },
        instructions: aiInstructions,
      });
      if (response?.sop) {
        setPhases(response.sop.phases || []);
        setTasks(response.sop.tasks || []);
        toast.success("AI updated the SOP successfully!");
        setAiInstructions("");
      } else {
        toast.error("Failed to generate SOP with AI.");
      }
    } catch (err) {
      toast.error(err.message || "Error generating SOP with AI");
    } finally {
      setGenerating(false);
    }
  };

  const addPhase = () => {
    const nextId = String(Math.max(0, ...phases.map(p => Number(p.id) || 0)) + 1);
    setPhases([...phases, { id: nextId, name: `Phase ${nextId}`, status: "pending", progress: 0, timeline: "" }]);
  };

  const addTask = (phaseId) => {
    const nextId = `custom-${Date.now()}`;
    setTasks([...tasks, { id: nextId, title: "New Task", phase: phaseId, status: "pending", timeline: "", assignedRole: "" }]);
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t));
  };

  const updatePhase = (phaseId, field, value) => {
    setPhases(phases.map(p => p.id === phaseId ? { ...p, [field]: value } : p));
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const removePhase = (phaseId) => {
    setPhases(phases.filter(p => p.id !== phaseId));
    setTasks(tasks.filter(t => t.phase !== phaseId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project SOP & Timelines</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-orange-800">
            <Sparkles className="h-4 w-4 text-orange-600" />
            <span>Edit SOP with AI</span>
          </div>
          <Textarea 
            placeholder="Tell AI how to adjust the SOP based on project requirements (e.g. 'Add a specific QA phase' or 'Make it 5 phases for e-commerce')"
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            className="text-sm border-orange-200 bg-white placeholder:text-slate-400 min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleGenerateAi} 
              disabled={generating || !aiInstructions.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-sm"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
              {generating ? "Generating..." : "Apply AI Edit"}
            </Button>
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {phases.map((phase) => (
            <div key={phase.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-rose-500 hover:bg-rose-50"
                onClick={() => removePhase(phase.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4 mb-4 pr-10">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phase Name</label>
                  <Input 
                    value={phase.name} 
                    onChange={e => updatePhase(phase.id, "name", e.target.value)}
                    className="mt-1 font-semibold"
                  />
                </div>
                <div className="w-48">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phase Deadline</label>
                  <div className="relative">
                    <Input 
                      type="date"
                      value={phase.timeline || ""} 
                      onChange={e => updatePhase(phase.id, "timeline", e.target.value)}
                      className="mt-1 block w-full [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                {tasks.filter(t => t.phase === phase.id).map(task => (
                  <div key={task.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                    <Input 
                      className="flex-1" 
                      value={task.title} 
                      onChange={e => updateTask(task.id, "title", e.target.value)}
                    />
                    <div className="relative">
                      <Input 
                        type="date"
                        className="w-40 block [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                        value={task.timeline || ""} 
                        onChange={e => updateTask(task.id, "timeline", e.target.value)}
                      />
                    </div>
                    <select 
                      className="flex h-10 w-36 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={task.assignedRole || ""}
                      onChange={e => updateTask(task.id, "assignedRole", e.target.value)}
                    >
                      <option value="">Default Role</option>
                      <option value="CLIENT">Client</option>
                      <option value="FREELANCER">Freelancer</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => addTask(phase.id)}>
                  <Plus className="mr-1 h-3 w-3" /> Add Task
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full border-dashed" onClick={addPhase}>
            <Plus className="mr-2 h-4 w-4" /> Add New Phase
          </Button>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#D9692A] hover:bg-[#B85A24] text-white">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
