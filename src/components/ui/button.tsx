import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 min-h-[40px] px-4",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-accent/90",
        secondary: "bg-card text-primary border border-border hover:bg-panel",
        outline: "border border-border bg-transparent hover:bg-card text-primary",
        ghost: "hover:bg-card text-muted hover:text-primary",
        destructive: "bg-red-600 text-white hover:bg-red-500",
      },
      size: { default: "h-10 px-4", sm: "h-9 px-3 text-xs", lg: "h-11 px-6", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(variants({ variant, size }), className)} {...props} />;
}
