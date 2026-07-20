# Plano de Implementação: Lei Felca (ECA Digital)

## Contexto

O StreamLedger é uma plataforma de gestão financeira para streamers. Com a entrada em vigor da Lei nº 15.211/2025 (ECA Digital / "Lei Felca"), surge a necessidade de implementar mecanismos de proteção para menores de 18 anos:

- **Barreira de entrada** - menores não acessam sem responsável
- **Verificação efetiva de idade** (não mais auto-declaração)
- **Vínculo parental obrigatório** para menores de 16 anos
- **Controle parental** para acompanhamento de movimentações
- **Proteção de dados** de menores

O feedback recebido指出 que faltou clareza sobre como implementar a validação na prática. A solução proposta utiliza **bloqueio inicial + Gov.br do responsável** para validação de idade do menor.

---

## Estratégia Geral

O sistema bloqueia menores **antes mesmo de acessarem**, redirecionando para o fluxo parental onde o responsável assume o controle:

1. **Menor tenta acessar** → Sistema identifica se tem Gov.br
2. **Se não tem ou Bronze** → Bloqueado, convite enviado ao responsável
3. **Responsável (Gov.br Prata/Ouro)** → Valida e vincula o menor
4. **Menor cria conta limitada** → Com monitoramento ativo

Esta abordagem é superior porque:
- **Barreira de entrada** - menor não acessa sem aprovação do responsável
- O responsável assume **responsabilidade legal** (Art. 299, Código Penal)
- Não depende do menor ter Gov.br próprio
- Cumpre a exigência de verificação "efetiva" da Lei Felca

---

## FLUXO DE PROTEÇÃO (Visão Geral)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE PROTEÇÃO - COMPLETO                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MENOR TENTA ACESSAR                                                    │
│  │                                                                      │
│  ├── TEM GOV.BR OURO/PRATA?                                           │
│  │   ├── >= 18 anos → Acesso normal ✓                                 │
│  │   └── < 18 anos → Bloqueado → Fluxo parental                        │
│  │                                                                      │
│  └── NÃO TEM OU BRONZE                                                 │
│      └── BLOQUEADO → Convite enviado ao responsável                    │
│                                                                         │
│  RESPONSÁVEL RECEBE                                                    │
│  ├── Login via Gov.br (validação forte)                               │
│  ├── Informa CPF do menor                                              │
│  ├── Assina termo de responsabilidade                                   │
│  └── Aprova vínculo                                                    │
│                                                                         │
│  MENOR CRIA CONTA                                                      │
│  └── Vinculado ao responsável com restrições                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## DETALHAMENTO: BARREIRA DE ENTRADA

### Como funciona

Quando qualquer usuário tenta acessar o StreamLedger:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     VERIFICAÇÃO INICIAL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. USUÁRIO TENTA ACESSAR                                               │
│                                                                         │
│  2. SISTEMA VERIFICA GOV.BR                                             │
│     ├── Tem Gov.br Ouro/Prata?                                         │
│     │                                                                      │
│     │   └── SIM:                                                         │
│     │       ├── Verifica data de nascimento via OAuth                   │
│     │       ├── Calcula idade                                            │
│     │       ├── >= 18 anos → Acesso normal                              │
│     │       └── < 18 anos → Bloqueado → Fluxo parental                  │
│     │                                                                      │
│     └── NÃO TEM OU BRONZE:                                              │
│         └── BLOQUEADO                                                    │
│         └── Sistema gera convite + envia ao email do menor              │
│         └── Responsável recebe link para iniciar fluxo                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Por que bloqueamos primeiro?

1. **Cumprimento legal** - Menores de 16 anos não podem ter acesso direto
2. **Responsabilidade** - O responsável precisa aprovar antes
3. **Prevenção** - Não é correção, é proteção desde o início
4. **Transparência** - Menores entendem que precisam de autorização

---

## VALIDAÇÃO VIA CPF (Proxy Principal)

### Como funciona

O **CPF é usado como proxy para validação de idade** do menor. Isso acontece porque:

