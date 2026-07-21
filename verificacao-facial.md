# Verificação Facial - Documentação

## ⚠️ IMPORTANTE: Dados Mockados

> **Esta implementação está em MODO SIMULAÇÃO**. Os dados exibidos durante a verificação facial são **gerados aleatoriamente** e não refletem uma análise real da imagem.
>
> **Intenção futura:** Substituir por integração real com a **Yoti** (https://www.yoti.com/developers/), uma plataforma de identidade digital que oferece:
> - Estimativa de idade por biometria facial
> - Sandbox gratuito para desenvolvimento
> - API REST documentada
>
> Quando integrado, o Yoti receberá a selfie capturada e retornará a idade estimada real com nível de confiança baseado em IA.

---

## Visão Geral

A verificação facial é um componente essencial do fluxo de proteção de menores conforme a **Lei Felca (Lei 15.211/2025 - ECA Digital)**. Ela é usada em dois contextos distintos no projeto:

1. **Para usuários maiores de 18 anos** - confirmação de identidade via selfie
2. **Para responsáveis de menores** - validação da identidade do responsável legal

---

## Fluxo Completo

### 📋 Contexto: Quando a verificação facial é acionada?

```
Usuário acessa /dashboard
        ↓
Tela de verificação de idade
        ↓
Usuário preenche CPF + Data de Nascimento
        ↓
Sistema calcula idade declarada
        ↓
    ┌──────────┴──────────┐
    ↓                     ↓
IDADE >= 18          IDADE < 18
    ↓                     ↓
Yoti Verifica-     Redireciona para
tion (Selfie)      /cadastro-parental
                         ↓
                   Responsável preenche CPF
                         ↓
                   Face Verification
                   (Selfie do Responsável)
```

---

## Componentes

### 1. `YotiVerification.tsx`

**Localização:** `src/components/auth/YotiVerification.tsx`

**Propósito:** Verificar a idade de usuários que declararam ter 18 anos ou mais.

**Fluxo de Estados:**

```
┌──────────────────┐
│  instructions   │ → Tela inicial com botão "Iniciar Câmera"
└────────┬─────────┘
         ↓ (clica em "Iniciar Câmera")
┌──────────────────┐
│     camera       │ → Vídeo ao vivo + moldura do rosto
└────────┬─────────┘
         ↓ (clica em "Capturar Foto")
┌──────────────────┐
│   processing     │ → Loading com a foto capturada
└────────┬─────────┘
         ↓ (após 2 segundos)
┌──────────────────┐
│     result       │ → Mostra resultado da verificação
└──────────────────┘
```

**Dados retornados (MOCKADOS):**

| Campo | Valor | Observação |
|-------|-------|------------|
| `verified` | `true` | Sempre passa na simulação |
| `estimatedAge` | 18-29 anos | Aleatório |
| `confidence` | 85-95% | Aleatório |
| Texto exibido | "Você tem entre 18 e 29 anos" | Fixo |

---

### 2. `ParentFaceVerification.tsx`

**Localização:** `src/components/auth/ParentFaceVerification.tsx`

**Propósito:** Verificar a identidade do **responsável legal** que está vinculando um menor.

**Diferenças em relação ao YotiVerification:**
- Não recebe `declaredAge` como prop
- Simula que a idade estimada é de um adulto (30+)
- Usado no fluxo `/cadastro-parental`

---

## Implementação Atual (Mock)

### 📷 Captura de Imagem

O sistema utiliza a **API de MediaDevices** do navegador (`navigator.mediaDevices.getUserMedia`) para acessar a câmera do usuário:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 640, height: 480, facingMode: "user" },
});
```

### 🎥 Renderização do Vídeo

O vídeo é exibido em um elemento `<video>` com `autoPlay`, `muted` e `playsInline`. Um overlay mostra a moldura onde o rosto deve ser posicionado.

**Detecção de vídeo pronto:**
```typescript
useEffect(() => {
  if (step !== "camera") return;
  
  const checkReady = () => {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      setIsVideoReady(true);
    } else {
      setTimeout(checkReady, 200);
    }
  };
  checkReady();
}, [step]);
```

### 📸 Captura via Canvas

A foto é capturada desenhando o frame atual do vídeo em um `<canvas>`:

```typescript
const canvas = canvasRef.current;
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
const ctx = canvas.getContext("2d");
ctx.drawImage(video, 0, 0);
const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
```

### ⚙️ Processamento (SIMULADO)

**ATENÇÃO:** O "processamento" abaixo é **100% simulado**. Em produção, este passo enviaria a imagem para o Yoti.

```typescript
setTimeout(() => {
  // SIMULAÇÃO - Não usa a imagem real para análise
  const estimatedAge = 18 + Math.floor(Math.random() * 12);
  const confidence = 85 + Math.floor(Math.random() * 10);
  
  const yotiResult = {
    verified: true, // SEMPRE verdadeiro
    estimatedAge,
    confidence,
    sessionId: `yoti_${Date.now()}_...`,
  };
  
  setResult(yotiResult);
}, 2000);
```

**O que está mockado:**
- ❌ Não há análise real da imagem
- ❌ Não há estimativa de idade por IA
- ❌ Não há validação de identidade
- ❌ Não há comparação biométrica

---

## 🔮 Integração Futura com Yoti

### Por que Yoti?

A **Yoti** foi escolhida para integração futura porque:

1. **Sandbox gratuito** - permite desenvolvimento sem custos
2. **API documentada** - REST bem definida
3. **Conformidade LGPD** - empresa europeia com foco em privacidade
4. **Estimativa de idade por IA** - tecnologia madura
5. **Fácil integração** - SDK Node.js disponível

### Como seria a integração real?

```
┌────────────────┐         ┌──────────────┐         ┌─────────┐
│  Frontend      │         │   Backend    │         │  Yoti   │
│                │         │   (Next.js)  │         │  API    │
│ 1. Captura     │         │              │         │         │
│    selfie      │         │              │         │         │
│       ↓        │         │              │         │         │
│ 2. Converte    │ ──POST──→ 3. Valida    │ ──API───→ 4. Análise
│    p/ base64   │  /api/yoti   credenciais│  request   biométrica
│       ↓        │         │       ↓      │         │       ↓
│ 5. Recebe      │         │ 6. Encaminha │ ←─RES─── 7. Retorna
│    resultado   │ ←─JSON──    p/ Yoti     │  idade +   idade +
│                │         │              │  confidence confiança
└────────────────┘         └──────────────┘         └─────────┘
```

### Passo a Passo para integração real:

**1. Criar conta Yoti:**
- Acesse https://www.yoti.com/developers/
- Crie uma conta de desenvolvedor
- Crie um novo app no Sandbox

**2. Obter credenciais:**
- **Client SDK ID** - identificador único do app
- **Chave privada (.pem)** - para autenticação via RSA

**3. Configurar variáveis de ambiente (.env):**
```env
YOTI_CLIENT_SDK_ID=seu-sdk-id-aqui
YOTI_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
```

**4. Implementar endpoint backend (`/api/yoti`):**
```typescript
// Exemplo de estrutura
import crypto from "crypto";

