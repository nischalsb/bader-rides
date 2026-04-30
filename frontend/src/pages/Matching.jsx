import { useState } from "react";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { api } from "../utils/api";
import { formatDate, formatTime, getSeatsLeft } from "../utils/format";
import { DESTINATIONS } from "../utils/constants";
import Avatar from "../components/Avatar";

export default function Matching({ onRequest }) {
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const findMatches = async (e) => {
    e.preventDefault();
    if (!dest || !date) return;
    setSearching(true); setResults(null);
    try {
      const data = await api(`/api/rides/match?destination=${encodeURIComponent(dest)}&date=${date}`);
      setResults(data.rides);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">find your <span className="text-gradient">perfect match</span></h1><p className="text-text-secondary mt-2 text-lg">Tell us where and when. We&apos;ll do the rest.</p></div>
      <Form onSubmit={findMatches} className="glass rounded-3xl p-6 md:p-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <Form.Group controlId="match-destination">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Where to?</Form.Label>
            <Form.Select value={dest} onChange={(e) => setDest(e.target.value)} required className="px-4 py-3 rounded-xl text-sm input-dark border-0">
              <option value="">Select destination...</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="match-date">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">When?</Form.Label>
            <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
          </Form.Group>
        </div>
        <Button type="submit" disabled={searching} className="btn-glow w-full py-4 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-bold rounded-2xl text-base tracking-wide border-0 disabled:opacity-60">
          {searching ? <><Spinner animation="border" size="sm" className="me-2" />Scanning...</> : "Find my match"}
        </Button>
      </Form>
      {results !== null && (
        <div className="slide-up">
          {results.length === 0 ? (
            <div className="text-center py-16 glass rounded-3xl"><div className="text-5xl mb-4 opacity-30">😔</div><p className="font-medium text-text-secondary">No matches found</p></div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-tertiary uppercase tracking-widest font-medium">{results.length} match{results.length !== 1 ? "es" : ""} found</p>
              {results.map((r, i) => (
                <div key={r.id} className={`fade-in stagger-${(i % 4) + 1} relative`}>
                  {i === 0 && <Badge className="absolute -top-2 right-4 z-10 px-3 py-1 bg-gradient-to-r from-accent-yellow to-accent-warm text-black text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-accent-yellow/20">Best match</Badge>}
                  <div className={`glass rounded-2xl p-5 ${i === 0 ? "ring-1 ring-accent-yellow/30 shadow-[0_0_40px_rgba(255,214,10,0.06)]" : ""}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><Avatar initials={r.avatar} glow={i === 0} /><div><p className="font-semibold text-text-primary">{r.driver}</p><p className="text-xs text-text-tertiary">{r.pickup}</p></div></div>
                      <div className="text-right"><div className={`text-3xl font-bold font-display ${i === 0 ? "text-gradient" : "text-cardinal-light"}`}>{r.score}</div><div className="text-[10px] uppercase tracking-widest text-text-tertiary">score</div></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-cardinal/10 text-cardinal-light border border-cardinal/15">{r.destination}</Badge>
                      <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{formatDate(r.date)} &middot; {formatTime(r.time)}</Badge>
                      <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{r.seatsLeft || getSeatsLeft(r)} seats</Badge>
                      <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">${r.price}</Badge>
                    </div>
                    <Button onClick={() => onRequest(r.id)} className="btn-glow w-full py-3 bg-cardinal text-white text-sm font-bold rounded-xl border-0">Join this ride</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
