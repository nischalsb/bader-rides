function avatarFromName(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Include shape callers should use on `prisma.ride.findMany/findUnique` so
// enrichRide can shape the response without issuing extra queries (avoids N+1).
export const rideIncludes = {
  driver: { select: { name: true, avatar: true } },
  rideRequests: {
    where: { status: "confirmed" },
    select: { userId: true },
  },
};

// Synchronous: expects `ride` to have been fetched with `rideIncludes`.
export function enrichRide(ride) {
  const confirmed = ride.rideRequests ?? [];
  const takenSeats = confirmed.length;

  return {
    id: ride.id,
    driverId: ride.driverId,
    driver: ride.driver?.name ?? null,
    avatar: ride.driver?.avatar ?? avatarFromName(ride.driver?.name || "??"),
    destination: ride.destination,
    date: ride.date.toISOString().split("T")[0],
    time: ride.time,
    pickup: ride.pickup,
    totalSeats: ride.totalSeats,
    takenSeats,
    price: ride.price,
    notes: ride.notes,
    venmo: ride.venmo,
    status: takenSeats >= ride.totalSeats ? "full" : ride.status,
    riders: confirmed.map((r) => r.userId),
    createdAt: ride.createdAt,
  };
}

export function enrichMany(rides) {
  return rides.map(enrichRide);
}
