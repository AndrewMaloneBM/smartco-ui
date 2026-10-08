"use client";

import { useRef, type ReactNode } from "react";

/**
 * Step 5 import drawer — spec-matched React stand-ins for the Revolve components
 * used in the Figma flow ("CSV import · flow v2", Homepage file, node 6097:820):
 * Stepper, Radio · Full, Input File Upload (+ Document), Info Block, Text List,
 * Table (Check step redesign, node 6202:1553).
 * Sizes, radii and colours are read from the Figma instances; icons are the
 * 🖼️ Icons library SVGs. Kept local to iteration-5 so Steps 1–3 stay untouched.
 */

// Revolve values with no `--rev-*` token in iteration-1/tokens.ts (read from Figma).
const BORDER_ACTION_LOW = "#d2d4da"; // border/action-default-low — unselected radio, file input
const BORDER_DANGER = "#f8545b"; // border/action-danger — file input in error
const DOCUMENT_ICON = "#2c7acd"; // Document "Text In Square Filled" icon

// ── Icons (🖼️ Icons library, 24px grid, currentColor) ────────────────────────

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

function Svg({ size = 24, viewBox = "0 0 24 24", className, style, children }: IconProps & { viewBox?: string; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" aria-hidden="true" className={`shrink-0 ${className ?? ""}`} style={style}>
      {children}
    </svg>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11.171 13.7781L11.171 9.35633C11.171 8.89844 11.5422 8.52725 12 8.52725C12.4579 8.52725 12.8291 8.89844 12.8291 9.35633L12.8291 13.7781C12.8291 14.236 12.4579 14.6072 12.0001 14.6072C11.5422 14.6072 11.171 14.236 11.171 13.7781Z" fill="currentColor" />
      <path d="M12.0002 17.9788C12.5496 17.9788 12.9951 17.5334 12.9951 16.9839C12.9951 16.4345 12.5496 15.989 12.0002 15.989C11.4507 15.989 11.0053 16.4345 11.0053 16.9839C11.0053 17.5334 11.4507 17.9788 12.0002 17.9788Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M10.8033 3.69091C11.3352 2.7697 12.6648 2.76969 13.1967 3.69091L21.8128 18.6145C22.3447 19.5357 21.6798 20.6872 20.6161 20.6872H3.38387C2.32016 20.6872 1.65533 19.5357 2.18719 18.6145L10.8033 3.69091ZM12 4.93454L3.86255 19.029H20.1375L12 4.93454Z" fill="currentColor" />
    </Svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.7494 7.5C12.7494 8.05228 12.3017 8.5 11.7494 8.5C11.1971 8.5 10.7494 8.05228 10.7494 7.5C10.7494 6.94772 11.1971 6.5 11.7494 6.5C12.3017 6.5 12.7494 6.94772 12.7494 7.5Z" fill="currentColor" />
      <path d="M9.75 10.5C9.75 10.0858 10.0858 9.75 10.5 9.75H11.5C12.1904 9.75 12.75 10.3096 12.75 11V15.75H13.5C13.9142 15.75 14.25 16.0858 14.25 16.5C14.25 16.9142 13.9142 17.25 13.5 17.25H10.5C10.0858 17.25 9.75 16.9142 9.75 16.5C9.75 16.0858 10.0858 15.75 10.5 15.75H11.25V11.25H10.5C10.0858 11.25 9.75 10.9142 9.75 10.5Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25ZM3.75 12C3.75 7.44365 7.44365 3.75 12 3.75C16.5563 3.75 20.25 7.44365 20.25 12C20.25 16.5563 16.5563 20.25 12 20.25C7.44365 20.25 3.75 16.5563 3.75 12Z" fill="currentColor" />
    </Svg>
  );
}

