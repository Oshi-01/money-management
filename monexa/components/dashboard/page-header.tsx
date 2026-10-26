import type { ReactNode } from "react";

export function PageHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-header"><div><h1 className="page-title">{title}</h1><p className="page-description">{description}</p></div>{children && <div className="flex flex-wrap items-center gap-3">{children}</div>}</div>;
}
