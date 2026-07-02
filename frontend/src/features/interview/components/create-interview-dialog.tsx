"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { createInterview } from "../api";
import {
  createInterviewSchema,
  type CreateInterviewInput,
  type CreateInterviewOutput,
} from "../schema";
import type { Interview } from "../types";

interface CreateInterviewDialogProps {
  onCreated: (interview: Interview) => void;
}

export function CreateInterviewDialog({ onCreated }: CreateInterviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInterviewInput, unknown, CreateInterviewOutput>({
    resolver: zodResolver(createInterviewSchema),
  });

  async function onSubmit(values: CreateInterviewOutput) {
    setLoading(true);
    try {
      const interview = await createInterview(values);
      onCreated(interview);
      toast.success("Interview created");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error("Failed to create interview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Interview
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Interview</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Frontend Round 1" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled At</Label>
            <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
            {errors.scheduledAt && (
              <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}