export function IconBlocked(props: IconProps) {
  return (
    <Svg {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3ZM7.25391 17.8057C8.54688 18.8639 10.1988 19.5 12 19.5C16.1421 19.5 19.5 16.1421 19.5 12C19.5 10.1988 18.8639 8.54688 17.8057 7.25391L7.25391 17.8057ZM12 4.5C7.85786 4.5 4.5 7.85786 4.5 12C4.5 13.8007 5.13563 15.4523 6.19336 16.7451L16.7451 6.19336C15.4523 5.13563 13.8007 4.5 12 4.5Z" fill="currentColor" />
    </Svg>
  );
}

export function IconCheckInCircle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M17.0303 9.53033C17.3232 9.23744 17.3232 8.76256 17.0303 8.46967C16.7374 8.17678 16.2626 8.17678 15.9697 8.46967L10.5 13.9393L8.03033 11.4697C7.73744 11.1768 7.26256 11.1768 6.96967 11.4697C6.67678 11.7626 6.67678 12.2374 6.96967 12.5303L9.61612 15.1768C10.1043 15.6649 10.8957 15.6649 11.3839 15.1768L17.0303 9.53033Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25ZM3.75 12C3.75 7.44365 7.44365 3.75 12 3.75C16.5563 3.75 20.25 7.44365 20.25 12C20.25 16.5563 16.5563 20.25 12 20.25C7.44365 20.25 3.75 16.5563 3.75 12Z" fill="currentColor" />
    </Svg>
  );
}

function IconPlus(props: IconProps) {
  return (
    <Svg size={20} viewBox="0 0 20 20" {...props}>
      <path d="M10.625 5C10.625 4.65482 10.3452 4.375 10 4.375C9.65482 4.375 9.375 4.65482 9.375 5V9.375H5C4.65482 9.375 4.375 9.65482 4.375 10C4.375 10.3452 4.65482 10.625 5 10.625H9.375V15C9.375 15.3452 9.65482 15.625 10 15.625C10.3452 15.625 10.625 15.3452 10.625 15V10.625H15C15.3452 10.625 15.625 10.3452 15.625 10C15.625 9.65482 15.3452 9.375 15 9.375H10.625V5Z" fill="currentColor" />
    </Svg>
  );
}

function IconCross(props: IconProps) {
  return (
    <Svg viewBox="8 8 24 24" {...props}>
      <path d="M27.4697 11.4697C27.7626 11.1768 28.2373 11.1768 28.5302 11.4697C28.8231 11.7626 28.8231 12.2373 28.5302 12.5302L21.0605 19.9999L28.5302 27.4697C28.8231 27.7626 28.8231 28.2373 28.5302 28.5302C28.2373 28.8231 27.7626 28.8231 27.4697 28.5302L19.9999 21.0605L12.5302 28.5302C12.2373 28.8231 11.7626 28.8231 11.4697 28.5302C11.1768 28.2373 11.1768 27.7626 11.4697 27.4697L18.9394 19.9999L11.4697 12.5302C11.1768 12.2373 11.1768 11.7626 11.4697 11.4697C11.7626 11.1768 12.2373 11.1768 12.5302 11.4697L19.9999 18.9394L27.4697 11.4697Z" fill="currentColor" />
    </Svg>
  );
}