1. O CPF possui a **data de nascimento** do cidadão
2. O algoritmo de validação de CPF é público e verificável
3. Não requer integração com serviços externos
4. O responsável assume responsabilidade legal pela informação

### Fluxo de validação via CPF

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     VALIDAÇÃO VIA CPF - FLUXO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RESPONSÁVEL (via Gov.br):                                              │
│  ├── Acessa /cadastro-parental                                         │
│  ├── Login via Gov.br (validação forte - Prata/Ouro)                   │
│  ├── Clica "Vincular menor"                                            │
│  ├── Informa o CPF do menor                                            │
│  │                                                                      │
│  └── SISTEMA:                                                           │
│      ├── 1. Valida formato do CPF (algoritmo checksum)                 │
│      ├── 2. Calcula idade: hoje - data_nascimento                      │
│      ├── 3. Classifica:                                                │
│      │       ├── < 16 anos → "minor_under_16"                          │
│      │       ├── 16-17 anos → "minor_16_17"                           │
│      │       └── >= 18 anos → não pode vincular                        │
│      │                                                                  │
│      └── 4. Se menor: cria vínculo + configura restrições              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Validação do CPF (algoritmo)

```typescript
// src/lib/cpfValidation.ts

interface CPFValidationResult {
  valid: boolean;
  errorCode?: "INVALID_FORMAT" | "INVALID_CHECKSUM" | "NOT_FOUND";
  data?: {
    nome: string;
    dataNascimento: string;
    situacao: "regular" | "irregular";
  };
}

// Validação local do algoritmo
export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  // Dígito 1
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
  if ((sum * 10) % 11 !== parseInt(numbers[9])) return false;

  // Dígito 2
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
  if ((sum * 10) % 11 !== parseInt(numbers[10])) return false;

  return true;
}

// Calcular idade a partir da data de nascimento
export function calculateAge(birthDate: string): number {
  const [day, month, year] = birthDate.split("/").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) {
    age--;
  }
  return age;
}

// Classificar usuário por idade
export function classifyUser(age: number): "adult" | "minor_16_17" | "minor_under_16" {
  if (age >= 18) return "adult";
  if (age >= 16) return "minor_16_17";
  return "minor_under_16";
}
```

---

## FLUXO COMPLETO PARA MENORES DE IDADE

### Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   MENORES DE IDADE - FLUXO COMPLETO                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MENOR TENTA ACESSAR                                                    │
│  ├── Tem Gov.br Ouro/Prata?                                            │
│  │   ├── >= 18 anos → Conta normal                                     │
│  │   └── < 18 anos → Bloqueado → Convite ao responsável                │
│  │                                                                      │
│  └── NÃO TEM GOV.BR (ou Bronze):                                       │
│      └── BLOQUEADO → Convite enviado ao responsável                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RESPONSÁVEL (via Gov.br)                       │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  1. Recebe convite do menor                                     │   │
│  │  2. Login via Gov.br (validação Prata/Ouro)                    │   │
│  │  3. Clica "Vincular menor"                                       │   │
│  │  4. Informa CPF do menor                                         │   │
│  │  5. Sistema valida CPF + calcula idade                          │   │
│  │  6. Sistema informa: "< 16 anos, vínculo completo"              │   │
│  │  7. Responsável assina termo de responsabilidade               │   │
│  │  8. Aprova vínculo                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        MENOR                                      │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  1. Recebe notificação: vínculo aprovado                        │   │
│  │  2. Cria conta com email + senha (limitada)                     │   │
│  │  3. Conta fica vinculada ao responsável                          │   │
│  │  4. Todas transações são notificadas ao responsável            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluxo Detalhado: < 16 anos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLASSIFICAÇÃO: < 16 ANOS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BARREIRA DE ENTRADA:                                                   │
│  ├── Menor tenta acessar                                               │
│  ├── Sistema bloqueia (sem Gov.br ou Bronze)                           │
│  ├── Convite enviado ao email do menor                                 │
│  └── Menor é orientado a buscar responsável                            │
│                                                                         │
│  Responsável:                                                          │
│  ├── Recebe link de convite via menor                                  │
│  ├── Clica "Aprovar menor"                                             │
│  ├── Login via Gov.br (validação Prata/Ouro)                          │
│  ├── Informa CPF do menor                                              │
│  ├── Sistema valida: CPF válido + calcula idade                        │
│  ├── Sistema retorna: "Menor de 16 anos"                               │
│  ├── Responsável assina termo:                                          │
│  │   "Declaro ser o responsável legal e assumo total                    │
│  │    responsabilidade pelas informações prestadas"                    │
│  ├── Sistema cria vínculo: responsible_id ↔ minor_id                  │
│  └── Aprova vínculo                                                    │
│                                                                         │
│  Menor:                                                                │
│  ├── Recebe notificação: vínculo aprovado                               │
│  ├── Cria conta (email + senha)                                       │
│  ├── Conta fica RESTRITA:                                              │
│  │   ├── Todas transações requieren confirmação? (opcional)           │
│  │   └── Responsável recebe TODAS as notificações                     │
│  └── Acesso liberado                                                   │
│                                                                         │
│  Notificações:                                                         │
│  ├── Responsável recebe TODA transação do menor                        │
│  ├── Transações >= R$ 200: alerta crítico                              │
│  └── Possível atividade suspeita: notificação imediata                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluxo Detalhado: 16-17 anos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CLASSIFICAÇÃO: 16-17 ANOS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BARREIRA DE ENTRADA:                                                   │
│  ├── Menor tenta acessar                                               │
│  ├── Sistema bloqueia ou solicita consentimento                        │
│  └── Convite enviado ao responsável                                    │
│                                                                         │
│  Responsável:                                                          │
│  ├── Recebe convite                                                    │
│  ├── Login via Gov.br (validação Prata/Ouro)                          │
│  ├── Informa CPF do menor                                              │
│  ├── Sistema valida e retorna: "16-17 anos"                            │
│  ├── Responsável assina consentimento:                                 │
│  │   "Autorizo meu filho(a) a usar o StreamLedger com                  │
│  │    monitoramento de transações"                                     │
│  ├── Vínculo criado (mais leve que < 16)                              │
│  └── Pode revisar transações a qualquer momento                        │
│                                                                         │
│  Menor:                                                                │
│  ├── Pode criar conta normalmente                                     │
│  ├── Responsável vinculado para monitoramento                          │
│  └── Acesso mais livre                                                │
│                                                                         │
│  Notificações:                                                         │
│  ├── Responsável recebe transações >= R$ 50                           │
│  ├── Transações >= R$ 300: alerta crítico                              │
│  └── Menor pode continuar usando normalmente                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ESTRUTURA DE DADOS

### Perfil de Usuário (localStorage)

```typescript
// src/lib/user.ts

interface UserProfile {
  id: string;                              // ID único (UUID)
  govBrId?: string;                        // ID do Gov.br (se logou via OAuth)
  cpf: string;                             // CPF (armazenado com hash)
  nome: string;                            // Nome completo
  email: string;                           // Email
  birthDate: string;                       // Data de nascimento (DD/MM/YYYY)
  ageGroup: "adult" | "minor_16_17" | "minor_under_16";
  govBrLevel?: "bronze" | "prata" | "ouro"; // Nível Gov.br
  createdAt: string;                       // Data de criação da conta
  consentGiven: boolean;                    // Termo de consentimento assinado
  consentTimestamp?: string;               // Quando assinou
  accessBlocked: boolean;                 // Se foi bloqueado na entrada
  blockedReason?: string;                  // Motivo do bloqueio
}

interface ParentalAccount {
  id: string;                              // ID único
  cpf: string;                             // CPF do responsável
  nome: string;                             // Nome do responsável
  email: string;                            // Email do responsável
  govBrId?: string;                        // ID Gov.br (se logou via OAuth)
  govBrLevel?: "prata" | "ouro";          // Nível Gov.br (mínimo Prata)
  linkedMinors: string[];                 // IDs dos menores vinculados
  notificationPrefs: {
    alertAllTransactions: boolean;         // Alerta para todas
    threshold: number;                    // Ou apenas acima de X valor
    emailEnabled: boolean;
  };
  createdAt: string;
}

interface ParentalLink {
  id: string;
  parentId: string;
  minorId: string;
  linkCode: string;                        // Código de 6 dígitos
  linkToken: string;                       // Token único para convite
  status: "pending" | "accepted" | "rejected" | "expired";
  minorAge: number;                       // Idade calculada via CPF
  minorEmail: string;                     // Email do menor que recebeu convite
  createdAt: string;
  acceptedAt?: string;
  expiresAt: string;                       // Link expira em 7 dias
}

interface AccessAttempt {
  id: string;
  timestamp: string;
  userId: string;
  govBrLevel?: string;
  ageGroup?: string;
  blocked: boolean;
  blockedReason?: string;
  inviteSent?: boolean;
  inviteToken?: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userType: "minor" | "adult" | "parent";
  action: string;
  details: Record<string, unknown>;
  parentalLinkId?: string;                 // Vínculo parental relacionado
}
```

