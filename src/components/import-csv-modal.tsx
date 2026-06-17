"use client";

import { useState } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { downloadCsv } from "@/lib/utils";

const TEMPLATE_HEADERS =
  "name,market,category,product_id,grade,battery_type,seller_ids,commission_rate";

type PreviewRow = {
  name: string;
  market: string;
  category: string;
  commission_rate: string;
  error: string | null;
};

// Mocked preview: a realistic mix where a couple of rows fail validation.
const MOCK_PREVIEW: PreviewRow[] = [
  {
    name: "iPhone 15 FR — All Sellers",
    market: "FR",
    category: "Smartphones",
    commission_rate: "8.5",
    error: null,
  },
  {
    name: "MacBook DE — Key Sellers",
    market: "DE",
    category: "Laptops",
    commission_rate: "7.0",
    error: null,
  },
  {
    name: "Tablets GB — duplicate",
    market: "GB",
    category: "Tablets",
    commission_rate: "9.0",
    error: "Conflict — a rule for this scope already exists (RULE-1004)",
  },
  {
    name: "Audio US — All Sellers",
    market: "US",
    category: "Audio",
    commission_rate: "6.5",
    error: null,
  },
  {
    name: "Accessories XX — bad market",
    market: "XX",
    category: "Accessories",
    commission_rate: "150",
    error: "Invalid market 'XX' and rate out of bounds (150%)",
  },
];

export function ImportCsvModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (importedCount: number, skippedCount: number) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(false);

  const reset = () => {
    setFileName(null);
    setPreviewed(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setPreviewed(true);
  };

  const validRows = MOCK_PREVIEW.filter((r) => !r.error);
  const errorRows = MOCK_PREVIEW.filter((r) => r.error);

  const downloadTemplate = () => {
    const example =
      "iPhone 15 FR - All Sellers,FR,Smartphones,iPhone15Pro,GOOD,New Battery,,8.5";
    downloadCsv("smart-commission-template.csv", `${TEMPLATE_HEADERS}\n${example}`);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import Rules via CSV"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          {previewed ? (
            <Button
              variant="primary"
              onClick={() => {
                onImport(validRows.length, errorRows.length);
                close();
              }}
            >
              Import {validRows.length} valid rows
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Validate &amp; preview
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Download the template, fill in your rules, then upload the file.
          Columns:{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
            {TEMPLATE_HEADERS}
          </code>
        </p>

        <Button variant="secondary" size="sm" onClick={downloadTemplate}>
          ⬇ Download template
        </Button>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition-colors hover:border-brand/50 hover:bg-gray-100">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-sm text-gray-600">
            {fileName ? (
              <span className="font-medium text-gray-900">{fileName}</span>
            ) : (
              <>
                Drag &amp; drop your CSV here, or{" "}
                <span className="font-medium text-brand underline">browse</span>
              </>
            )}
          </span>
        </label>

        {previewed && (
          <div className="space-y-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {errorRows.length} row{errorRows.length !== 1 ? "s" : ""} have
              errors and will be skipped · {validRows.length} valid rows will be
              imported.
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Market</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_PREVIEW.map((row, i) => (
                    <tr
                      key={i}
                      className={row.error ? "bg-red-50" : undefined}
                    >
                      <td className="px-3 py-2 text-gray-800">{row.name}</td>
                      <td className="px-3 py-2 text-gray-600">{row.market}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.commission_rate}%
                      </td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="text-xs font-medium text-red-600">
                            {row.error}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-green-600">
                            ✓ Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
