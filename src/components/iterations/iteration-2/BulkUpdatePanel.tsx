"use client";

import { useEffect, useState } from "react";
import { REV_RADIUS } from "../iteration-1/tokens";
import { Drawer, RevButton } from "./Drawer";
import type { BulkUpdateValues } from "./engine";

const inputStyle: React.CSSProperties = {
  background: "var(--rev-surface-low)",
  border: "1px solid var(--rev-input-border)",
  borderRadius: REV_RADIUS.sm,
  color: "var(--rev-text-hi)",
};

/**
 * Bulk update drawer (PRD: edit campaign name / commission / start / end on N
 * selected rules). Each field has an "edit this field" toggle — only ticked fields
 * are sent, so untouched fields are left as-is across the selection.
 */
export function BulkUpdatePanel({
  open,
  count,
  onClose,
  onSubmit,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onSubmit: (values: BulkUpdateValues) => void;
}) {
  const [editName, setEditName] = useState(false);
  const [editRate, setEditRate] = useState(false);
  const [editStart, setEditStart] = useState(false);
  const [editEnd, setEditEnd] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setEditName(false);
      setEditRate(false);
      setEditStart(false);
      setEditEnd(false);
      setName("");
      setRate("");
      setStart("");
      setEnd("");
      setTouched(false);
    }
  }, [open]);

  const rateNum = rate === "" ? NaN : Number(rate);
  const rateValid = !editRate || (!Number.isNaN(rateNum) && rateNum >= 0 && rateNum <= 99.99);
  const anyField = editName || editRate || editStart || editEnd;
  const errors: string[] = [];
  if (!anyField) errors.push("Tick at least one field to update.");
  if (editName && !name.trim()) errors.push("Campaign name can't be empty.");
  if (editRate && !rateValid) errors.push("Commission rate must be between 0 and 99.99%.");
  const canSubmit = errors.length === 0;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    const values: BulkUpdateValues = {};
    if (editName) values.name = name.trim();
    if (editRate) values.commission_rate = Number(rateNum.toFixed(2));
    if (editStart) values.start_date = start || null;
    if (editEnd) values.end_date = end || null;
    onSubmit(values);
  };

  const Row = ({
    on,
    setOn,
    label,
    children,
  }: {
    on: boolean;
    setOn: (v: boolean) => void;
    label: string;
    children: React.ReactNode;
  }) => (
    <div
      className="flex flex-col gap-2 px-3 py-3"
      style={{
        border: "1px solid var(--rev-border)",
        borderRadius: REV_RADIUS.sm,
        background: on ? "var(--rev-surface-low)" : "var(--rev-surface-mid)",
      }}
    >
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="h-4 w-4" />
        {label}
      </label>
      {on && children}
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Bulk update rules"
      subtitle={`Applying changes to ${count} selected rule${count === 1 ? "" : "s"}.`}
      width={440}
      footer={
        <>
          <RevButton variant="secondary" onClick={onClose}>
            Cancel
          </RevButton>
          <RevButton variant="primary" onClick={submit} disabled={!canSubmit}>
            Update {count} rule{count === 1 ? "" : "s"}
          </RevButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Row on={editName} setOn={setEditName} label="Campaign name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New campaign name"
            className="w-full px-3 py-2 text-sm"
            style={inputStyle}
          />
        </Row>
        <Row on={editRate} setOn={setEditRate} label="Commission rate (%)">
          <input
            type="number"
            step="0.01"
            min={0}
            max={99.99}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.00"
            className="w-32 px-3 py-2 text-sm"
            style={inputStyle}
          />
        </Row>
        <Row on={editStart} setOn={setEditStart} label="Start date">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full px-3 py-2 text-sm" style={inputStyle} />
        </Row>
        <Row on={editEnd} setOn={setEditEnd} label="End date">
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full px-3 py-2 text-sm" style={inputStyle} />
        </Row>

        {touched && errors.length > 0 && (
          <div
            className="flex flex-col gap-1 px-3 py-2 text-xs"
            style={{ background: "var(--rev-warning-bg)", color: "var(--rev-warning)", borderRadius: REV_RADIUS.sm }}
          >
            {errors.map((e) => (
              <span key={e}>• {e}</span>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}

/** Confirmation dialog for the bulk archive (soft delete) action. */
export function ArchiveConfirm({
  open,
  count,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Archive rules"
      subtitle="Archiving is a soft delete."
      width={400}
      footer={
        <>
          <RevButton variant="secondary" onClick={onClose}>
            Cancel
          </RevButton>
          <RevButton variant="primary" onClick={onConfirm}>
            Archive {count} rule{count === 1 ? "" : "s"}
          </RevButton>
        </>
      }
    >
      <p className="text-sm" style={{ color: "var(--rev-text-mid)" }}>
        {count} rule{count === 1 ? "" : "s"} will be set to <strong>Archived</strong> and stop applying to
        orderlines. They stay visible in the table (and exportable) for audit — no
        rule is ever hard-deleted.
      </p>
    </Drawer>
  );
}
