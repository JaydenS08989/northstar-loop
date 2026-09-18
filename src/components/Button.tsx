import type React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "destructive"; loading?: boolean };
const Button: React.FC<ButtonProps> = ({ className, variant = "primary", loading = false, disabled, children, ...props }) => {
  const variants = { primary: "bg-black text-white hover:bg-neutral-800", secondary: "border border-neutral-300 bg-white text-black hover:bg-neutral-50", ghost: "text-neutral-700 hover:bg-neutral-100", destructive: "bg-red-700 text-white hover:bg-red-800" } as const;
  return <button className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} disabled={disabled || loading} {...props}>{loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}{children}</button>;
};
export default Button;
