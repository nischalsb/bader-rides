import { useState, useEffect, useContext } from "react";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import { UserContext } from "../contexts";
import { api } from "../utils/api";
import { formatDate, formatTime, getSeatsLeft } from "../utils/format";
import Avatar from "../components/Avatar";

export default function MyRides() {
  const user = useContext(UserContext);
  const [posted, setPosted] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/rides/mine/driving"), api("/api/rides/mine/riding")])
      .then(([d, r]) => { setPosted(d.rides); setJoined(r.rides); })
      .finally(() => setLoading(false));
  }, []);

  const StatusBadge = ({ ride }) => {
    if (ride.status === "full" || getSeatsLeft(ride) <= 0) return <Badge className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-surface-hover text-text-tertiary border border-border-subtle">Full</Badge>;
    if (ride.riders?.includes(user.id) || ride.driverId === user.id) return <Badge className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">Confirmed</Badge>;
    return <Badge className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20">Pending</Badge>;
  };

  const RideRow = ({ ride, i }) => (
    <div className={`glass card-hover rounded-2xl p-4 flex items-center justify-between gap-4 fade-in stagger-${(i % 4) + 1}`}>
      <div className="flex items-center gap-3 min-w-0"><Avatar initials={ride.avatar} size="sm" /><div className="min-w-0"><p className="font-medium text-text-primary text-sm truncate">{ride.destination}</p><p className="text-xs text-text-tertiary mt-0.5 truncate">{formatDate(ride.date)} &middot; {formatTime(ride.time)} &middot; {ride.pickup}</p></div></div>
      <div className="flex items-center gap-3 shrink-0"><span className="text-sm text-text-tertiary hidden sm:inline">{getSeatsLeft(ride)} left</span><StatusBadge ride={ride} /></div>
    </div>
  );

  const Empty = ({ text }) => <div className="text-center py-12 glass rounded-2xl"><div className="text-3xl mb-2 opacity-30">🛣️</div><p className="text-sm text-text-tertiary">{text}</p></div>;

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">your rides</h1><p className="text-text-secondary mt-2">Everything in one place.</p></div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[{ label: "Driving", val: posted.length, color: "cardinal" }, { label: "Riding", val: joined.length, color: "accent-blue" }, { label: "Total", val: posted.length + joined.length, color: "accent-green" }].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center"><div className={`text-2xl font-bold font-display text-${s.color}`}>{s.val}</div><div className="text-[10px] uppercase tracking-widest text-text-tertiary mt-1">{s.label}</div></div>
        ))}
      </div>
      {loading ? <div className="text-center py-8"><Spinner animation="border" variant="danger" /></div> : (
        <>
          <section className="mb-8"><h2 className="text-xs uppercase tracking-widest text-text-tertiary font-medium mb-3">Rides you&apos;re driving ({posted.length})</h2>{posted.length === 0 ? <Empty text="No rides posted yet" /> : <div className="grid gap-2">{posted.map((r, i) => <RideRow key={r.id} ride={r} i={i} />)}</div>}</section>
          <section><h2 className="text-xs uppercase tracking-widest text-text-tertiary font-medium mb-3">Rides you&apos;ve joined ({joined.length})</h2>{joined.length === 0 ? <Empty text="No rides joined yet" /> : <div className="grid gap-2">{joined.map((r, i) => <RideRow key={r.id} ride={r} i={i} />)}</div>}</section>
        </>
      )}
    </div>
  );
}