function IconDocument(props: IconProps) {
  return (
    <Svg {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M18 3.25C19.5188 3.25 20.75 4.48122 20.75 6V18C20.75 19.5188 19.5188 20.75 18 20.75H6C4.48122 20.75 3.25 19.5188 3.25 18V6C3.25 4.48122 4.48122 3.25 6 3.25H18ZM8 14.75C7.58592 14.75 7.25022 15.086 7.25 15.5C7.25 15.9142 7.58579 16.25 8 16.25H11C11.4142 16.25 11.75 15.9142 11.75 15.5C11.7498 15.086 11.4141 14.75 11 14.75H8ZM8 11.25C7.58592 11.25 7.25022 11.586 7.25 12C7.25 12.4142 7.58579 12.75 8 12.75H16C16.4142 12.75 16.75 12.4142 16.75 12C16.7498 11.586 16.4141 11.25 16 11.25H8ZM8 7.75C7.58592 7.75 7.25022 8.08597 7.25 8.5C7.25 8.91421 7.58579 9.25 8 9.25H16C16.4142 9.25 16.75 8.91421 16.75 8.5C16.7498 8.08597 16.4141 7.75 16 7.75H8Z" fill="currentColor" />
    </Svg>
  );
}

/** 🖼️ Icons "Spreadsheet In Square Filled" — the CSV file icon on the Check step. */
export function IconSpreadsheet(props: IconProps) {
  return (
    <Svg {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M18 3.25C19.5188 3.25 20.75 4.48122 20.75 6V18C20.75 19.5188 19.5188 20.75 18 20.75H6C4.48122 20.75 3.25 19.5188 3.25 18V6C3.25 4.48122 4.48122 3.25 6 3.25H18ZM7 12C6.72386 12 6.5 12.2239 6.5 12.5V15.5C6.5 15.7761 6.72386 16 7 16H8.5C8.77614 16 9 15.7761 9 15.5V12.5C9 12.2239 8.77614 12 8.5 12H7ZM11 12C10.7239 12 10.5 12.2239 10.5 12.5V15.5C10.5 15.7761 10.7239 16 11 16H17C17.2761 16 17.5 15.7761 17.5 15.5V12.5C17.5 12.2239 17.2761 12 17 12H11ZM7 8C6.72386 8 6.5 8.22386 6.5 8.5V10C6.5 10.2761 6.72386 10.5 7 10.5H8.5C8.77614 10.5 9 10.2761 9 10V8.5C9 8.22386 8.77614 8 8.5 8H7ZM11 8C10.7239 8 10.5 8.22386 10.5 8.5V10C10.5 10.2761 10.7239 10.5 11 10.5H17C17.2761 10.5 17.5 10.2761 17.5 10V8.5C17.5 8.22386 17.2761 8 17 8H11Z" fill="currentColor" />
    </Svg>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────

/**
 * 🚀 Components "Stepper" (breakpoint=LG). Equal-width steps, 56px tall, 16/24
 * label; the current step is semibold, and the 2px rail is dark up to and
 * including the current step. Completed steps are buttons when `onStepClick`
 * allows going back (Revolve: "navigate to previous steps").
 */
export function RevStepper({
  steps,
  current,
  onStepClick,
}: {
  steps: string[];
  /** 0-based index of the current step. */
  current: number;
  /** Called with the step index when a completed step is clicked. Omit to lock the stepper. */
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="flex w-full" aria-label="Import progress">
      {steps.map((label, i) => {
        const isCurrent = i === current;
        const isDone = i < current;
        const text = `${i + 1}. ${label}`;
        const cellStyle: React.CSSProperties = {
          borderBottom: `2px solid ${i <= current ? "var(--rev-text-mid)" : "var(--rev-border)"}`,
          color: isCurrent || isDone ? "var(--rev-text-hi)" : "var(--rev-text-low)",
          fontWeight: isCurrent ? 600 : 400,
        };
        const cellClass = "flex h-14 w-full items-center justify-center px-2 text-base leading-6";
        return (
          <li key={label} className="flex-1" aria-current={isCurrent ? "step" : undefined}>
            {isDone && onStepClick ? (
              <button type="button" onClick={() => onStepClick(i)} className={`${cellClass} transition-opacity hover:opacity-70`} style={cellStyle}>
                {text}
              </button>
            ) : (
              <span className={cellClass} style={cellStyle}>
                {text}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Radio · Full ─────────────────────────────────────────────────────────────

/**
 * 🚀 Components "Radio · Full" (type=icon, no icon/image/tag). A bordered card:
 * 20px radio + 16/24 label, 14/20 description aligned under the label. Selected
 * = 1.5px dark border + filled radio. The native input stays in the tree
 * (visually hidden) so keyboard and screen readers get real radio behaviour.
 */
export function RevRadioFull({
  name,
  checked,
  onChange,
  label,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className="flex cursor-pointer flex-col gap-2 p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[hsl(225,100%,60%)]"
      style={{
        background: "var(--rev-surface-low)",
        borderRadius: 6,
        // Selected border is 1.5px in Revolve; drawn as an inset shadow so the card doesn't shift.
        border: `1px solid ${checked ? "var(--rev-text-hi)" : BORDER_ACTION_LOW}`,
        boxShadow: checked ? "inset 0 0 0 0.5px var(--rev-text-hi)" : undefined,
      }}
    >
      <span className="flex items-center gap-3">
        <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={
            checked
              ? { background: "var(--rev-text-hi)" }
              : { background: "var(--rev-surface-low)", border: "1px solid var(--rev-input-border)" }
          }
        >
          {checked && <span className="h-2 w-2 rounded-full" style={{ background: "#fff" }} />}
        </span>
        <span className="text-base leading-6" style={{ color: "var(--rev-text-hi)" }}>
          {label}
        </span>
      </span>
      {description && (
        <span className="pl-8 text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
          {description}
        </span>
      )}
    </label>
  );
}

// ── Info Block ───────────────────────────────────────────────────────────────

export type InfoTone = "info" | "success" | "warning" | "danger";

const INFO_BG: Record<InfoTone, string> = {
  info: "var(--rev-info-bg)",
  success: "var(--rev-success-bg)",
  warning: "var(--rev-warning-bg)",
  danger: "var(--rev-danger-bg)",
};

/**
 * 🚀 Components "Info Block" (no button / toggle / dismiss / caption). Mood-tinted
 * 12px-radius block, 24px icon top-left, 14/20 semibold title + body.
 */
export function RevInfoBlock({ tone, title, children }: { tone: InfoTone; title: string; children?: ReactNode }) {
  const Icon = tone === "info" ? IconInfo : tone === "success" ? IconCheckInCircle : IconWarning;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="flex gap-3 text-sm font-semibold leading-5"
      style={{ background: INFO_BG[tone], borderRadius: 12, padding: "16px 20px 18px 16px" }}
    >
      <Icon style={{ color: "var(--rev-text-hi)" }} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
        <span style={{ color: "var(--rev-text-hi)" }}>{title}</span>
        {children && <div style={{ color: "var(--rev-text-mid)" }}>{children}</div>}
      </div>
    </div>
  );
}

// ── Text List ────────────────────────────────────────────────────────────────

export interface TextListItem {
  key: string | number;
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Optional control rendered at the end of the row (e.g. a checkbox). */
  trailing?: ReactNode;
}

/**
 * 🚀 Components "Text List" (type=unordered, with description). 24px icon,
 * 16/24 semibold title, 14/20 description, 16px between items.
 */
export function RevTextList({ items }: { items: TextListItem[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((it) => (
        <li key={it.key} className="flex items-start gap-4">
          <span style={{ color: "var(--rev-text-hi)" }}>{it.icon}</span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-semibold leading-6" style={{ color: "var(--rev-text-hi)" }}>
              {it.title}
            </span>
            {it.description && (
              <span className="text-sm leading-5" style={{ color: "var(--rev-text-mid)" }}>
                {it.description}
              </span>
            )}
          </div>
          {it.trailing}
        </li>
      ))}
    </ul>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────

export interface RevTableColumn {
  key: string;
  header: string;
  /** Fixed width in px. Leave it off one column so it takes the remaining width. */
  width?: number;
  /** "number" right-aligns the cells with tabular figures. The header stays left, as in Revolve. */
  type?: "text" | "number";
}

export interface RevTableCell {
  text: ReactNode;
  description?: ReactNode;
}

export interface RevTableRow {
  key: string | number;
  /** One cell per column key. */
  cells: Record<string, RevTableCell>;
}

/**
 * 🚀 Components "Web ▸ Table | Desktop - Column" (columnType=default), in a
 * compact density for the 640px drawer: Revolve's 56px header and 96px rows are
 * too tall here. 48px header on bg/static-default-hi with a 16/24 semibold
 * title. Body rows hug their content with 12px above and below: a 16/24 text
 * line and an optional 14/20 description 4px below (48px for one line, 72px
 * with a one-line description), closed by a 1px border/static-default-low
 * hairline. No outer border, no radius.
 */
export function RevTable({ caption, columns, rows }: { caption: string; columns: RevTableColumn[]; rows: RevTableRow[] }) {
  return (
    <table className="w-full border-collapse text-left" style={{ tableLayout: "fixed" }}>
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        {columns.map((c) => (
          <col key={c.key} style={c.width ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              className="text-left text-base font-semibold leading-6"
              style={{ height: 48, padding: "12px 16px", background: "var(--rev-static-hi)", color: "var(--rev-text-hi)" }}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} style={{ borderBottom: "1px solid var(--rev-border)" }}>
            {columns.map((c) => {
              const cell = r.cells[c.key];
              const isNumber = c.type === "number";
              return (
                <td
                  key={c.key}
                  className={`break-words align-middle ${isNumber ? "text-right" : "text-left"}`}
                  style={{ padding: "12px 16px" }}
                >
                  <span
                    className="block text-base leading-6"
                    style={{ color: "var(--rev-text-mid)", fontVariantNumeric: isNumber ? "tabular-nums" : undefined }}
                  >
                    {cell?.text}
                  </span>
                  {cell?.description && (
                    <span className="mt-1 block text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
                      {cell.description}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Input File Upload ────────────────────────────────────────────────────────

/**
 * 🚀 Components "Input File Upload" + "Document" (single file). Empty: a 48px
 * bordered field with a + icon and helper text. Filled: the file shows below as
 * a Document row with a remove action. Error: danger border + message.
 */
export function RevFileUpload({
  label,
  filledLabel,
  accept,
  fileName,
  helper,
  error,
  onFile,
  onRemove,
}: {
  /** Field label when no file is selected. */
  label: string;
  /** Field label once a file is selected. */
  filledLabel: string;
  accept: string;
  /** Selected file name, or "" when empty. */
  fileName: string;
  helper?: string;
  /** Error message — also switches the field to its error state. */
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot) : "";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-12 w-full items-center justify-between gap-4 px-3 text-left text-base leading-6 transition-colors hover:bg-[hsla(225,21%,7%,0.03)]"
        style={{
          background: "var(--rev-surface-low)",
          border: `1px solid ${error ? BORDER_DANGER : BORDER_ACTION_LOW}`,
          borderRadius: 6,
          color: "var(--rev-text-hi)",
        }}
      >
        {fileName ? filledLabel : label}
        <IconPlus style={{ color: "var(--rev-text-low)" }} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {error ? (
        <span className="text-sm leading-5" style={{ color: "var(--rev-danger)" }}>
          {error}
        </span>
      ) : (
        helper && (
          <span className="text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
            {helper}
          </span>
        )
      )}
      {fileName && (
        <div
          className="flex w-full max-w-md items-center gap-2 py-3 pl-3 pr-1"
          style={{ background: "var(--rev-surface-low)", border: "1px solid var(--rev-border-strong)", borderRadius: 6 }}
        >
          <IconDocument style={{ color: DOCUMENT_ICON }} />
          <span className="flex min-w-0 flex-1 text-base leading-6">
            <span className="truncate font-semibold" style={{ color: "var(--rev-text-hi)" }}>
              {base}
            </span>
            <span style={{ color: "var(--rev-text-low)" }}>{ext}</span>
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${fileName}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[hsla(225,21%,7%,0.06)]"
            style={{ color: "var(--rev-text-hi)" }}
          >
            <IconCross />
          </button>
        </div>
      )}
    </div>
  );
}
