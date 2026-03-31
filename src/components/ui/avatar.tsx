import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: keyof typeof sizes;
}

function Avatar({
  className,
  src,
  alt = "",
  initials,
  size = "default",
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const showImage = src && !imgError;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        sizes[size],
        className,
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-medium uppercase text-muted-foreground select-none">
          {initials ?? alt?.charAt(0) ?? "?"}
        </span>
      )}
    </span>
  );
}

Avatar.displayName = "Avatar";

export { Avatar };
