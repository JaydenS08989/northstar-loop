import type React from "react";
type FormFieldProps = { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode };
const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, error, hint, children }) => <div className="flex flex-col gap-2"><label className="text-sm font-medium" htmlFor={htmlFor}>{label}</label>{children}{hint && !error ? <p className="text-xs text-neutral-500">{hint}</p> : null}{error ? <p className="text-xs text-red-700" role="alert">{error}</p> : null}</div>;
export default FormField;
