import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface VibeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal";
}

const logoSizeMap = {
  sm: "sm" as const,
  md: "sm" as const,
  lg: "md" as const,
};

const textClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export function VibeLogo({
  className,
  size = "md",
  variant = "default",
}: VibeLogoProps) {
  return (
    <div
      className={cn("font-poppins group flex items-center gap-2", className)}
    >
      <Logo size={logoSizeMap[size]} className="text-primary" />
      {variant === "default" && (
        <div
          className={cn(
            "flex items-center leading-none font-bold tracking-tight",
            textClasses[size],
          )}
        >
          <span className="text-foreground">Paper</span>
          <span className="text-foreground/40 ml-1 font-medium">Cast</span>
        </div>
      )}
    </div>
  );
}
