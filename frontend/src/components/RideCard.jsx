import { useContext } from "react";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { UserContext } from "../contexts";
import { formatDate, formatTime, getSeatsLeft } from "../utils/format";
import Avatar from "./Avatar";

export default function RideCard({ ride, onRequest, index = 0 }) {
  const user = useContext(UserContext);
  const seatsLeft = getSeatsLeft(ride);
  const isOwn = ride.driverId === user.id;
  const hasJoined = ride.riders?.includes(user.id);
  const isFull = seatsLeft <= 0;

  return (
    <div className={`glass card-hover rounded-2xl p-5 fade-in stagger-${(index % 4) + 1}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar initials={ride.avatar} />
          <div>
            <p className="font-semibold text-text-primary text-[15px]">{ride.driver}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{ride.pickup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwn && <Badge className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">You</Badge>}
          {isFull && <Badge className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-surface-hover text-text-tertiary border border-border-subtle">Full</Badge>}
          {hasJoined && !isFull && <Badge className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">Joined</Badge>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-cardinal/10 text-cardinal-light border border-cardinal/15">{ride.destination}</Badge>
        <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{formatDate(ride.date)}</Badge>
        <Badge className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{formatTime(ride.time)}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${seatsLeft === 0 ? "bg-text-tertiary" : seatsLeft <= 1 ? "bg-accent-warm animate-pulse" : "bg-accent-green"}`} />
            <span className={`text-sm font-medium ${seatsLeft === 0 ? "text-text-tertiary" : seatsLeft <= 1 ? "text-accent-warm" : "text-text-secondary"}`}>{seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left</span>
          </div>
          <span className="text-sm font-bold text-accent-green">${ride.price}</span>
        </div>
        {!isOwn && !hasJoined && !isFull && (
          <Button onClick={() => onRequest(ride.id)} className="btn-glow px-5 py-2 bg-cardinal text-white text-sm font-semibold rounded-xl border-0">Join ride</Button>
        )}
      </div>
      {ride.notes && <p className="mt-3 pt-3 border-t border-border-subtle text-sm text-text-tertiary leading-relaxed">{ride.notes}</p>}
    </div>
  );
}
