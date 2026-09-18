import type React from "react";
import { cn } from "@/utils";
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => <div className={cn("rounded-xl border border-neutral-200 bg-white p-5 md:p-6", className)} {...props} />;
export default Card;
