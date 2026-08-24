// ============================================
// route.ts - API Route: Gemini-powered transaction parser
// Receives natural language → returns structured JSON
// API Key stays server-side (never exposed to client)
// ============================================

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------
// Types
// ---------------------------------------------------

/** Estrutura retornada pelo Gemini */
export interface GeminiTransaction {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: "Doação" | "Sub" | "Patrocínio" | "Equipamento" | "Software" | "Outros";
  data: string; // YYYY-MM-DD
}

export interface ParseResult {
  success: true;
  transaction: GeminiTransaction;
}

export interface ParseError {
  success: false;
  error: string;
}

type ParseResponse = ParseResult | ParseError;

// ---------------------------------------------------
// System prompt (kept server-side for security)
// ---------------------------------------------------

const SYSTEM_PROMPT = `Você é um assistente de finanças pessoais para streamers.
Sua única tarefa é extrair informações de transações financeiras de mensagens em português brasileiro.

Quando o usuário descrever uma transação, responda EXCLUSIVAMENTE com um JSON válido (sem markdown, sem comentários, sem texto adicional) no seguinte formato:

{
  "tipo": "entrada" | "saida",
  "descricao": "string curta descrevendo a transação",
  "valor": número decimal positivo,
  "categoria": "Doação" | "Sub" | "Patrocínio" | "Equipamento" | "Software" | "Outros",
  "data": "YYYY-MM-DD"
}

Regras:
- tipo: "entrada" para receitas/ganhos, "saida" para despesas/gastos
- valor: número positivo, sem símbolos de moeda (ex: 80.00, not "R$ 80")
- categoria: escolha a que melhor se encaixa
  - "Doação": doações de viewers
  - "Sub": assinaturas de plataformas (Twitch, YouTube, etc.)
  - "Patrocínio": parcerias e patrocínios
  - "Equipamento": hardware, periféricos, mobiliário
  - "Software": assinaturas de apps, licenças
  - "Outros": qualquer coisa que não se encaixe acima
- data: data em formato ISO (YYYY-MM-DD). Se o usuário não informar, use a data de hoje (${new Date().toISOString().split("T")[0]})
- descricao: máxima 100 caracteres, sem caracteres especiais potencialmente perigosos

Se a mensagem NÃO for sobre uma transação financeira, responda com:
{
  "tipo": null,
  "descricao": "mensagem_invalida",
  "valor": 0,
  "categoria": null,
  "data": "${new Date().toISOString().split("T")[0]}"
}

EXEMPLOS de mensagens válidas:
- "Recebi 80 reais de subs hoje" → {"tipo":"entrada","descricao":"Subs Twitch","valor":80.00,"categoria":"Sub","data":"${new Date().toISOString().split("T")[0]}"}
- "Gastei 250 no headset novo" → {"tipo":"saida","descricao":"Headset novo","valor":250.00,"categoria":"Equipamento","data":"${new Date().toISOString().split("T")[0]}"}
- "Uma doação de 50 reais" → {"tipo":"entrada","descricao":"Doação viewer","valor":50.00,"categoria":"Doação","data":"${new Date().toISOString().split("T")[0]}"}
- "Patrocinio de 1000 pela marca X" → {"tipo":"entrada","descricao":"Patrocínio marca X","valor":1000.00,"categoria":"Patrocínio","data":"${new Date().toISOString().split("T")[0]}"}
- "Assinatura da VPN, 30 reais" → {"tipo":"saida","descricao":"VPN mensal","valor":30.00,"categoria":"Software","data":"${new Date().toISOString().split("T")[0]}"}

Importante: responda SOMENTE o JSON, sem nenhum texto antes ou depois.`;

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function buildGeminiPrompt(userMessage: string): string {
  return `${SYSTEM_PROMPT}

Mensagem do usuário:
"${userMessage}"
`;
}

// ---------------------------------------------------
// Route Handler
// ---------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Ler body
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

  const trimmed = message.trim();

  // 2. Verificar presença da API Key
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json<ParseError>(
      {
        success: false,
        error:
          "API key não configurada no servidor. Defina GOOGLE_GEMINI_API_KEY no arquivo .env.local",
      },
      { status: 500 }
    );
  }

  // 3. Chamar Gemini REST API
  const model = process.env.GOOGLE_GEMINI_MODEL || "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

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
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API error:", res.status, errorText);
      return NextResponse.json<ParseError>(
        { success: false, error: "Erro ao comunicar com a API de IA." },
        { status: 502 }
      );
    }

    geminiData = await res.json();
  } catch (err) {
    console.error("Network error calling Gemini:", err);
    return NextResponse.json<ParseError>(
      { success: false, error: "Falha ao conectar com a API de IA." },
      { status: 502 }
    );
  }

  // 4. Extrair texto do response
  const rawText =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

  if (!rawText) {
    return NextResponse.json<ParseError>(
      { success: false, error: "Resposta vazia da API de IA." },
      { status: 502 }
    );
  }

  // 5. Parsear JSON da resposta
  let parsed: GeminiTransaction;
  try {
    // Limpa markdown code fences se vierem na resposta
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned) as GeminiTransaction;
  } catch (err) {
    console.error("JSON parse error from Gemini response:", rawText, err);
    return NextResponse.json<ParseError>(
      { success: false, error: "A IA retornou um formato inesperado." },
      { status: 502 }
    );
  }

  // 6. Validar campos mínimos
  const validTypes = ["entrada", "saida"];
  const validCategories = [
    "Doação",
    "Sub",
    "Patrocínio",
    "Equipamento",
    "Software",
    "Outros",
  ];

  if (
    parsed.tipo === null ||
    parsed.descricao === "mensagem_invalida" ||
    !validTypes.includes(parsed.tipo) ||
    !validCategories.includes(parsed.categoria) ||
    typeof parsed.valor !== "number" ||
    parsed.valor <= 0
  ) {
    // Mensagem não é uma transação válida — retorna erro amigável
    return NextResponse.json<ParseError>(
      {
        success: false,
        error:
          "Não consegui entender essa transação. Tente descrever de forma mais direta, por exemplo: 'Recebi 50 reais de doação' ou 'Gastei 200 no headset'.",
      },
      { status: 422 }
    );
  }

  // 7. Sanitizar descrição (remover aspas e quebras de linha)
  parsed.descricao = parsed.descricao
    .replace(/"/g, "'")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 100);

  return NextResponse.json<ParseResult>({ success: true, transaction: parsed });
}
