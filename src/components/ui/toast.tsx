"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: number;
  message: string;
  variant: "success" | "warning" | "info";
};

type ToastContextValue = {
  toast: (message: string, variant?: Toast["variant"]) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, variant: Toast["variant"] = "success") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto flex min-w-[260px] max-w-sm items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-toast-in " +
              (t.variant === "success"
                ? "border-green-200 bg-white text-gray-900"
                : t.variant === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-gray-200 bg-white text-gray-900")
            }
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
