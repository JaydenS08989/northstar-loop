import type React from "react";
import { cn } from "@/utils";
type BadgeProps = { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" };
const Badge: React.FC<BadgeProps> = ({ children, tone = "neutral" }) => <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", { "border-neutral-200 bg-neutral-50 text-neutral-700": tone === "neutral", "border-emerald-200 bg-emerald-50 text-emerald-800": tone === "success", "border-amber-200 bg-amber-50 text-amber-900": tone === "warning", "border-red-200 bg-red-50 text-red-800": tone === "danger" })}>{children}</span>;
export default Badge;
