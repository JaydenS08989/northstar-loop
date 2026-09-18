import type React from "react";
import { cn } from "@/utils";
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => <input className={cn("min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-neutral-100", className)} {...props} />;
export default Input;