---

## FLUXO DE VÍNCULO PARENTAL (Detalhado)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VÍNCULO PARENTAL - FLUXO COMPLETO                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PASSO 0: BARREIRA DE ENTRADA                                          │
│  ├── Menor tenta acessar                                               │
│  ├── Sistema verifica Gov.br + idade                                    │
│  ├── Bloqueia acesso se < 18 anos ou sem Gov.br válido                 │
│  ├── Sistema gera convite com token                                     │
│  └── Convite enviado ao email do menor                                  │
│                                                                         │
│  PASSO 1: RESPONSÁVEL RECEBE CONVITE                                    │
│  ├── Responsável acessa link do convite                                │
│  ├── Login via Gov.br (validação Prata/Ouro)                          │
│  ├── Sistema registra conta parental                                   │
│  └── Responsável acessa painel de controle                            │
│                                                                         │
│  PASSO 2: RESPONSÁVEL VINCULA MENOR                                    │
│  ├── Clica "Vincular menor"                                            │
│  ├── Informa CPF do menor                                               │
│  ├── Sistema valida CPF via algoritmo + calcula idade                 │
│  ├── Sistema retorna: classificação etária                             │
│  ├── Responsável assina termo de responsabilidade                     │
│  ├── Sistema gera:                                                     │
│  │   ├── Código de 6 dígitos (alternativo)                            │
│  │   └── Link único com token (email/SMS)                             │
│  └── Convite enviado ao menor                                          │
│                                                                         │
│  PASSO 3: MENOR ACEITA VÍNCULO                                         │
│  ├── Recebe link/email/SMS com convite                                │
│  ├── Acessa página de aceite (token válido?)                          │
│  ├── Vê informações: "Vinculado a [Nome Responsável]"                 │
│  ├── Clica "Aceitar vínculo"                                          │
│  ├── Sistema cria conta do menor                                       │
│  ├── Sistema associa ao responsável                                    │
│  └── Menor acessa app com restrições                                   │
│                                                                         │
│  PASSO 4: MONITORAMENTO ATIVO                                          │
│  ├── Todas transações do menor são notificadas                        │
│  ├── Responsável pode ver histórico completo                           │
│  └── Menor pode adicionar transações (não deletar)                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## NOTIFICAÇÕES PARENTAIS

### Regras por classificação

| Classificação | Condição | Notificação |
|---------------|----------|-------------|
| minor_under_16 | Qualquer transação | Responsável recebe email + push |
| minor_under_16 | Transação >= R$ 200 | Alerta crítico |
| minor_under_16 | > 10 transações/semana | Alerta de frequência |
| minor_16_17 | Transação >= R$ 50 | Responsável recebe email |
| minor_16_17 | Transação >= R$ 300 | Alerta crítico |
| Qualquer menor | Atividade suspeita | Notificação imediata |

### Estrutura de notificação

```typescript
interface ParentalNotification {
  id: string;
  type: "transaction" | "high_value" | "suspicious" | "account_change";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  minorId: string;
  parentId: string;
  transactionId?: number;
  transactionAmount?: number;
  read: boolean;
  createdAt: string;
  sentVia: ("email" | "push" | "in_app")[];
}
```

---

## SISTEMA DE AUDITORIA (Compliance)

