"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlertCircle,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function IssueInjector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pipeline/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        router.refresh();
        setTimeout(() => {
          setOpen(false);
          setTitle("");
          setDescription("");
          setSeverity("medium");
          setIsSuccess(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to inject issue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger >
        <Button variant="outline">
          <IconAlertCircle className="mr-2 h-4 w-4" />
          Inject Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inject Issue into Shared Memory</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <IconCheck className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium">Issue injected!</p>
            <p className="text-xs text-muted-foreground">
              Coder will read this on the next pipeline run.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Describe the issue... e.g. 'Deployment failed: connection pool exhausted'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <Select value={severity} onValueChange={(value: string | null) => setSeverity(value || "medium")}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <DialogClose >
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              !title.trim() || !description.trim() || isSubmitting
            }
          >
            {isSubmitting ? (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconAlertCircle className="mr-2 h-4 w-4" />
            )}
            Inject Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}