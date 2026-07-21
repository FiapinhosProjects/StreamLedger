# Validação de CPF - Documentação

## ⚠️ IMPORTANTE: Limitação Atual

> **Esta implementação valida apenas o FORMATO do CPF** (dígitos verificadores), **NÃO consulta a base de dados real** da Receita Federal.
>
> **O que isso significa:**
> - ✅ Verificamos se o CPF é matematicamente válido
> - ✅ Impedimos CPFs com formato incorreto (ex: 111.111.111-11)
> - ❌ **NÃO verificamos** se o CPF pertence à pessoa que está usando
> - ❌ **NÃO consultamos** dados cadastrais reais
> - ❌ **NÃO validamos** a data de nascimento associada ao CPF
>
> **Para uma validação completa e confiável, seria necessário integração com:**
> - **API da Receita Federal** (requer credenciamento com CNPJ)
> - **Gov.br** (OAuth oficial com dados verificados)
> - **Bureau de crédito** (Serasa, SPC, etc.)
>
> A Lei Felca exige **verificação efetiva** de idade, o que requer integração com serviços oficiais. Esta implementação atual é um **protótipo acadêmico** que demonstra o fluxo conceitual.

---

## Visão Geral

A validação de CPF é o primeiro passo no fluxo de proteção de menores. Ela garante que o usuário insere um documento matematicamente válido antes de prosseguir com a verificação de idade.

**Arquivo principal:** `src/lib/cpfValidation.ts`

---

## Como Funciona

### Estrutura de um CPF

Um CPF (Cadastro de Pessoas Físicas) possui 11 dígitos no formato `XXX.XXX.XXX-XX`:

```
1 1 1 . 4 4 4 . 7 7 7 - 3 6
└─────────────┘ └───┘
   9 primeiros    2 dígitos
    dígitos      verificadores
```

Os **2 últimos dígitos** são calculados a partir dos 9 primeiros usando um algoritmo público (checksum).

---

## Algoritmo de Validação

### Passo 1: Limpar o CPF

Remove todos os caracteres não numéricos:

```typescript
const numbers = cpf.replace(/\D/g, "");
// "123.456.789-00" → "12345678900"
```

### Passo 2: Verificar tamanho

O CPF deve ter exatamente 11 dígitos:

```typescript
if (numbers.length !== 11) return false;
```

### Passo 3: Rejeitar CPFs inválidos conhecidos

CPFs com todos os dígitos iguais são inválidos (ex: `111.111.111-11`):

```typescript
if (/^(\d)\1+$/.test(numbers)) return false;
```

**CPFs rejeitados:**
- `000.000.000-00`
- `111.111.111-11`
- `222.222.222-22`
- ... até `999.999.999-99`

### Passo 4: Validar primeiro dígito verificador

Multiplica os 9 primeiros dígitos por pesos de 10 a 2 e calcula o resto:

```typescript
let sum = 0;
for (let i = 0; i < 9; i++) {
  sum += parseInt(numbers[i]) * (10 - i);
}
const firstDigit = (sum * 10) % 11;
const expectedFirst = firstDigit === 10 ? 0 : firstDigit;
if (expectedFirst !== parseInt(numbers[9])) return false;
```

**Exemplo:**
```
CPF: 123.456.789-09

Cálculo do 1º dígito:
1*10 + 2*9 + 3*8 + 4*7 + 5*6 + 6*5 + 7*4 + 8*3 + 9*2
= 10 + 18 + 24 + 28 + 30 + 30 + 28 + 24 + 18
= 210

(210 * 10) % 11 = 2100 % 11 = 10 → primeiro dígito = 0
```

### Passo 5: Validar segundo dígito verificador

Multiplica os 10 primeiros dígitos por pesos de 11 a 2:

