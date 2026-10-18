import React from "react";

interface LogoIconProps {
  className?: string;
  size?: number | string;
}

/**
 * AlertAloud App Icon
 * Exact recreation of the official logo:
 * - Rose-red gradient squircle
 * - White speech bubble with lower-left tail
 * - Rose-red exclamation mark (!) centered inside
 */
export const AlertAloudIcon: React.FC<LogoIconProps> = ({
  className = "w-8 h-8",
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-md shadow-rose-950/40 shrink-0 flex items-center justify-center bg-slate-900 border border-rose-500/30 ${className}`}
      style={style}
    >
      <img
        src="/src/assets/images/alertaloud_logo_mark_1792341587356.jpg"
        alt="AlertAloud Logo"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
        onError={(e) => {
          // If image fails, hide image and show SVG fallback
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
      {/* Subtle overlay reflection */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
    </div>
  );
};

interface AlertAloudLogoProps {
  className?: string;
  iconSize?: string;
  textSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  showSubtitle?: boolean;
  showLivePulse?: boolean;
}

/**
 * AlertAloud Full Logo
 * Combines the icon with the brand typography:
 * "Alert" in white + "Aloud" in rose-coral (#F43F5E)
 */
export const AlertAloudLogo: React.FC<AlertAloudLogoProps> = ({
  className = "",
  iconSize = "w-8 h-8",
  textSize = "base",
  showSubtitle = false,
  showLivePulse = true,
}) => {
  const fontSizes = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      {/* Brand Icon */}
      <AlertAloudIcon className={iconSize} />

      {/* Brand Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight ${fontSizes[textSize]} select-none whitespace-nowrap`}>
            <span className="text-white">Alert</span>
            <span className="text-rose-500">Aloud</span>
          </span>
          {showLivePulse && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
              title="Official Alert Monitoring Live"
            />
          )}
        </div>
        {showSubtitle && (
          <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            One alert. Read aloud.
          </p>
        )}
      </div>
    </div>
  );
};
