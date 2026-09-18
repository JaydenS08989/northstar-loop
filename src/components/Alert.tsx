import type React from "react";
import { AlertCircle, CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/utils";

type AlertVariant = "info" | "success" | "warning" | "destructive";
type AlertProps = { title: string; content: React.ReactNode; variant?: AlertVariant; dismissible?: boolean; onDismiss?: () => void };
const Alert: React.FC<AlertProps> = ({ title, content, variant = "info", dismissible, onDismiss }) => {
  const Icon = { info: Info, success: CheckCircle2, warning: CircleAlert, destructive: AlertCircle }[variant];
  return <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", { "border-neutral-200 bg-neutral-50": variant === "info", "border-emerald-200 bg-emerald-50/50": variant === "success", "border-amber-200 bg-amber-50/60": variant === "warning", "border-red-200 bg-red-50/60": variant === "destructive" })} role={variant === "destructive" ? "alert" : "status"}><Icon className="mt-0.5 size-4 shrink-0" aria-hidden /><div className="min-w-0 flex-1"><p className="font-semibold text-neutral-950">{title}</p><div className="mt-1 text-neutral-700">{content}</div></div>{dismissible ? <button type="button" aria-label="Dismiss alert" onClick={onDismiss} className="rounded p-1 hover:bg-black/5"><X className="size-4" /></button> : null}</div>;
};
export default Alert;
