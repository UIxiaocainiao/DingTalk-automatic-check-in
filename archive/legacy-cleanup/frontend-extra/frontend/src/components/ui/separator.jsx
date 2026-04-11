import { cn } from "../../lib/utils";

function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <div
      className={cn(
        "shrink-0 bg-[hsl(var(--border))]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
