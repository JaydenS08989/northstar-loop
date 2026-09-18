import type React from "react";
import { cn } from "@/utils";
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => <textarea className={cn("min-h-28 w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10", className)} {...props} />;
export default Textarea;
