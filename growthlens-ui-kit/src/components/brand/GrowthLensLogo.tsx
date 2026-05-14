import { cn } from "../../lib/cn";

export type GrowthLensLogoProps = {
  variant?: "full" | "compact" | "product" | "horizontal" | "icon";
  productName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { icon: 34, text: "text-lg", sub: "text-[10px]" },
  md: { icon: 44, text: "text-2xl", sub: "text-xs" },
  lg: { icon: 72, text: "text-5xl", sub: "text-base" }
};

export function GrowthLensIcon({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" fill="none" role="img" aria-label="GrowthLens AI">
      <circle cx="48" cy="48" r="31" stroke="#E0F7FC" strokeWidth="12" />
      <path d="M76 29A34 34 0 0 0 20 67" stroke="#1E1B4B" strokeWidth="9" strokeLinecap="round" />
      <path d="M20 29A34 34 0 0 1 67 17" stroke="#1E1B4B" strokeWidth="9" strokeLinecap="round" />
      <path d="M15 52A34 34 0 0 0 32 79" stroke="#1E1B4B" strokeWidth="9" strokeLinecap="round" />
      <path d="M28 62L43 45L56 58L73 35" stroke="#06B6D4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M66 35H77V46" stroke="#22C55E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M56 58L73 35" stroke="#22C55E" strokeWidth="7" strokeLinecap="round" />
      <path d="M32 27A29 29 0 0 1 65 24" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
      <path d="M28 34A23 23 0 0 1 54 25" stroke="#B8F2FF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="78" cy="18" r="5" fill="#F8FAFC" stroke="#06B6D4" strokeWidth="3" />
      <circle cx="86" cy="38" r="5" fill="#F8FAFC" stroke="#06B6D4" strokeWidth="3" />
      <circle cx="67" cy="32" r="5" fill="#F8FAFC" stroke="#06B6D4" strokeWidth="3" />
      <path d="M72 28L76 23M73 34L81 37" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function GrowthLensLogo({ variant = "full", productName = "Campaign", size = "md", className }: GrowthLensLogoProps) {
  const scale = sizes[size];
  const compact = variant === "compact" || variant === "icon";
  const product = variant === "product";

  if (compact) {
    return (
      <div className={cn("inline-flex items-center justify-center", className)}>
        <GrowthLensIcon size={scale.icon} />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <GrowthLensIcon size={scale.icon} />
      <div className="leading-none">
        <div className={cn("font-display font-bold tracking-normal text-brand-navy", scale.text)}>
          {product ? (
            <>
              GrowthLens <span className="text-brand-green">{productName}</span>
            </>
          ) : (
            <>
              GrowthLens <span className="text-brand-cyan">AI</span>
            </>
          )}
        </div>
        <div className={cn("mt-1 font-medium tracking-normal text-slate-600", scale.sub)}>
          {product ? "by GrowthLens AI" : "Turn marketing data into revenue decisions."}
        </div>
      </div>
    </div>
  );
}

export function ProductLogo(props: Omit<GrowthLensLogoProps, "variant">) {
  return <GrowthLensLogo {...props} variant="product" />;
}

export function IconOnlyLogo(props: Omit<GrowthLensLogoProps, "variant">) {
  return <GrowthLensLogo {...props} variant="icon" />;
}

export function HorizontalLogo(props: Omit<GrowthLensLogoProps, "variant">) {
  return <GrowthLensLogo {...props} variant="horizontal" />;
}
