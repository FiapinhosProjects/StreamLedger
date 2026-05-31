"use client";

import { useState, useEffect } from "react";

interface Game {
  id: string;
  name: string;
  image: string;
}

interface TopGamesData {
  games: Game[];
  loading: boolean;
  error: boolean;
}

export function useTopGames(): TopGamesData {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("/api/twitch/top-games");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setGames(data.games);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  return { games, loading, error };
}
