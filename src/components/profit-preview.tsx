"use client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cents, profitability, money } from "@/lib/finance";
const schema = z.object({
  revenue: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Use a positive amount with at most 2 decimals",
    ),
  cost: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Use a positive amount with at most 2 decimals",
    ),
  margin: z
    .string()
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) < 100,
      "Use a margin from 0 to 99.99%",
    ),
});
export function ProfitPreview() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { revenue: "250", cost: "95", margin: "35" },
  });
  const values = useWatch({ control });
  let result: ReturnType<typeof profitability> | undefined;
  try {
    const p = schema.parse(values);
    result = profitability(cents(p.revenue), [cents(p.cost)], cents(p.margin));
  } catch {}
  return (
    <div className="details">
      <form onSubmit={handleSubmit(() => {})} className="stack">
        <label className="field">
          Customer charge ($)
          <input
            {...register("revenue")}
            inputMode="decimal"
            aria-invalid={Boolean(errors.revenue)}
          />
        </label>
        <label className="field">
          Total job cost ($)
          <input
            {...register("cost")}
            inputMode="decimal"
            aria-invalid={Boolean(errors.cost)}
          />
        </label>
        <label className="field">
          Target profit margin (%)
          <input
            {...register("margin")}
            inputMode="decimal"
            aria-invalid={Boolean(errors.margin)}
          />
        </label>
        <button className="button outline">Check calculation</button>
        {Object.values(errors).map((e, i) => (
          <span className="negative" role="alert" key={i}>
            {e.message}
          </span>
        ))}
      </form>
      <div style={{ background: "#edf2e9", padding: 25, borderRadius: 8 }}>
        <span className="eyebrow">ILLUSTRATIVE CALCULATOR · NOT SAVED</span>
        <div className="stat-value mono positive" aria-live="polite">
          {result ? money(result.profit) : "—"}
        </div>
        <p>Estimated job profit</p>
        <div className="detail-row">
          <span>Profit margin</span>
          <strong>
            {result?.marginBasisPoints !== null && result
              ? `${(result.marginBasisPoints / 100).toFixed(1)}%`
              : "—"}
          </strong>
        </div>
        <div className="detail-row">
          <span>Suggested price</span>
          <strong>{result ? money(result.suggestedPrice) : "—"}</strong>
        </div>
        <p className="definition">
          Add labor, materials, fuel, and other costs to your total. Excludes
          unrecorded costs and taxes. Target margin is not markup.
        </p>
      </div>
    </div>
  );
}
