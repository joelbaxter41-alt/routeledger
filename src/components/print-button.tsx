"use client";
export function PrintButton() {
  return (
    <button
      type="button"
      className="button outline no-print"
      onClick={() => window.print()}
    >
      Print / save PDF
    </button>
  );
}
