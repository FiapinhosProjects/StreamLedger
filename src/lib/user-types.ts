// ============================================
// user-types.ts - Tipos para autenticação e verificação de idade
// Conforme plano Lei Felca
// ============================================

// Classificação do usuário por idade
export type AgeGroup = "adult" | "minor_16_17" | "minor_under_16";

// Nível do Gov.br
export type GovBrLevel = "bronze" | "prata" | "ouro";

// Status do vínculo parental
export type ParentalLinkStatus = "pending" | "accepted" | "rejected" | "expired";

// Perfil do usuário verificado
export interface UserProfile {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  birthDate: string; // DD/MM/YYYY
  ageGroup: AgeGroup;
  govBrLevel: GovBrLevel;
  consentGiven: boolean;
  consentTimestamp?: string;
  linkedParentId?: string; // Se for menor, ID do responsável
  createdAt: string;
}

// Conta do responsável legal
export interface ParentalAccount {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  govBrLevel: GovBrLevel;
  linkedMinors: string[]; // IDs dos menores vinculados
  notificationPrefs: NotificationPrefs;
  createdAt: string;
}

export interface NotificationPrefs {
  alertAllTransactions: boolean;
  threshold: number; // Valor mínimo para alertar (em centavos)
  emailEnabled: boolean;
}

// Vínculo entre responsável e menor
export interface ParentalLink {
  id: string;
  parentId: string;
  minorId: string;
  linkCode: string; // Código de 6 dígitos
  status: ParentalLinkStatus;
  minorAge: number;
  minorBirthDate: string;
  minorName: string;
  minorEmail: string;
  createdAt: string;
  acceptedAt?: string;
  expiresAt: string; // Link expira em 7 dias
}

// Tentativa de acesso (para auditoria)
export interface AccessAttempt {
  id: string;
  timestamp: string;
  cpf?: string;
  govBrLevel?: GovBrLevel;
  ageGroup?: AgeGroup;
  blocked: boolean;
  blockedReason?: string;
  inviteSent?: boolean;
}

// Entrada do log de auditoria
export interface AuditEntry {
  id: string;
  timestamp: string;
  cpf: string;
  userType: "minor" | "adult" | "parent";
  action: AuditAction;
  details: Record<string, unknown>;
  parentalLinkId?: string;
}

// Ações auditadas
export const AUDIT_ACTIONS = {
  ACCESS_BLOCKED: "Acesso bloqueado - menor sem responsável",
  INVITE_SENT: "Convite enviado ao responsável",
  PARENT_ACCOUNT_CREATED: "Conta parental criada via Gov.br",
  MINOR_LINK_REQUESTED: "Solicitação de vínculo de menor",
  MINOR_LINK_ACCEPTED: "Vínculo de menor aceito",
  MINOR_LINK_REJECTED: "Vínculo de menor rejeitado",
  CPF_VALIDATED: "CPF do menor validado",
  AGE_CALCULATED: "Idade calculada via data de nascimento",
  AGE_GROUP_CLASSIFIED: "Usuário classificado como menor",
  RESPONSIBILITY_TERM_SIGNED: "Termo de responsabilidade assinado",
  PARENTAL_CONSENT_GIVEN: "Consentimento parental concedido",
  TRANSACTION_CREATED_BY_MINOR: "Transação criada por menor",
  TRANSACTION_VIEWED_BY_PARENT: "Transação visualizada pelo responsável",
  ACCOUNT_PAUSED_BY_PARENT: "Conta do menor pausada pelo responsável",
  DATA_EXPORTED: "Dados exportados (LGPD)",
  DATA_DELETION_REQUESTED: "Solicitação de exclusão de dados",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// Resultado da validação de CPF
export interface CPFValidationResult {
  valid: boolean;
  errorCode?: "INVALID_FORMAT" | "INVALID_CHECKSUM" | "NOT_FOUND";
  data?: {
    nome: string;
    dataNascimento: string;
    situacao: "regular" | "irregular";
  };
}
