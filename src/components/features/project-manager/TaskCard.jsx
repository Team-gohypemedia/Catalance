import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar, MoreVertical, Edit2, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const priorityColors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-blue-100 text-blue-700",
};

export const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
    const isOverdue = task.deadline && new Date(task.deadline) < new Date();

    return (
        <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/50">
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm leading-tight text-foreground/90">
                        {task.title}
                    </h4>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(task)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task, "TO_DO")}>
                                Move to To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task, "IN_PROGRESS")}>
                                Move to In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task, "REVIEW")}>
                                Move to Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task, "DONE")}>
                                Move to Done
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs mt-2">
                    {task.deadline ? (
                        <div
                            className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                                }`}
                        >
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.deadline), "MMM d")}</span>
                        </div>
                    ) : (
                        <div className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>No Date</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
