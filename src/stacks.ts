export type StackKind = "computer" | "folder-hardware" | "folder-software" | "wiring" | "hammer" | "toolbox" | "warning" | "folder-projects";

export interface StackDefinition {
  title: string;
  file: string;
  kind: StackKind;
  sections?: string[];
}

export const STACKS: StackDefinition[] = [
  { title: "Meet PiForma", file: "README.md", kind: "computer", sections: ["Macintosh PiForma", "What it does", "Why this exists", "Project status"] },
  { title: "Hardware", file: "docs/hardware.md", kind: "folder-hardware" },
  { title: "Software", file: "docs/software.md", kind: "folder-software", sections: ["Software", "System", "Current graphical stack", "Boot flow", "Desktop look", "Apple logo gesture button", "Volume knob", "Included apps and launchers"] },
  { title: "Wiring", file: "docs/wiring.md", kind: "wiring" },
  { title: "Build Log", file: "docs/build-log.md", kind: "hammer" },
  { title: "Maintenance", file: "docs/maintenance.md", kind: "toolbox" },
  { title: "Known Issues", file: "docs/known-issues.md", kind: "warning" },
  { title: "Related Projects", file: "docs/related-projects.md", kind: "folder-projects" }
];
