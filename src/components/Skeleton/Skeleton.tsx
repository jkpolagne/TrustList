import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width, height, className, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className ?? ""}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}