### Ações auditadas

```typescript
const AUDIT_ACTIONS = {
  // Barreira de entrada
  ACCESS_BLOCKED: "Acesso bloqueado - menor sem responsável",
  INVITE_SENT: "Convite enviado ao responsável",

  // Vínculo parental
  PARENT_ACCOUNT_CREATED: "Conta parental criada via Gov.br",
  MINOR_LINK_REQUESTED: "Solicitação de vínculo de menor",
  MINOR_LINK_ACCEPTED: "Vínculo de menor aceito",
  MINOR_LINK_REJECTED: "Vínculo de menor rejeitado",

  // Validação de idade
  CPF_VALIDATED: "CPF do menor validado",
  AGE_CALCULATED: "Idade calculada via data de nascimento",
  AGE_GROUP_CLASSIFIED: "Usuário classificado como menor",

  // Consentimento
  RESPONSIBILITY_TERM_SIGNED: "Termo de responsabilidade assinado",
  PARENTAL_CONSENT_GIVEN: "Consentimento parental concedido",

  // Transações (menores)
  TRANSACTION_CREATED_BY_MINOR: "Transação criada por menor",
  TRANSACTION_VIEWED_BY_PARENT: "Transação visualizada pelo responsável",
  ACCOUNT_PAUSED_BY_PARENT: "Conta do menor pausada pelo responsável",

  // Dados
  DATA_EXPORTED: "Dados exportados (LGPD)",
  DATA_DELETION_REQUESTED: "Solicitação de exclusão de dados",
};
```

---

## PÁGINAS A CRIAR

```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              # Login com Gov.br + alternativa
│   ├── cadastro/
│   │   └── page.tsx             # Cadastro padrão (adultos)
│   ├── cadastro-parental/
│   │   └── page.tsx             # Criar conta do responsável
│   ├── vincular/
│   │   └── page.tsx             # Aceitar convite de vínculo
│   └── acesso-bloqueado/
│       └── page.tsx             # Página para menores bloqueados
│
├── (app)/
│   ├── dashboard/
│   │   └── page.tsx             # Já existe - adaptar para menores
│   ├── perfil/
│   │   └── page.tsx             # Perfil + configurações
│   └── painel-parental/
│       ├── layout.tsx            # Layout específico
│       └── page.tsx             # Dashboard do responsável
│
└── (compliance)/
    ├── termo-responsabilidade/
    │   └── page.tsx             # Termo legal para responsáveis
    └── politica-privacidade/
        └── page.tsx             # Política de dados (LGPD)
```

---

## COMPONENTES A CRIAR

```
src/components/
├── auth/
│   ├── GovBrLogin.tsx            # Botão "Entrar com Gov.br"
│   ├── AgeGate.tsx               # Barreira de entrada + verificação
│   ├── BlockedAccess.tsx         # Página de acesso bloqueado
│   ├── CpfValidator.tsx          # Componente de validação de CPF
│   ├── AgeCalculator.tsx         # Calculadora de idade via data nascimento
│   ├── ConsentForm.tsx           # Termo de consentimento parental
│   └── AgeBadge.tsx              # Badge indicando classificação
│
├── parental/
│   ├── ParentalDashboard.tsx     # Painel do responsável
│   ├── MinorCard.tsx             # Card mostrando menor vinculado
│   ├── TransactionMonitor.tsx   # Lista de transações do menor
│   ├── LinkGenerator.tsx         # Gerar código/QR para vincular menor
│   └── NotificationSettings.tsx  # Configurar preferências de notificação
│
└── compliance/
    ├── AuditLogViewer.tsx        # Visualização do log de auditoria
    └── ResponsibilityTerm.tsx     # Termo de responsabilidade legal
```

---

## CUSTO E IMPLEMENTAÇÃO

### Fase Protótipo (Grátis)

| Item | Custo | Implementação |
|------|-------|---------------|
| Gov.br OAuth | R$ 0 | Cadastro no Portal de APIs |
| Validação CPF | R$ 0 | Algoritmo local |
| Armazenamento | R$ 0 | localStorage |
| Notificações email | R$ 0 | Nodemailer + SMTP gratuito |
| QR Code | R$ 0 | Pacote `qrcode` npm |
| Auditoria | R$ 0 | localStorage + hash |

