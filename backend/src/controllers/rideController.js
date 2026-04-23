import prisma from "../prismaClient.js";
import { enrichRide, enrichMany, rideIncludes } from "../services/rideService.js";
import { findMatches } from "../services/matchingService.js";

export async function listRides(req, res, next) {
  try {
    const { destination, date, minSeats, search } = req.query;

    const where = {
      status: { not: "cancelled" },
      date: { gte: new Date() },
    };

    if (destination) where.destination = destination;
    if (date) {
      const d = new Date(date);
      const next = new Date(d.getTime() + 86_400_000);
      where.date = { gte: d, lt: next };
    }

    const rides = await prisma.ride.findMany({
      where,
      include: rideIncludes,
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    let results = enrichMany(rides);

    if (minSeats) {
      const min = Number(minSeats);
      results = results.filter((r) => r.totalSeats - r.takenSeats >= min);
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.destination.toLowerCase().includes(q) ||
          (r.driver && r.driver.toLowerCase().includes(q)) ||
          r.pickup.toLowerCase().includes(q)
      );
    }

    res.json({ rides: results });
  } catch (err) {
    next(err);
  }
}

export async function getRide(req, res, next) {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: rideIncludes,
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    res.json({ ride: enrichRide(ride) });
  } catch (err) {
    next(err);
  }
}

export async function createRide(req, res, next) {
  try {
    const { destination, date, time, pickup, totalSeats, price, notes, venmo } = req.body;

    const ride = await prisma.ride.create({
      data: {
        driverId: req.userId,
        destination,
        date: new Date(date),
        time,
        pickup,
        totalSeats: Number(totalSeats),
        price: Number(price),
        notes: notes || "",
        venmo: venmo || "",
      },
      include: rideIncludes,
    });

    res.status(201).json({ ride: enrichRide(ride) });
  } catch (err) {
    next(err);
  }
}

export async function cancelRide(req, res, next) {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (ride.driverId !== req.userId) {
      return res.status(403).json({ error: "Not your ride" });
    }

    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: "cancelled" },
    });

    res.json({ message: "Ride cancelled" });
  } catch (err) {
    next(err);
  }
}

export async function joinRide(req, res, next) {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    if (ride.driverId === req.userId) {
      return res.status(400).json({ error: "Can't join your own ride" });
    }
    if (ride.status === "cancelled") {
      return res.status(400).json({ error: "Ride has been cancelled" });
    }

    const existing = await prisma.rideRequest.findUnique({
      where: { rideId_userId: { rideId: ride.id, userId: req.userId } },
    });
    if (existing) {
      return res.status(400).json({ error: "Already joined this ride" });
    }

    const takenSeats = await prisma.rideRequest.count({
      where: { rideId: ride.id, status: "confirmed" },
    });
    if (takenSeats >= ride.totalSeats) {
      return res.status(400).json({ error: "Ride is full" });
    }

    await prisma.rideRequest.create({
      data: { rideId: ride.id, userId: req.userId, status: "confirmed" },
    });

    if (takenSeats + 1 >= ride.totalSeats) {
      await prisma.ride.update({
        where: { id: ride.id },
        data: { status: "full" },
      });
    }

    // Auto-create conversation between rider and driver
    const existingConvo = await prisma.conversation.findFirst({
      where: {
        rideId: ride.id,
        AND: [
          { participants: { some: { userId: req.userId } } },
          { participants: { some: { userId: ride.driverId } } },
        ],
      },
    });

    let conversationId;
    if (existingConvo) {
      conversationId = existingConvo.id;
    } else {
      const convo = await prisma.conversation.create({
        data: {
          rideId: ride.id,
          participants: {
            create: [
              { userId: req.userId },
              { userId: ride.driverId },
            ],
          },
        },
      });
      conversationId = convo.id;
    }

    res.status(201).json({ message: "Joined ride", conversationId });
  } catch (err) {
    next(err);
  }
}

export async function leaveRide(req, res, next) {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    const request = await prisma.rideRequest.findUnique({
      where: { rideId_userId: { rideId: ride.id, userId: req.userId } },
    });
    if (!request) {
      return res.status(400).json({ error: "You're not on this ride" });
    }

    await prisma.rideRequest.delete({ where: { id: request.id } });

    if (ride.status === "full") {
      await prisma.ride.update({
        where: { id: ride.id },
        data: { status: "open" },
      });
    }

    res.json({ message: "Left ride" });
  } catch (err) {
    next(err);
  }
}

export async function myDriving(req, res, next) {
  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: req.userId, status: { not: "cancelled" } },
      include: rideIncludes,
      orderBy: { date: "asc" },
    });
    res.json({ rides: enrichMany(rides) });
  } catch (err) {
    next(err);
  }
}

export async function myRiding(req, res, next) {
  try {
    const requests = await prisma.rideRequest.findMany({
      where: { userId: req.userId, status: "confirmed" },
      select: { rideId: true },
    });

    const rides = await prisma.ride.findMany({
      where: {
        id: { in: requests.map((r) => r.rideId) },
        status: { not: "cancelled" },
      },
      include: rideIncludes,
      orderBy: { date: "asc" },
    });

    res.json({ rides: enrichMany(rides) });
  } catch (err) {
    next(err);
  }
}

export async function matchRides(req, res, next) {
  try {
    const { destination, date } = req.query;
    if (!destination || !date) {
      return res.status(400).json({ error: "destination and date are required" });
    }
    const results = await findMatches(req.userId, destination, date);
    res.json({ rides: results });
  } catch (err) {
    next(err);
  }
}
