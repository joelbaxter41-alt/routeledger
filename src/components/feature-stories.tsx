import Link from "next/link";
import { ArrowRight, Check, CalendarDays, Clock3 } from "lucide-react";
export function FeatureStories() {
  return (
    <div className="feature-stories">
      <article className="feature-story">
        <div className="story-copy">
          <span className="eyebrow">01 / KEEP THE DAY MOVING</span>
          <h2>
            Every job.
            <br />A clear next step.
          </h2>
          <p>
            Customer details, schedules, and job status belong together. Go from
            “booked in” to “all done” with less back-and-forth and fewer loose
            ends.
          </p>
          <Link href="/signup" className="text-link">
            Organize your next job <ArrowRight size={16} />
          </Link>
        </div>
        <div className="story-visual">
          <div className="schedule-example">
            <span className="sample-label">Illustrative example</span>
            <div className="example-heading">
              <CalendarDays size={19} />
              <strong>A day that makes sense.</strong>
            </div>
            {[
              ["09:00", "Weekly lawn care", "Morgan Residence", "Scheduled"],
              [
                "10:30",
                "Patio pressure wash",
                "Oak Street Property",
                "In progress",
              ],
              ["13:00", "Seasonal cleanup", "Westfield Home", "Scheduled"],
            ].map(([time, name, customer, status]) => (
              <div className="example-appointment" key={name}>
                <span className="mono">{time}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{customer}</small>
                </div>
                <span
                  className={`badge ${status === "In progress" ? "in_progress" : "scheduled"}`}
                >
                  {status}
                </span>
              </div>
            ))}
            <div className="example-note">
              <Clock3 size={14} />
              Your schedule, customer, and job details in one place.
            </div>
          </div>
        </div>
      </article>
      <article className="feature-story reverse">
        <div className="story-copy">
          <span className="eyebrow">02 / SEE WHAT’S REALLY LEFT</span>
          <h2>
            A full schedule is good.
            <br />A healthy margin is better.
          </h2>
          <p>
            Fuel, materials, and labor all add up. See the costs behind each job
            and get a practical starting point for pricing the next one.
          </p>
          <Link href="#profit-calculator" className="text-link">
            Try the profit calculator <ArrowRight size={16} />
          </Link>
        </div>
        <div className="story-visual profit-story">
          <div className="profit-example">
            <div className="section-head">
              <div>
                <span className="eyebrow">SEASONAL CLEANUP</span>
                <h3>The numbers behind the work.</h3>
              </div>
              <span className="sample-label">Example</span>
            </div>
            <div className="profit-waterfall">
              <div>
                <span>Customer charge</span>
                <strong className="mono">$320.00</strong>
              </div>
              <div className="waterfall-bar">
                <span style={{ width: "100%" }} />
              </div>
              <div>
                <span>Labor allowance</span>
                <span className="mono">− $90.00</span>
              </div>
              <div>
                <span>Materials & other job costs</span>
                <span className="mono">− $45.00</span>
              </div>
            </div>
            <div className="example-profit">
              <div>
                <span>Estimated job profit</span>
                <strong className="mono">$185.00</strong>
              </div>
              <span>
                <Check size={15} />
                57.8% margin
              </span>
            </div>
            <p className="definition">
              Illustrative data. Excludes unrecorded overhead, taxes, and owner
              compensation.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
