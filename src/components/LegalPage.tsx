import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-muted">Dernière mise à jour : {updated}</p>
      <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_p]:text-muted [&_li]:text-muted [&_a]:text-accent [&_a:hover]:underline">
        {children}
      </div>
    </div>
  );
}
