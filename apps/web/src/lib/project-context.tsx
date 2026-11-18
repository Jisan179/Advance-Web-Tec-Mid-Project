"use client";

/**
 * project-context.tsx
 * Provides ProjectContext shared across all [projectId] child pages.
 * - useProject(): access current project data and reload
 * - isEngineer(role): returns true for LEAD or DEVELOPER role
 */
import { createContext, useContext } from "react";
import type { Project, Role } from "./types";

interface ProjectContextValue {
  project: Project;
  role: Role;
  reload: () => void;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside a project page");
  return ctx;
}

export const isEngineer = (role: Role) => role === "LEAD" || role === "DEVELOPER";
