"use client";

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="panel p-4">
      <div className="mb-3 h-2 w-full rounded bg-white/10">
        <div
          className="h-2 rounded bg-brandAccent transition-all"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2 text-sm">
        {steps.map((step, idx) => (
          <div key={step} className={idx <= currentStep ? "text-green-300" : "text-white/70"}>
            {idx <= currentStep ? "✅" : "⏳"} {step}
          </div>
        ))}
      </div>
    </div>
  );
}
