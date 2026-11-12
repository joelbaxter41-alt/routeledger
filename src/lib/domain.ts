import { addDays, addMonths, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
export const transitions: Record<string, string[]> = {
  draft: ["scheduled", "canceled"],
  scheduled: ["in_progress", "canceled"],
  in_progress: ["completed", "canceled"],
  completed: [],
  canceled: [],
};
export function canTransition(from: string, to: string) {
  return transitions[from]?.includes(to) ?? false;
}
export function entitled(status: string | undefined) {
  return status === "active" || status === "trialing";
}
/** Generate local calendar dates; convert wall-clock appointment times separately. */
export function nextOccurrence(
  localDate: string,
  interval: "weekly" | "biweekly" | "monthly",
  anchorDay?: number,
) {
  const date = parseISO(localDate);
  if (interval === "monthly") {
    const next = addMonths(date, 1);
    if (anchorDay)
      next.setDate(
        Math.min(
          anchorDay,
          new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
        ),
      );
    return format(next, "yyyy-MM-dd");
  }
  return format(addDays(date, interval === "weekly" ? 7 : 14), "yyyy-MM-dd");
}
export function appointmentInstant(
  date: string,
  time: string,
  timezone: string,
) {
  return fromZonedTime(`${date}T${time}`, timezone).toISOString();
}