function createYotiSignature(payload: string, privateKey: string): string {
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(payload);
  sign.end();
  return sign.sign(privateKey, "base64");
}

// 1. Criar sessão
const sessionResponse = await fetch("https://api.yoti.com/idverify/v1/sessions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Yoti-Auth-Digest": signature,
    "X-Yoti-Sdk": sdkId,
  },
  body: JSON.stringify({
    client_sdk_id: sdkId,
    session_deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    resources: [{ type: "FACE_CAPTURE" }],
  }),
});

// 2. Upload da imagem
// 3. Obter resultado
// 4. Retornar idade estimada + confiança
```

**5. Substituir a simulação no frontend:**
```typescript
// ANTES (simulado)
setTimeout(() => {
  const estimatedAge = 18 + Math.floor(Math.random() * 12);
  // ...
}, 2000);

// DEPOIS (com Yoti real)
const response = await fetch("/api/yoti", {
  method: "POST",
  body: JSON.stringify({ image: dataUrl }),
});
const yotiResult = await response.json();
```

---

## Segurança e Privacidade

### ✅ O que já está implementado:

- **HTTPS obrigatório** - necessário para acessar a câmera
- **Permissão explícita** - usuário precisa autorizar
- **Imagem apenas no cliente** - não é armazenada no servidor (atualmente)
- **Cleanup automático** - câmera é desligada após captura

### ⚠️ O que precisa ser feito para produção:

- **Criptografia** - imagens devem ser transmitidas via HTTPS
- **LGPD** - adicionar consentimento explícito para processamento de dados biométricos
- **Retenção** - definir por quanto tempo a imagem fica armazenada
- **Exclusão** - permitir que o usuário solicite exclusão dos dados
- **Logs de auditoria** - registrar todas as verificações realizadas

---

## Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/auth/YotiVerification.tsx` | Verificação para maiores de 18 |
| `src/components/auth/ParentFaceVerification.tsx` | Verificação do responsável |
| `src/app/(auth)/cadastro-parental/page.tsx` | Fluxo de cadastro do responsável |
| `src/components/auth/AgeGate.tsx` | Barreira de entrada (decide qual fluxo) |
| `src/lib/cpfValidation.ts` | Cálculo de idade e validação de CPF |

---

## Como Testar

### Cenário 1: Usuário >= 18 anos
1. Acesse `/dashboard`
2. Preencha CPF válido
3. Data de nascimento com idade >= 18
4. Clique em "Continuar"
5. Clique em "Iniciar Câmera" (permita acesso)
6. Posicione o rosto na moldura
7. Clique em "Capturar Foto"
8. ✅ Resultado: "Você tem entre 18 e 29 anos"
9. Clique em "Continuar" → acessa o dashboard

### Cenário 2: Usuário < 18 anos
1. Acesse `/dashboard`
2. Preencha CPF válido
3. Data de nascimento com idade < 18
4. Sistema mostra "Menor de 18 anos"
5. Clique em "Preenchimento Parental"
6. Responsável preenche seu CPF
7. Clica em "Continuar"
8. Responsável faz verificação facial
9. ✅ Vínculo criado
10. Menor recebe código para acessar

---

## 📝 Notas Finais

- **Esta é uma simulação** - nenhum dado biométrico é realmente processado
- **Para o Yoti real** - é necessário criar conta e obter credenciais
- **Custo** - Yoti Sandbox é gratuito, produção tem custos variáveis
- **Privacidade** - dados biométricos são sensíveis, sempre ter cuidado com LGPD
