export function formatDate(dateStr) {
  const d = new Date(typeof dateStr === "string" && !dateStr.includes("T") ? dateStr + "T00:00:00" : dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export function formatTimestamp(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function getSeatsLeft(r) {
  return r.totalSeats - r.takenSeats;
}
