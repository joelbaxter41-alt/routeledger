"use client";
import { useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  Users,
  Receipt,
  ArrowUpRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { BrandLogo } from "./brand";
import { money } from "@/lib/finance";
const samples = [
  {
    name: "Weekly lawn care",
    customer: "Morgan Residence",
    service: "Lawn care",
    time: "9:00 AM",
    status: "Scheduled",
    charge: 8500,
    labor: 2500,
    materials: 800,
  },
  {
    name: "Patio pressure wash",
    customer: "Oak Street Property",
    service: "Pressure washing",
    time: "10:30 AM",
    status: "In progress",
    charge: 24000,
    labor: 5000,
    materials: 2100,
  },
  {
    name: "Seasonal cleanup",
    customer: "Westfield Home",
    service: "Landscaping",
    time: "1:00 PM",
    status: "Completed",
    charge: 32000,
    labor: 9000,
    materials: 4500,
  },
];
const sampleRevenue = samples.reduce((sum, job) => sum + job.charge, 0);
const sampleCosts = samples.reduce(
  (sum, job) => sum + job.labor + job.materials,
  0,
);
export function ProductPreview() {
  const [view, setView] = useState("jobs");
  return (
    <div className="product-stage">
      <div className="product-window">
        <aside className="preview-sidebar">
          <BrandLogo compact />
          <div className="preview-business">
            Greenfield Services
            <ChevronDown size={12} />
          </div>
          <div className="preview-nav">
            {[
              [LayoutDashboard, "Overview"],
              [BriefcaseBusiness, "Jobs"],
              [CalendarDays, "Calendar"],
              [Users, "Customers"],
              [Receipt, "Expenses"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof LayoutDashboard;
              return (
                <span
                  key={String(label)}
                  className={label === "Jobs" ? "selected" : ""}
                >
                  <ItemIcon size={15} />
                  {String(label)}
                </span>
              );
            })}
          </div>
          <div className="preview-sidebar-note">
            A little more organized.
            <br />A lot more in control.
          </div>
        </aside>
        <div className="preview-main">
          <div className="preview-topline">
            <span>
              Workspace <span className="muted">/</span>{" "}
              {view === "jobs" ? "Jobs" : "Profitability"}
            </span>
            <span className="sample-label">Illustrative sample data</span>
          </div>
          <div className="preview-title">
            <div>
              <span className="eyebrow">A GOOD DAY’S WORK</span>
              <h2>Small details. Big picture.</h2>
              <p>Everything you need to keep your business moving.</p>
            </div>
            <span className="preview-avatar">GS</span>
          </div>
          <div className="preview-metrics">
            <div>
              <span>Quoted job value</span>
              <strong>{money(sampleRevenue)}</strong>
            </div>
            <div>
              <span>Recorded costs</span>
              <strong>{money(sampleCosts)}</strong>
            </div>
            <div className="profit">
              <span>Est. job profit</span>
              <strong>{money(sampleRevenue - sampleCosts)}</strong>
            </div>
          </div>
          <div
            className="preview-tabs"
            role="tablist"
            aria-label="Sample workspace view"
          >
            <button
              type="button"
              role="tab"
              id="sample-jobs-tab"
              tabIndex={view === "jobs" ? 0 : -1}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
                  event.preventDefault();
                  setView("profit");
                  document.getElementById("sample-profit-tab")?.focus();
                }
              }}
              aria-selected={view === "jobs"}
              aria-controls="sample-panel"
              className={view === "jobs" ? "active" : ""}
              onClick={() => setView("jobs")}
            >
              Your jobs <span>3</span>
            </button>
            <button
              type="button"
              role="tab"
              id="sample-profit-tab"
              tabIndex={view === "profit" ? 0 : -1}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
                  event.preventDefault();
                  setView("jobs");
                  document.getElementById("sample-jobs-tab")?.focus();
                }
              }}
              aria-selected={view === "profit"}
              aria-controls="sample-panel"
              className={view === "profit" ? "active" : ""}
              onClick={() => setView("profit")}
            >
              Profit breakdown
            </button>
          </div>
          <div
            id="sample-panel"
            role="tabpanel"
            aria-label={
              view === "jobs" ? "Sample jobs" : "Sample profit breakdown"
            }
          >
            {view === "jobs" ? (
              <div className="preview-board">
                {samples.map((job, index) => (
                  <section className="preview-column" key={job.name}>
                    <div className="preview-column-title">
                      <span className={`status-dot dot-${index}`} />
                      {job.status}
                      <span className="column-count">1</span>
                    </div>
                    <div className="preview-job">
                      <span className="preview-service">{job.service}</span>
                      <h3>{job.name}</h3>
                      <p>{job.customer}</p>
                      <div className="preview-job-bottom">
                        <span>{job.time}</span>
                        <strong>{money(job.charge)}</strong>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="preview-profit-list">
                {samples.map((job) => (
                  <div key={job.name}>
                    <span>
                      {job.name}
                      <small>
                        {money(job.charge)} charge −{" "}
                        {money(job.labor + job.materials)} costs
                      </small>
                    </span>
                    <strong>
                      {money(job.charge - job.labor - job.materials)}
                    </strong>
                  </div>
                ))}
                <p>
                  Illustrative costs include a labor allowance and job expenses;
                  excludes overhead and taxes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="preview-floating-note">
        <span>
          <Check size={16} />
        </span>
        <div>
          Good work should add up.<small>Know what every job leaves you.</small>
        </div>
        <ArrowUpRight size={17} />
      </div>
    </div>
  );
}
