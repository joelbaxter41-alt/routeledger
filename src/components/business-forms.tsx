import { Field, FormActions } from "./forms";
import { saveCustomer, saveJob, saveExpense, saveService } from "@/app/actions";
import type { Customer, Job, Expense, Service } from "@/lib/records";
export function CustomerForm({ customer }: { customer?: Customer }) {
  return (
    <form action={saveCustomer} className="card">
      <input type="hidden" name="id" value={customer?.id || ""} />
      <div className="form-grid">
        <Field
          label="Full name or company"
          name="name"
          defaultValue={customer?.name}
          required
        />
        <Field
          label="Email address"
          name="email"
          type="email"
          defaultValue={customer?.email}
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          defaultValue={customer?.phone}
        />
        <Field
          label="Service / billing address"
          name="address"
          defaultValue={customer?.address}
        />
        <div className="full">
          <Field
            label="Internal notes"
            name="notes"
            type="textarea"
            defaultValue={customer?.notes}
          />
        </div>
      </div>
      <FormActions
        cancel="/app/customers"
        label={customer ? "Save customer" : "Create customer"}
      />
    </form>
  );
}
export function JobForm({
  job,
  customers,
  services,
  today,
  duplicate = false,
}: {
  job?: Job;
  customers: Customer[];
  services: Service[];
  today: string;
  duplicate?: boolean;
}) {
  return (
    <form action={saveJob} className="card">
      <input type="hidden" name="id" value={duplicate ? "" : job?.id || ""} />
      <div className="form-grid">
        <Field
          label="Customer"
          name="customer_id"
          required
          defaultValue={job?.customer_id || ""}
        >
          <option value="" disabled>
            Select a customer
          </option>
          {customers
            .filter((c) => !c.archived || c.id === job?.customer_id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Field>
        <Field
          label="Service category"
          name="service_id"
          defaultValue={job?.service_id || ""}
        >
          <option value="">Custom service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Field>
        <div className="full">
          <Field
            label="Job description"
            name="description"
            defaultValue={job?.description}
            required
          />
        </div>
        <Field
          label="Scheduled date"
          name="scheduled_date"
          type="date"
          defaultValue={job?.scheduled_date || today}
          required
        />
        <Field
          label="Start time · business timezone"
          name="start_time"
          type="time"
          defaultValue={job?.start_time.slice(0, 5) || "09:00"}
          required
        />
        <Field
          label="Estimated duration (minutes)"
          name="duration"
          type="number"
          min={1}
          max={1440}
          defaultValue={job?.duration_minutes || 60}
          required
        />
        <Field
          label="Agreed customer charge"
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={job ? job.quoted_cents / 100 : undefined}
          required
        />
        <Field
          label="Labor allowance per hour · snapshot"
          name="labor_rate"
          type="number"
          min={0}
          step="0.01"
          defaultValue={job ? job.labor_rate_cents / 100 : 0}
        />
        <div className="full">
          <Field
            label="Internal notes"
            name="notes"
            type="textarea"
            defaultValue={job?.notes}
          />
        </div>
      </div>
      <p className="definition">
        Service defaults are a reference in the catalog. Enter the agreed price
        and labor allowance explicitly; changing catalog rates will never change
        this job.
      </p>
      <FormActions
        cancel="/app/jobs"
        label={job && !duplicate ? "Save / reschedule job" : "Schedule job"}
      />
    </form>
  );
}
export function ExpenseForm({
  expense,
  jobs,
  today,
}: {
  expense?: Expense;
  jobs: Job[];
  today: string;
}) {
  return (
    <form action={saveExpense} className="card">
      <h2>{expense ? "Edit expense" : "Record an expense"}</h2>
      <input type="hidden" name="id" value={expense?.id || ""} />
      <div className="form-grid">
        <Field
          label="Vendor"
          name="vendor"
          defaultValue={expense?.vendor}
          required
        />
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={expense ? expense.amount_cents / 100 : undefined}
          required
        />
        <Field
          label="Date"
          name="expense_date"
          type="date"
          defaultValue={expense?.expense_date || today}
          required
        />
        <Field
          label="Category"
          name="category"
          defaultValue={expense?.category || "fuel"}
        >
          {[
            "fuel",
            "equipment",
            "maintenance",
            "materials",
            "labor",
            "vehicle",
            "insurance",
            "software",
            "advertising",
            "supplies",
            "other",
          ].map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Field>
        <Field
          label="Related job · optional"
          name="job_id"
          defaultValue={expense?.job_id || ""}
        >
          <option value="">Business overhead (unallocated)</option>
          {jobs.map((j) => (
            <option value={j.id} key={j.id}>
              {j.description} · {j.scheduled_date}
            </option>
          ))}
        </Field>
        <Field
          label="Description / notes"
          name="description"
          defaultValue={expense?.description}
        />
      </div>
      <p className="definition">
        A job expense is counted once. Record shared costs as overhead; split
        allocations into separate entries whose sum equals the receipt. Record
        labor payments here only if they are additional to the job’s labor
        allowance.
      </p>
      <FormActions cancel="/app/expenses" label="Save expense" />
    </form>
  );
}
export function ServiceForm({ service }: { service?: Service }) {
  return (
    <form action={saveService} className="card">
      <h2>{service ? "Edit service" : "Add a service"}</h2>
      <input type="hidden" name="id" value={service?.id || ""} />
      <div className="form-grid">
        <Field
          label="Service name"
          name="name"
          defaultValue={service?.name}
          required
        />
        <Field
          label="Default price"
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={(service?.default_cents || 0) / 100}
        />
        <Field
          label="Duration (minutes)"
          name="duration"
          type="number"
          min={1}
          max={1440}
          defaultValue={service?.duration_minutes || 60}
        />
        <Field
          label="Labor allowance per hour"
          name="labor_rate"
          type="number"
          min={0}
          step="0.01"
          defaultValue={(service?.labor_rate_cents || 0) / 100}
        />
        <Field
          label="Target profit margin (%)"
          name="target"
          type="number"
          min={0}
          max="99.99"
          step="0.01"
          defaultValue={(service?.target_bps ?? 3500) / 100}
        />
        <Field
          label="Description"
          name="description"
          defaultValue={service?.description}
        />
      </div>
      <FormActions cancel="/app/services" label="Save service" />
    </form>
  );
}
