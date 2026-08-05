import { NextResponse } from "next/server";
import { checkServerRateLimit, getRateLimitHeaders } from "@/lib/rateLimit";

async function getTwitchToken(): Promise<string> {
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  const data = await res.json();
  return data.access_token;
}

export async function GET(request: Request) {
  // Rate limiting
  // Usa IP do cliente como identificador
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  const rateLimit = checkServerRateLimit(ip, "API_REQUEST");

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Twitch credentials not configured" },
      {
        status: 500,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }

  try {
    const token = await getTwitchToken();

    const res = await fetch("https://api.twitch.tv/helix/games/top?first=10", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": clientId,
      },
    });

    const data = await res.json();

    const games = data.data.map((game: { id: string; name: string; box_art_url: string }) => ({
      id: game.id,
      name: game.name,
      image: game.box_art_url.replace("{width}", "120").replace("{height}", "160"),
    }));

    return NextResponse.json(
      { games },
      {
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch top games" },
      {
        status: 500,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  }
}
