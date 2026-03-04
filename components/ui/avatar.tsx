import { cn } from "@/lib/utils";
import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; className: string }> = {
  sm: { px: 28, className: "h-7 w-7 text-xs" },
  md: { px: 36, className: "h-9 w-9 text-sm" },
  lg: { px: 48, className: "h-12 w-12 text-base" },
  xl: { px: 80, className: "h-20 w-20 text-xl" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { px, className: sizeClass } = sizeMap[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-surface-hover",
        sizeClass,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "User avatar"}
          width={px}
          height={px}
          className="object-cover"
        />
      ) : (
        <span className="font-semibold text-text-secondary">
          {name ? getInitials(name) : "?"}
        </span>
      )}
    </div>
  );
}
