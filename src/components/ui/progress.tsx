import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value between 0 and 100. */
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2 w-full overflow-hidden bg-muted rounded-none", className)}
        {...props}
      >
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-in-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = "Progress";

export { Progress };