```typescript
let sum = 0;
for (let i = 0; i < 10; i++) {
  sum += parseInt(numbers[i]) * (11 - i);
}
const secondDigit = (sum * 10) % 11;
const expectedSecond = secondDigit === 10 ? 0 : secondDigit;
if (expectedSecond !== parseInt(numbers[10])) return false;
```

---

## Funções Disponíveis

### `validateCPF(cpf: string): boolean`

Valida se um CPF é matematicamente correto.

**Parâmetros:**
- `cpf` - String com o CPF (pode ter pontuação ou não)

**Retorno:** `true` se válido, `false` se inválido

**Exemplo:**
```typescript
validateCPF("123.456.789-09"); // true ou false
validateCPF("12345678909");    // mesmo resultado
```

### `formatCPF(cpf: string): string`

Formata o CPF no padrão `XXX.XXX.XXX-XX`.

**Parâmetros:**
- `cpf` - String com o CPF (apenas números ou com formatação)

**Retorno:** String formatada

**Exemplo:**
```typescript
formatCPF("12345678900"); // "123.456.789-00"
```

### `calculateAge(birthDate: string): number`

Calcula a idade a partir da data de nascimento.

**Parâmetros:**
- `birthDate` - Data no formato `DD/MM/YYYY`

**Retorno:** Idade em anos

**Exemplo:**
```typescript
calculateAge("15/06/2000"); // 26 (se hoje for 2026)
```

### `classifyUser(age: number): AgeGroup`

Classifica o usuário por faixa etária.

**Retorno:**
- `"adult"` - 18 anos ou mais
- `"minor_16_17"` - 16 ou 17 anos
- `"minor_under_16"` - menos de 16 anos

**Exemplo:**
```typescript
classifyUser(20); // "adult"
classifyUser(15); // "minor_under_16"
```

---

## Fluxo no Projeto

### Onde a validação é usada?

```
┌─────────────────┐
│  AgeGate        │ ← Barreira de entrada
│  (Tela inicial) │
└────────┬────────┘
         ↓
   1. Usuário digita CPF
         ↓
   2. handleCpfChange formata (xxx.xxx.xxx-xx)
         ↓
   3. Usuário digita data de nascimento
         ↓
   4. Clica em "Continuar"
         ↓
   5. handleValidate() chama validateCPF()
         ↓
    ┌────┴────┐
    │ Válido? │
    └────┬────┘
   SIM   │   NÃO
    ↓    │    ↓
 Continua │  "CPF inválido"
         │
   6. calculateAge() calcula idade
         ↓
   7. classifyUser() classifica
         ↓
   ┌────┴────┐
   │ >= 18? │
   └────┬────┘
  SIM    │   NÃO
   ↓     │    ↓
 Yoti    │  Cadastro
 Selfie  │  Parental
```

### Componentes que usam validação de CPF:

| Componente | Uso |
|------------|-----|
| `AgeGate` | Valida CPF do usuário |
| `cadastro-parental` | Valida CPF do responsável |
| `ConsentForm` | Valida CPF do menor (vinculação) |

---

## Exemplos de CPFs Válidos para Teste

**CPFs matematicamente válidos (podem ser usados para teste):**

| CPF | Observação |
|-----|-----------|
| `123.456.789-09` | CPF clássico de teste |
| `111.444.777-35` | Outro CPF válido para teste |
| `000.000.001-91` | Com zeros à esquerda |

**⚠️ Atenção:** Esses CPFs são matematicamente válidos mas não pertencem a pessoas reais. Para testes apenas.

---

## 🔮 Integração Futura: Receita Federal

### Por que precisamos de integração real?

O algoritmo atual **só valida o formato**, não os dados reais. Para cumprir a Lei Felca, precisamos garantir que:
- O CPF realmente existe
- Pertence à pessoa que está usando
- A data de nascimento declarada é a mesma do CPF

### Opções de integração:

#### Opção 1: API Receita Federal (Oficial)
- **Custo:** Gratuito (requer credenciamento com CNPJ)
- **Tempo:** Semanas para aprovação
- **Dados retornados:** Nome, situação, data de nascimento

