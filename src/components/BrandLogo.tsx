import Image from "next/image";

/**
 * The A2000 logo, served as-is (no image-optimiser round trip) and preloaded
 * so it appears with the first paint. Designed for light backgrounds.
 */
export default function BrandLogo({ height = 40, className = "" }: { height?: number; className?: string }) {
  // Source asset is 179 × 56.
  const width = Math.round((179 / 56) * height);
  return (
    <Image
      src="/a2000-logo-cropped.png"
      alt="A2000 — We are about solutions"
      width={width}
      height={height}
      priority
      unoptimized
      className={`select-none ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
