import { useState, useEffect, useMemo } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { getSeatsLeft } from "../utils/format";
import { DESTINATIONS, DESTINATION_ALIASES } from "../utils/constants";
import RideCard from "../components/RideCard";

// Build one lowercase haystack per ride that covers every field we want to
// search against, plus any destination aliases (e.g. "chicago" for ORD/MDW).
function buildHaystack(ride) {
  return [
    ride.destination,
    ride.driver || "",
    ride.pickup,
    ride.notes || "",
    (DESTINATION_ALIASES[ride.destination] || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export default function BrowseRides({ rides, loading, onRequest }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [seatsFilter, setSeatsFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce the text query so rapid typing doesn't re-filter on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [search]);

  // Precompute haystacks only when `rides` changes, not on every keystroke.
  const ridesIndexed = useMemo(
    () => rides.map((r) => ({ ride: r, haystack: buildHaystack(r) })),
    [rides]
  );

  const filtered = useMemo(() => {
    return ridesIndexed
      .filter(({ ride, haystack }) => {
        if (destFilter && ride.destination !== destFilter) return false;
        if (dateFilter && ride.date !== dateFilter) return false;
        if (seatsFilter > 0 && getSeatsLeft(ride) < seatsFilter) return false;
        if (debouncedSearch && !haystack.includes(debouncedSearch)) return false;
        return true;
      })
      .map((x) => x.ride);
  }, [ridesIndexed, debouncedSearch, destFilter, dateFilter, seatsFilter]);

  const openRides = useMemo(
    () => rides.filter((r) => getSeatsLeft(r) > 0).length,
    [rides]
  );

  return (
    <div className="fade-in">
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-light text-xs font-medium text-text-secondary mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />{openRides} rides available now
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
          <span className="text-text-primary">ditch the bus.</span><br /><span className="text-gradient">ride with badgers.</span>
        </h1>
        <p className="text-text-secondary mt-3 text-lg max-w-md mx-auto md:mx-0">Find your ride home for spring break — cheaper than a bus, better than begging your parents.</p>
      </div>
      <div className="flex flex-col gap-3 mb-8 mt-10 max-w-xl mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <Form.Control type="text" placeholder="Search rides..." aria-label="Search rides" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm input-dark border-0" />
          </div>
          <Button onClick={() => setShowFilters(!showFilters)} aria-label={showFilters ? "Hide filters" : "Show filters"} aria-expanded={showFilters} className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 border-0 ${showFilters ? "bg-cardinal text-white shadow-lg shadow-cardinal/20" : "glass-light text-text-secondary hover:text-text-primary"}`}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>
          </Button>
        </div>
        {showFilters && (
          <div className="slide-up glass rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Group controlId="filter-destination">
              <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Destination</Form.Label>
              <Form.Select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm input-dark border-0">
                <option value="">All</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="filter-date">
              <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Date</Form.Label>
              <Form.Control type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm input-dark border-0" />
            </Form.Group>
            <Form.Group controlId="filter-seats">
              <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Min seats</Form.Label>
              <Form.Select value={seatsFilter} onChange={(e) => setSeatsFilter(Number(e.target.value))} className="px-3 py-2.5 rounded-xl text-sm input-dark border-0">
                <option value={0}>Any</option><option value={1}>1+</option><option value={2}>2+</option><option value={3}>3+</option>
              </Form.Select>
            </Form.Group>
          </div>
        )}
      </div>
      <p className="text-xs text-text-tertiary mb-4 uppercase tracking-widest font-medium">
        {loading ? <><Spinner animation="border" size="sm" className="me-2" />Loading...</> : `${filtered.length} ride${filtered.length !== 1 ? "s" : ""} found`}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.length === 0 && !loading ? (
          <div className="md:col-span-2 text-center py-20">
            <div className="text-5xl mb-4 opacity-40">{rides.length === 0 ? "🦡" : "🚗"}</div>
            <p className="font-medium text-text-secondary">{rides.length === 0 ? "No rides posted yet" : "No rides match your filters"}</p>
            <p className="text-sm text-text-tertiary mt-1">{rides.length === 0 ? "Be the first — post a ride and get the ball rolling!" : "Try adjusting your search or filters"}</p>
          </div>
        ) : filtered.map((r, i) => <RideCard key={r.id} ride={r} onRequest={onRequest} index={i} />)}
      </div>
    </div>
  );
}
