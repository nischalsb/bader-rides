import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";

/**
 * Centralized data layer.
 *
 * Loads all tab data in parallel the moment the user logs in (prefetch) and
 * keeps it in state that persists across tab switches (lifted state). Pages
 * read from this hook via props instead of fetching on mount, so navigating
 * between tabs is instant.
 *
 * Exposes refreshers so mutations (post ride, join ride, send message, etc.)
 * can re-sync individual slices without refetching everything.
 */
export function useAppData(user) {
  const [rides, setRides] = useState([]);
  const [myDriving, setMyDriving] = useState([]);
  const [myRiding, setMyRiding] = useState([]);
  const [conversations, setConversations] = useState([]);

  const [ridesLoading, setRidesLoading] = useState(true);
  const [myRidesLoading, setMyRidesLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const refreshRides = useCallback(async () => {
    try {
      const d = await api("/api/rides");
      setRides(d.rides);
    } finally {
      setRidesLoading(false);
    }
  }, []);

  const refreshMyRides = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([
        api("/api/rides/mine/driving"),
        api("/api/rides/mine/riding"),
      ]);
      setMyDriving(d.rides);
      setMyRiding(r.rides);
    } finally {
      setMyRidesLoading(false);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const d = await api("/api/conversations");
      setConversations(d.conversations);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshRides();
    refreshMyRides();
    refreshConversations();
  }, [user, refreshRides, refreshMyRides, refreshConversations]);

  return {
    rides,
    myDriving,
    myRiding,
    conversations,
    setConversations,
    ridesLoading,
    myRidesLoading,
    conversationsLoading,
    refreshRides,
    refreshMyRides,
    refreshConversations,
  };
}