#### Opção 2: Gov.br OAuth
- **Custo:** Gratuito (requer CNPJ)
- **Tempo:** Semanas para aprovação
- **Dados:** Todos os dados verificados do cidadão

#### Opção 3: API Pública (receitaws.com.br)
- **Custo:** Gratuito
- **Tempo:** Imediato
- **Limitação:** API não-oficial, pode ficar offline

### Exemplo de integração com Receita Federal:

```typescript
// Exemplo - NÃO funcional, apenas ilustrativo
async function consultarReceitaFederal(cpf: string) {
  const response = await fetch(`https://receitaws.com.br/v1/cpf/${cpf}`);
  const data = await response.json();
  
  return {
    nome: data.nome,
    dataNascimento: data.data_nascimento, // "25/03/1990"
    situacao: data.situacao, // "REGULAR" ou "IRREGULAR"
  };
}
```

### Fluxo com integração real:

```
Usuário digita CPF
       ↓
Valida formato (algoritmo atual)
       ↓
Consulta Receita Federal
       ↓
Recebe data de nascimento REAL
       ↓
Compara com data DECLARADA pelo usuário
       ↓
    ┌────┴────┐
    │ Bate?   │
    └────┬────┘
   SIM   │   NÃO
    ↓    │    ↓
 Permite │ Bloqueia
         │ (falsa declaração)
```

---

## Segurança e Privacidade

### ✅ O que já está implementado:
- Validação matemática robusta
- Rejeição de CPFs conhecidos como inválidos
- Formatação automática para melhor UX
- Aviso legal sobre Art. 299 do Código Penal (falsa declaração)

### ⚠️ Limitações conhecidas:
- Não impede uso de CPF de terceiros
- Não valida propriedade do documento
- Não consulta dados oficiais

### 🔒 Para produção:
- Implementar rate limiting (evitar ataques de força bruta)
- Criptografar CPF em trânsito e armazenamento
- Conformidade total com LGPD
- Logs de auditoria para tentativas
- Integração com base oficial (Receita/Gov.br)

---

## Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/cpfValidation.ts` | Funções de validação (algoritmo principal) |
| `src/lib/user-types.ts` | Tipos TypeScript relacionados a usuário |
| `src/hooks/useAgeVerification.ts` | Hook que gerencia verificação de idade |
| `src/components/auth/AgeGate.tsx` | Componente que usa a validação |
| `src/app/(auth)/cadastro-parental/page.tsx` | Cadastro do responsável |

---

## Como Testar

### Cenário 1: CPF Válido
1. Acesse `/dashboard`
2. Digite CPF: `123.456.789-09`
3. Formatação automática: `123.456.789-09`
4. Sistema aceita ✅

### Cenário 2: CPF Inválido (formato)
1. Digite CPF: `111.111.111-11`
2. Sistema rejeita: "CPF inválido" ❌

### Cenário 3: CPF Incompleto
1. Digite CPF: `123.456`
2. Sistema rejeita: "CPF deve ter 11 dígitos" ❌

### Cenário 4: Menor de Idade
1. CPF válido + Data de nascimento com < 18 anos
2. Sistema classifica como menor
3. Redireciona para cadastro parental 🔄

### Cenário 5: Maior de Idade
1. CPF válido + Data com >= 18 anos
2. Sistema classifica como adulto
3. Prossegue para verificação facial (Yoti) ✅

---

## 📝 Notas Finais

- **Esta é uma validação de PROTÓTIPO** - apenas verifica formato
- **Para produção** - integração com Receita Federal é obrigatória
- **Lei Felca** - exige verificação "efetiva" de idade
- **LGPD** - dados pessoais (incluindo CPF) têm proteção especial
- **Lei 15.211/2025** - Art. 299 do Código Penal pune falsa declaração
