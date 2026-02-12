import { Check, X } from "lucide-react";

interface StatusToggleProps {
  status: string;
  onToggle: (id: number) => void;
  id: number;
}

export default function StatusToggle({ status, onToggle, id }: StatusToggleProps) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
        status === "completed"
          ? "bg-green-500 border-green-500 text-white"
          : status === "incomplete"
            ? "bg-red-500 border-red-500 text-white"
            : "border-gray-300 text-gray-300 hover:border-gray-400"
      }`}
    >
      {status === "completed" && <Check size={14} />}
      {status === "incomplete" && <X size={14} />}
    </button>
  );
}
