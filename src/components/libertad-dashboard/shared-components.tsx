export function FireRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs leading-5 text-stone-500">{detail}</p>
      </div>
      <p className="libertad-number shrink-0 text-right text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const toneClasses = {
    neutral: "border-stone-200 bg-white text-stone-950",
    green: "border-emerald-100 bg-emerald-50 text-emerald-950",
    blue: "border-sky-100 bg-sky-50 text-sky-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
    red: "border-red-100 bg-red-50 text-red-950",
  };

  return (
    <div className={`min-w-0 rounded-md border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="libertad-number mt-2 break-words text-[1.35rem] font-semibold leading-tight">
        {value}
      </p>
      {detail ? <p className="mt-2 text-xs leading-5 opacity-75">{detail}</p> : null}
    </div>
  );
}

export function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white/8 px-3 py-2">
      <p className="min-w-0 text-sm text-stone-300">{label}</p>
      <p className="libertad-number shrink-0 text-right text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
