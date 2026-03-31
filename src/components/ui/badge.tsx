import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-muted text-foreground",
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  danger: "bg-danger/10 text-danger border border-danger/20",
  outline: "bg-transparent border border-border text-foreground",
} as const;

const sizes = {
  sm: "px-1.5 py-0.5 text-xs",
  default: "px-2.5 py-0.5 text-xs",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

Badge.displayName = "Badge";

export { Badge };
