import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex h-10 w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent", className)} {...props} />;
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("flex min-h-[80px] w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent", className)} {...props} />;
}
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium text-muted", className)} {...props} />;
}
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("flex h-10 w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent", className)} {...props} />;
}
