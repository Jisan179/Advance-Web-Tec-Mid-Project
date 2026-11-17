"use client";

import { useState, type ReactNode } from "react";
import { Button, Modal } from "@/components/ui";

export function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-muted">
      {children}
    </p>
  );
}

export function PreviewDialog({
  title,
  label,
  icon,
  children,
}: {
  title: string;
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <Modal open={open} title={title} onClose={() => setOpen(false)}>
        <PreviewNotice>
          Design preview. This form does not send or save data.
        </PreviewNotice>
        <fieldset disabled className="mt-4 space-y-4">
          {children}
        </fieldset>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled>
            {label}
          </Button>
        </div>
      </Modal>
    </>
  );
}
