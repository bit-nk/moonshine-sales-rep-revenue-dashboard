import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import MoonlitBackground from "./MoonlitBackground";
import Sidebar from "./Sidebar";

interface Props {
  children: ReactNode;
  /** Max width of the content container; defaults to "max-w-7xl". */
  maxWidth?: string;
  /** Disable the padding / max-width wrapper around children. */
  bare?: boolean;
}

// Lets nested AppShell calls become pass-through. This is what enables Home
// to embed a full Page component (which uses its own <AppShell>) inline as a
// drilldown target without double-wrapping the sidebar + background.
const InShellContext = createContext(false);

/**
 * Page wrapper that paints the moonlit background, mounts the sidebar, and
 * leaves a 240 px left gutter for the main content.
 *
 * Idempotent: if a parent already rendered AppShell, this becomes a simple
 * pass-through that just sizes the content - no double sidebar.
 */
export default function AppShell({ children, maxWidth = "max-w-7xl", bare = false }: Props) {
  const insideShell = useContext(InShellContext);

  if (insideShell) {
    return bare ? <>{children}</> : (
      <div className={cn(maxWidth, "mx-auto")}>{children}</div>
    );
  }

  return (
    <InShellContext.Provider value={true}>
      <div className="min-h-screen relative" style={{ backgroundColor: "#070a1a" }}>
        <MoonlitBackground />
        <Sidebar />

        {/* Outer main reserves the 240 px sidebar gutter via padding (not
            margin, which mx-auto would override). The inner wrapper centers
            and caps the content width within the remaining space. */}
        <main className="relative z-10 pl-60 min-h-screen">
          {bare ? (
            children
          ) : (
            <div className={cn(maxWidth, "mx-auto px-6 py-10")}>{children}</div>
          )}
        </main>
      </div>
    </InShellContext.Provider>
  );
}
