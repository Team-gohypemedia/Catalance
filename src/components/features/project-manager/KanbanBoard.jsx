import React, { useState } from "react";
import { format } from "date-fns";
import {
    Plus,
    MoreHorizontal,
    Loader2,
    Wand2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TaskCard } from "./TaskCard";

const BOARD_COLUMNS = [
    { id: "TO_DO", title: "To Do" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "REVIEW", title: "Review" },
    { id: "DONE", title: "Done" }
];

export const KanbanBoard = ({
    tasks,
    loading,
    onAddTask,
    onUpdateTask,
    onStatusChange,
    onGenerateTasks,
    generatingTasks
}) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "TO_DO",
        deadline: ""
    });

    const handleOpenTaskModal = (task = null, defaultCol = "TO_DO") => {
        if (task) {
            setEditingTask(task);
            setFormData({
                title: task.title,
                description: task.description || "",
                status: task.status,
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ""
            });
        } else {
            setEditingTask(null);
            setFormData({
                title: "",
                description: "",
                status: defaultCol,
                deadline: ""
            });
        }
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = () => {
        if (!formData.title.trim()) return;

        if (editingTask) {
            onUpdateTask(editingTask.id, formData);
        } else {
            onAddTask(formData);
        }
        setIsTaskModalOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold tracking-tight">Project Tasks</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onGenerateTasks}
                        disabled={loading || generatingTasks}
                        className="flex items-center gap-2"
                    >
                        {generatingTasks ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="h-4 w-4 text-primary" />
                        )}
                        Auto-Generate
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => handleOpenTaskModal()}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Task
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[500px]">
                {BOARD_COLUMNS.map(column => {
                    const columnTasks = tasks.filter(t => t.status === column.id);

                    return (
                        <div
                            key={column.id}
                            className="flex flex-col bg-muted/30 rounded-lg border border-border/50 overflow-hidden"
                        >
                            <div className="p-3 border-b border-border/50 bg-muted/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm">{column.title}</h4>
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                                        {columnTasks.length}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenTaskModal(null, column.id)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                                {loading ? (
                                    <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                ) : columnTasks.length === 0 ? (
                                    <div className="text-center p-4 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                                        No tasks
                                    </div>
                                ) : (
                                    columnTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onEdit={() => handleOpenTaskModal(task)}
                                            onStatusChange={(task, newStatus) => onStatusChange(task.id, newStatus)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="E.g. Setup database schema"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add more details about this task..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={val => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BOARD_COLUMNS.map(col => (
                                            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Deadline (Optional)</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTask} disabled={!formData.title.trim()}>
                            {editingTask ? "Save Changes" : "Create Task"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