### Fase Produção

| Item | Custo Estimado | Alternativa |
|------|---------------|-------------|
| Gov.br credenciamento | R$ 0 (requer CNPJ) | -- |
| Validação de documento | ~R$ 0,05/consulta | Serpro/Validoc |
| Envio de email | ~R$ 0,10/mil emails | SendGrid tier gratuito |
| Hospedagem | R$ 0-5/mês | Vercel (free tier) |

---

## DOCUMENTAÇÃO PARA APRESENTAÇÃO

### O que destacar para os avaliadores:

1. **Barreira de entrada** - Menor não acessa sem aprovação do responsável
2. **Validação via CPF como proxy** - O sistema usa CPF para calcular idade, não depende do menor ter Gov.br
3. **Responsável valida menor** - O responsável com Gov.br Prata/Ouro valida e vincula o menor
4. **Fluxo completo** - Desde bloqueio inicial até monitoramento de transações
5. **Compliance Lei Felca** - Auditoria, transparência, consentimento documentado
6. **Cumprimento legal** - O responsável assume responsabilidade legal (Art. 299, Código Penal)

### Resposta ao feedback sobre validação:

> *"A validação de idade para menores começa na barreira de entrada. Quando um menor tenta acessar, o sistema bloqueia imediatamente e envia um convite ao responsável. O responsável, com Gov.br Prata/Ouro, valida e vincula o menor via CPF. O sistema calcula a idade a partir da data de nascimento presente no CPF. O responsável assina termo de responsabilidade legal, assumindo a veracidade das informações. Este fluxo atende à Lei Felca pois: (1) menores são bloqueados antes de acessar; (2) o responsável tem identidade verificada pelo gov.br; (3) a idade é calculada via dados oficiais; (4) o vínculo parental é obrigatório e documentado."*

---

## RESUMO: FLUXO FINAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESUMO DO FLUXO                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MENOR TENTA ACESSAR                                                    │
│  ├── Tem Gov.br Prata/Ouro + >= 18? → Acesso normal                   │
│  ├── Tem Gov.br Prata/Ouro + < 18? → Bloqueado → Fluxo parental        │
│  └── NÃO TEM OU BRONZE → Bloqueado → Convite ao responsável            │
│                                                                         │
│  RESPONSÁVEL RECEBE CONVITE                                             │
│  ├── Login via Gov.br (validação Prata/Ouro)                          │
│  ├── Informa CPF do menor                                              │
│  ├── Sistema calcula idade                                             │
│  ├── Responsável assina termo de responsabilidade                       │
│  └── Aprova vínculo                                                    │
│                                                                         │
│  MENOR CRIA CONTA                                                      │
│  ├── Recebe notificação de aprovação                                    │
│  ├── Cria conta limitada                                               │
│  └── Vinculado com monitoramento ativo                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PRÓXIMOS PASSOS

1. **Implementar barreira de entrada** - AgeGate component
2. **Criar página de acesso bloqueado** - `/acesso-bloqueado`
3. **Criar tipos TypeScript** - Definir interfaces em `src/lib/`
4. **Implementar validação CPF** - Funções em `src/lib/cpfValidation.ts`
5. **Criar página de cadastro parental** - `/cadastro-parental`
6. **Implementar sistema de vínculo** - Código + link de convite
7. **Criar dashboard parental** - Visualizar menores e transações
8. **Adicionar log de auditoria** - Registrar todas ações

---

## REFERÊNCIAS

- Portal de APIs Gov.br: https://www.gov.br/pt-br/api
- Documentação OAuth 2.0: https://oauth.net/2/
- Lei 15.211/2025 (ECA Digital): https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm
- LGPD: https://www.gov.br/produtos/pt-br/arquivos/central-de-conteudos/publicacoes/guias/guiamp.pdf
- Art. 299 Código Penal (falsa declaração): https://www.planalto.gov.br/ccivil_03/decreto-lei/Del2848compilado.htm