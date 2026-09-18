import { format, parseISO } from "date-fns";
export const formatDate = (value: string | null) => (value ? format(parseISO(value), "MMM d, yyyy") : "No date");
