// components/SuccessModal.tsx
import React, { useContext } from "react";
import { I18nContext } from "../lib/i18n";
import { CheckIcon, XMarkIcon } from "./icons";

export default function SuccessModal({ onClose }: { onClose: () => void }) {
  const { t } = useContext(I18nContext);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-green-500/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-8 text-center space-y-4">
          <CheckIcon className="w-16 h-16 text-green-400 mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-white">
            {t("payment_success_title")}
          </h2>
          <p className="text-gray-400">
            {t(
              "payment_success_message"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
