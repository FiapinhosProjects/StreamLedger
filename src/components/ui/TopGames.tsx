"use client";

import Image from "next/image";
import { useTopGames } from "@/hooks/useTopGames";

export default function TopGames() {
  const { games, loading, error } = useTopGames();

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-lg font-semibold mb-1">Jogos em Alta na Twitch</h3>
      <p className="text-sm text-muted mb-4">Inspiração para sua próxima live — os mais assistidos agora</p>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted text-sm">Carregando jogos...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted text-sm">Não foi possível carregar os jogos. Verifique as credenciais da Twitch API.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex gap-4 overflow-x-auto py-3 -my-3 px-1 -mx-1">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex-shrink-0 w-28 group cursor-default"
            >
              <div className="relative w-28 h-36 rounded-lg overflow-hidden border border-border group-hover:border-neon group-hover:shadow-[0_0_16px_rgba(93,255,155,0.4)] group-hover:scale-110 group-hover:z-10 transition-all duration-300">
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <p className="text-xs text-center mt-2 text-muted group-hover:text-neon transition-colors duration-300 line-clamp-2">
                {game.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
