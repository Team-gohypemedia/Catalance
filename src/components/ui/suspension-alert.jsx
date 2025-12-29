"use client";

import React, { useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

/**
 * SuspensionAlert - Shows a warning popup when user account is suspended
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Callback when dialog open state changes
 * @param {string|Date} props.suspendedAt - When the account was suspended
 */
export const SuspensionAlert = ({ open, onOpenChange, suspendedAt }) => {
  const daysRemaining = useMemo(() => {
    if (!suspendedAt) return 90;
    
    const suspendedDate = new Date(suspendedAt);
    const now = new Date();
    const diffTime = now.getTime() - suspendedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 90 - diffDays);
  }, [suspendedAt]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Account Suspended</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base">
            Your account has been suspended by an administrator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 my-2">
          <p className="text-sm text-foreground">
            <strong>⚠️ Important:</strong> You have{" "}
            <span className="font-bold text-destructive">{daysRemaining} days</span>{" "}
            remaining to verify your account. If you do not take action, your account will be{" "}
            <strong>permanently deleted</strong>.
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Please contact our support team if you believe this was a mistake or would like to appeal this decision.
        </p>
        
        <AlertDialogFooter>
          <AlertDialogAction>I Understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SuspensionAlert;
