import { Submit } from "./submit";
import Link from "next/link";
export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  children,
  min,
  max,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  children?: React.ReactNode;
  min?: string | number;
  max?: string | number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      {label}
      {children ? (
        <select name={name} defaultValue={defaultValue} required={required}>
          {children}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} defaultValue={defaultValue} maxLength={2000} />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          maxLength={type === "password" ? 128 : undefined}
        />
      )}
    </label>
  );
}
export function FormActions({
  cancel,
  label,
}: {
  cancel: string;
  label?: string;
}) {
  return (
    <div className="form-actions">
      <Submit>{label || "Save changes"}</Submit>
      <Link className="button outline" href={cancel}>
        Cancel
      </Link>
    </div>
  );
}
export function Feedback({
  params,
}: {
  params: { error?: string; success?: string };
}) {
  return (
    <>
      {params.error && (
        <div role="alert" className="alert error">
          {params.error}
        </div>
      )}
      {params.success && (
        <div role="status" className="alert">
          {params.success}
        </div>
      )}
    </>
  );
}
