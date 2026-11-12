"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cents, invoiceTotal, money } from "@/lib/finance";
import { quantityMilli } from "@/lib/document-input";
type Row = { id: number; description: string; quantity: string; price: string };
export function LineItemsEditor({
  initialDescription = "",
  initialCents,
  currency,
  jobChargeCents,
}: {
  initialDescription?: string;
  initialCents?: number;
  currency: string;
  jobChargeCents?: number;
}) {
  const [rows, setRows] = useState<Row[]>([
    {
      id: 1,
      description: initialDescription,
      quantity: "1",
      price: initialCents === undefined ? "" : (initialCents / 100).toFixed(2),
    },
  ]);
  const [nextId, setNextId] = useState(2);
  const update = (id: number, field: keyof Omit<Row, "id">, value: string) =>
    setRows((old) =>
      old.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  let subtotal: number | undefined;
  try {
    subtotal = invoiceTotal(
      rows.map((row) => ({
        quantity_milli: quantityMilli(row.quantity),
        unit_cents: cents(row.price),
      })),
    ).subtotal;
  } catch {}
  const mismatch =
    jobChargeCents !== undefined &&
    subtotal !== undefined &&
    subtotal !== jobChargeCents;
  return (
    <fieldset className="line-items">
      <legend>Line items</legend>
      <div className="stack">
        {rows.map((row, index) => (
          <div className="line-item" key={row.id}>
            <label className="field">
              Item {index + 1} description
              <input
                name="item_description"
                value={row.description}
                onChange={(e) => update(row.id, "description", e.target.value)}
                required
                maxLength={2000}
              />
            </label>
            <label className="field">
              Quantity
              <input
                name="item_quantity"
                type="number"
                inputMode="decimal"
                value={row.quantity}
                onChange={(e) => update(row.id, "quantity", e.target.value)}
                min="0.001"
                max="1000"
                step="0.001"
                required
              />
            </label>
            <label className="field">
              Unit price
              <input
                name="item_price"
                type="number"
                inputMode="decimal"
                value={row.price}
                onChange={(e) => update(row.id, "price", e.target.value)}
                min="0"
                max="10000000000"
                step="0.01"
                required
              />
            </label>
            <button
              className="button ghost"
              type="button"
              aria-label={`Remove item ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() =>
                setRows((old) => old.filter((item) => item.id !== row.id))
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <div className="section-head" style={{ margin: "18px 0 0" }}>
        <button
          className="button outline"
          type="button"
          disabled={rows.length >= 50}
          onClick={() => {
            setRows((old) => [
              ...old,
              { id: nextId, description: "", quantity: "1", price: "" },
            ]);
            setNextId(nextId + 1);
          }}
        >
          <Plus size={15} />
          Add line item
        </button>
        <div aria-live="polite">
          <span className="muted" style={{ fontSize: 12 }}>
            Subtotal before tax{" "}
          </span>
          <strong className="mono">
            {subtotal === undefined ? "—" : money(subtotal, currency)}
          </strong>
        </div>
      </div>
      {jobChargeCents !== undefined && (
        <p
          className={`definition ${mismatch ? "negative" : ""}`}
          role={mismatch ? "alert" : undefined}
        >
          The item subtotal must equal the completed job’s agreed charge of{" "}
          {money(jobChargeCents, currency)}. Tax is added separately.
        </p>
      )}
    </fieldset>
  );
}
