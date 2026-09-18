import type React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
type AppShellProps = { title: string; children: React.ReactNode };
const AppShell: React.FC<AppShellProps> = ({ title, children }) => <div className="min-h-screen bg-neutral-50 text-neutral-950"><div className="flex min-h-screen"><Sidebar /><div className="min-w-0 flex-1"><Topbar title={title} /><main className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</main></div></div></div>;
export default AppShell;
