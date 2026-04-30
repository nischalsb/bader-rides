import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { DESTINATIONS, PICKUP_LOCATIONS } from "../utils/constants";
import { formatDate, formatTime } from "../utils/format";

export default function PostRide({ onPost }) {
  const [form, setForm] = useState({ destination: "", customDest: "", date: "", time: "", pickup: "", totalSeats: 4, notes: "", venmo: "", price: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const dest = form.destination === "__custom" ? form.customDest : form.destination;
    if (!dest || !form.date || !form.time || !form.pickup) return;
    setShowConfirm(true);
  };

  const confirmPost = async () => {
    const dest = form.destination === "__custom" ? form.customDest : form.destination;
    await onPost({ destination: dest, date: form.date, time: form.time, pickup: form.pickup, totalSeats: Number(form.totalSeats), notes: form.notes, venmo: form.venmo, price: Number(form.price) || 0 });
    setForm({ destination: "", customDest: "", date: "", time: "", pickup: "", totalSeats: 4, notes: "", venmo: "", price: "" });
    setShowConfirm(false);
  };

  const dest = form.destination === "__custom" ? form.customDest : form.destination;

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">share the road</h1><p className="text-text-secondary mt-2 text-lg">Post your ride. Split the cost. Make friends.</p></div>
      <Form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Form.Group controlId="post-destination" className="sm:col-span-2">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Where to?</Form.Label>
            <Form.Select value={form.destination} onChange={set("destination")} required className="px-4 py-3 rounded-xl text-sm input-dark border-0">
              <option value="">Select destination...</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}<option value="__custom">Somewhere else...</option>
            </Form.Select>
            {form.destination === "__custom" && <Form.Control type="text" placeholder="Type your destination..." value={form.customDest} onChange={set("customDest")} required aria-label="Custom destination" className="mt-2 px-4 py-3 rounded-xl text-sm input-dark border-0" />}
          </Form.Group>
          <Form.Group controlId="post-date">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Date</Form.Label>
            <Form.Control type="date" value={form.date} onChange={set("date")} required className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
          </Form.Group>
          <Form.Group controlId="post-time">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Time</Form.Label>
            <Form.Select value={form.time} onChange={set("time")} required className="px-4 py-3 rounded-xl text-sm input-dark border-0">
              <option value="">Select time...</option>
              {Array.from({ length: 36 }, (_, i) => { const h = Math.floor(i / 2) + 5; const m = i % 2 === 0 ? "00" : "30"; if (h > 22) return null; const val = `${String(h).padStart(2, "0")}:${m}`; const hr = h > 12 ? h - 12 : h === 0 ? 12 : h; return <option key={val} value={val}>{`${hr}:${m} ${h >= 12 ? "PM" : "AM"}`}</option>; }).filter(Boolean)}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="post-pickup">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Pickup spot</Form.Label>
            <Form.Select value={form.pickup} onChange={set("pickup")} required className="px-4 py-3 rounded-xl text-sm input-dark border-0">
              <option value="">Select pickup...</option>{PICKUP_LOCATIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="post-seats">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Seats</Form.Label>
            <Form.Select value={form.totalSeats} onChange={set("totalSeats")} className="px-4 py-3 rounded-xl text-sm input-dark border-0">
              {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="post-price">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Price per person</Form.Label>
            <Form.Control type="number" min="0" placeholder="$0" value={form.price} onChange={set("price")} className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
          </Form.Group>
          <Form.Group controlId="post-venmo">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Venmo (optional)</Form.Label>
            <Form.Control type="text" placeholder="@your-handle" value={form.venmo} onChange={set("venmo")} className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
          </Form.Group>
          <Form.Group controlId="post-notes" className="sm:col-span-2">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Notes</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Trunk space, vibes, stops along the way..." value={form.notes} onChange={set("notes")} className="px-4 py-3 rounded-xl text-sm input-dark border-0 resize-none" />
          </Form.Group>
        </div>
        <Button type="submit" className="btn-glow w-full py-4 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-bold rounded-2xl text-base tracking-wide border-0">Post your ride</Button>
      </Form>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton className="glass border-0 rounded-t-3xl">
          <Modal.Title className="font-display text-text-primary text-lg">Confirm your ride</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass border-0 space-y-3 px-5 py-4">
          <p className="text-text-secondary text-sm">You&apos;re about to post:</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-tertiary">Destination</span><span className="font-medium text-text-primary">{dest}</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Date</span><span className="font-medium text-text-primary">{form.date && formatDate(form.date)}</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Time</span><span className="font-medium text-text-primary">{form.time && formatTime(form.time)}</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Pickup</span><span className="font-medium text-text-primary">{form.pickup}</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Seats</span><span className="font-medium text-text-primary">{form.totalSeats}</span></div>
            {form.price && <div className="flex justify-between"><span className="text-text-tertiary">Price</span><span className="font-medium text-accent-green">${form.price}</span></div>}
          </div>
        </Modal.Body>
        <Modal.Footer className="glass border-0 rounded-b-3xl gap-2">
          <Button variant="link" onClick={() => setShowConfirm(false)} className="text-text-secondary">Cancel</Button>
          <Button onClick={confirmPost} className="btn-glow px-6 py-2.5 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-semibold rounded-xl border-0">Confirm &amp; post</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
