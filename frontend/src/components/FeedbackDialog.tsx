import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export type DialogAction = {
  label: string;
  onClick: () => void;
  tone?: "primary" | "default";
};

export interface FeedbackDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actions?: DialogAction[];
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  title,
  message,
  onClose,
  actions = [],
}) => {
  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        aria-describedby="feedback-dialog-desc"
      >
        <div className="px-6 py-4 border-b">
          <div
            id="feedback-dialog-title"
            className="text-lg font-bold text-gray-900 font-jua"
          >
            {title}
          </div>
        </div>
        <div className="px-6 py-5">
          <p
            id="feedback-dialog-desc"
            className="text-sm text-gray-800 whitespace-pre-line font-gowun"
          >
            {message}
          </p>
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-gowun"
          >
            닫기
          </button>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`px-4 py-2 rounded-lg text-sm font-jua ${
                a.tone === "primary"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "border border-gray-300 bg-white hover:bg-gray-100"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 포털로 body에 띄워서 z-index/overflow 문제 최소화
  return createPortal(dialog, document.body);
};

export default FeedbackDialog;
