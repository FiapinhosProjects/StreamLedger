// ============================================
// route.ts - API Route: Gemini-powered transaction parser
// Receives natural language → returns structured JSON array
// Supports multiple transactions in a single message
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { checkServerRateLimit, getRateLimitHeaders } from "@/lib/rateLimit";

// ---------------------------------------------------
// Types
// ---------------------------------------------------

export interface GeminiTransaction {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: "Doação" | "Sub" | "Patrocínio" | "Equipamento" | "Software" | "Outros";
  data: string; // YYYY-MM-DD
}

export interface ParseResult {
  success: true;
  transactions: GeminiTransaction[];
}

export interface ParseError {
  success: false;
  error: string;
}

// ---------------------------------------------------
// System prompt
// ---------------------------------------------------

const TODAY = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `Você é um assistente de finanças pessoais para streamers.
Sua tarefa é extrair transações financeiras de mensagens em português brasileiro.

Quando o usuário descreve transações, você pode encontrar UMA ou VÁRIAS transações na mesma mensagem.
Responda EXCLUSIVAMENTE com um JSON válido (sem markdown, sem comentários) no seguinte formato:

{
  "transactions": [
    {
      "tipo": "entrada" | "saida",
      "descricao": "string curta",
      "valor": número decimal positivo,
      "categoria": "Doação" | "Sub" | "Patrocínio" | "Equipamento" | "Software" | "Outros",
      "data": "YYYY-MM-DD"
    }
  ]
}

Regras:
- tipo: "entrada" para receitas, "saida" para despesas
- valor: número positivo, sem símbolos de moeda
- categoria: "Doação" (doações de viewers), "Sub" (assinaturas), "Patrocínio" (parcerias), "Equipamento" (hardware), "Software" (assinaturas/apps), "Outros" (o resto)
- data: ISO (YYYY-MM-DD). Padrão: data de hoje (${TODAY})
- descricao: máx 100 caracteres
- Se a mensagem não contém transações, retorne: {"transactions": []}
- Máximo de 5 transações por mensagem

EXEMPLOS:
Entrada única:
"Recebi 80 de sub" → {"transactions":[{"tipo":"entrada","descricao":"Subs Twitch","valor":80.00,"categoria":"Sub","data":"${TODAY}"}]}

Múltiplas transações:
"Comprei um microfone de 300 e recebi um sub de 80"
→ {"transactions":[
  {"tipo":"saida","descricao":"Microfone","valor":300.00,"categoria":"Equipamento","data":"${TODAY}"},
  {"tipo":"entrada","descricao":"Subs Twitch","valor":80.00,"categoria":"Sub","data":"${TODAY}"}
]}

"Recebi 50 de doação, gastei 200 no headset e pago 30 de VPN todo mês"
→ {"transactions":[
  {"tipo":"entrada","descricao":"Doação viewer","valor":50.00,"categoria":"Doação","data":"${TODAY}"},
  {"tipo":"saida","descricao":"Headset","valor":200.00,"categoria":"Equipamento","data":"${TODAY}"},
  {"tipo":"saida","descricao":"VPN mensal","valor":30.00,"categoria":"Software","data":"${TODAY}"}
]}

Importante: responda SOMENTE o JSON, sem nenhum texto antes ou depois.`;

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function buildGeminiPrompt(userMessage: string): string {
  const escaped = userMessage
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `${SYSTEM_PROMPT}\n\nMensagem do usuário:\n"${escaped}"`;
}

function isValidTransaction(obj: unknown): obj is GeminiTransaction {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    (o.tipo === "entrada" || o.tipo === "saida") &&
    typeof o.descricao === "string" &&
    typeof o.valor === "number" &&
    Number.isFinite(o.valor) &&
    o.valor > 0 &&
    typeof o.categoria === "string" &&
    typeof o.data === "string"
  );
}

function sanitizeDescription(raw: string): string {
  return raw
    .replace(/"/g, "'")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

// ---------------------------------------------------
// Route Handler
// ---------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? request.headers.get("x-real-ip")
    ?? "anonymous";
  const rateLimitResult = checkServerRateLimit(ip, "API_REQUEST");
  if (!rateLimitResult.allowed) {
    return NextResponse.json<ParseError>(
      { success: false, error: "Muitas requisições. Tente novamente em alguns minutos." },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // 2. Ler body
  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ParseError>(
      { success: false, error: "Formato de requisição inválido." },
      { status: 400 }
    );
  }

  const { message } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json<ParseError>(
      { success: false, error: "Mensagem vazia." },
      { status: 400 }
    );
  }

  const trimmed = message.trim().slice(0, 500);

  // 3. API Key
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json<ParseError>(
      { success: false, error: "API key não configurada." },
      { status: 500 }
    );
  }

  // 4. Chamar Gemini
  const model = process.env.GOOGLE_GEMINI_MODEL || "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);

  let geminiData: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildGeminiPrompt(trimmed) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json<ParseError>(
        { success: false, error: "Erro ao comunicar com a API de IA." },
        { status: 502 }
      );
    }

    geminiData = await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return NextResponse.json<ParseError>(
      {
        success: false,
        error: isAbort
          ? "A IA demorou demais para responder. Tente novamente."
          : "Falha ao conectar com a API de IA.",
      },
      { status: 504 }
    );
  }

  // 5. Extrair texto
  const rawText =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

  if (!rawText) {
    return NextResponse.json<ParseError>(
      { success: false, error: "Resposta vazia da API de IA." },
      { status: 502 }
    );
  }

  // 6. Parsear JSON
  let parsed: unknown;
  try {
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json<ParseError>(
      { success: false, error: "A IA retornou um formato inesperado." },
      { status: 502 }
    );
  }

  // 7. Validar estrutura de array
  if (!parsed || typeof parsed !== "object") {
    return NextResponse.json<ParseError>(
      { success: false, error: "Formato de resposta inválido." },
      { status: 502 }
    );
  }

  const p = parsed as Record<string, unknown>;

  if (!Array.isArray(p.transactions)) {
    return NextResponse.json<ParseError>(
      { success: false, error: "Formato de resposta inválido." },
      { status: 502 }
    );
  }

  // 8. Validar e sanitizar cada transação
  const validTransactions: GeminiTransaction[] = p.transactions
    .slice(0, 5) // máx 5 transações
    .filter(isValidTransaction)
    .map((t) => {
      const tx = t as GeminiTransaction;
      tx.descricao = sanitizeDescription(tx.descricao);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.data)) {
        tx.data = TODAY;
      }
      return tx;
    });

  if (validTransactions.length === 0) {
    return NextResponse.json<ParseError>(
      {
        success: false,
        error: "Não consegui identificar transações na sua mensagem. Tente descrever de forma mais direta, por exemplo: 'Recebi 50 de doação' ou 'Gastei 200 no headset'.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json<ParseResult>({ success: true, transactions: validTransactions });
}
