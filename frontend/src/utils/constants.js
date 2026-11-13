export const APP_NAME = "SENTINEL AI";
export const TAGLINE = "Your Room. Your Safety. Your AI Guardian.";

export const RISK_LEVELS = {
  NORMAL: {
    label: "NORMAL",
    color: "#10B981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    description: "All environmental, visual, and acoustic channels secure."
  },
  WARNING: {
    label: "WARNING",
    color: "#F59E0B",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    description: "Sensory anomaly observed. Operator verification suggested."
  },
  HIGH_RISK: {
    label: "HIGH RISK",
    color: "#F97316",
    bg: "bg-orange-500/15",
    border: "border-orange-500/40",
    text: "text-orange-400",
    description: "Confirmed danger in one sensory channel. Immediate caution."
  },
  CRITICAL: {
    label: "CRITICAL",
    color: "#EF4444",
    bg: "bg-red-500/20",
    border: "border-red-500/50",
    text: "text-red-400",
    description: "LIFE SAFETY EMERGENCY. Multi-sensor convergence detected!"
  }
};

export const API_BASE = "http://127.0.0.1:8000/api/v1";
export const WS_BASE = "ws://127.0.0.1:8000/api/v1/monitor/ws";
