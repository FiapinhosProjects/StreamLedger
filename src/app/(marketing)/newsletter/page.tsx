// ============================================
// Newsletter - Página de cadastro / pré-registro
// Formulário com validação de nome, email, senha e termos
// ============================================

"use client";

import { useState } from "react";
import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";

// Regras de validação da senha (cada uma tem um teste)
const passwordRules = [
  { id: "length", label: "Mínimo 8 caracteres", test: (v: string) => v.length >= 8 },
  { id: "upper", label: "1 letra maiúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "1 letra minúscula", test: (v: string) => /[a-z]/.test(v) },
  { id: "number", label: "1 número", test: (v: string) => /[0-9]/.test(v) },
  { id: "special", label: "1 caractere especial", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export default function Newsletter() {
  // Estados dos campos do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados dos checkboxes
  const [politica, setPolitica] = useState(false);
  const [lgpd, setLgpd] = useState(false);

  // Controla quais campos já foram "tocados" pelo usuário
  const [dirty, setDirty] = useState<{ [key: string]: boolean }>({});

  // Se o formulário já foi submetido (mostra todos os erros)
  const [submitted, setSubmitted] = useState(false);

  // Controle dos modais (sucesso, política, lgpd)
  const [modal, setModal] = useState<"success" | "psi" | "lgpd" | null>(null);
  const [successName, setSuccessName] = useState("");

  // Marca um campo como "tocado" (para mostrar validação)
  const markDirty = (field: string) => setDirty((d) => ({ ...d, [field]: true }));

  // Validações dos campos
  const nomeValid = nome.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const senhaAllValid = passwordRules.every((r) => r.test(senha));
  const senhaMatch = senha !== "" && senha === confirmaSenha;

  // O formulário só é válido se TUDO estiver correto
  const formValid = nomeValid && emailValid && senhaAllValid && senhaMatch && politica && lgpd;

  // Envia o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (formValid) {
      // Sucesso: mostra modal e limpa o formulário
      setSuccessName(nome.trim().split(" ")[0]);
      setModal("success");
      setNome(""); setEmail(""); setSenha(""); setConfirmaSenha("");
      setPolitica(false); setLgpd(false);
      setDirty({}); setSubmitted(false);
    }
  };

  // Retorna a classe CSS da borda do campo (verde = válido, vermelho = inválido)
  function fieldClass(field: string, valid: boolean) {
    const active = dirty[field] || submitted;
    if (!active) return "border-white/10";
    return valid
      ? "border-neon shadow-[0_0_6px_rgba(93,255,155,0.4)]"
      : "border-red shadow-[0_0_6px_rgba(255,68,102,0.4)]";
  }

  // Verifica se deve mostrar a mensagem de erro
  function showError(field: string, valid: boolean) {
    return (dirty[field] || submitted) && !valid;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">

        {/* Coluna do formulário */}
        <div className="text-center lg:text-left">
          <FadeIn>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[65px] font-bold text-neon leading-tight mb-2">Seja um Ledger</h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-muted text-base sm:text-lg mb-6 lg:mb-8 font-light">Tenha acesso a atualizações em primeira mão</p>
          </FadeIn>

          <FadeIn delay={0.2}>
          <form onSubmit={handleSubmit} noValidate className="max-w-md mx-auto lg:mx-0 text-left space-y-4">
            {/* Campo: Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold text-[#C1FAD7] mb-1">Nome completo</label>
              <div className={`flex rounded-lg border overflow-hidden ${fieldClass("nome", nomeValid)}`}>
                <span className="flex items-center px-3 bg-background">
                  <Image src="/assets/user.svg" alt="" width={18} height={18} className="opacity-70" />
                </span>
                <input
                  id="nome" type="text" value={nome}
                  onChange={(e) => { setNome(e.target.value); markDirty("nome"); }}
                  placeholder="Digite seu nome"
                  className="flex-1 py-3 px-3 bg-background outline-none text-sm"
                />
              </div>
              {showError("nome", nomeValid) && <p className="text-red text-xs mt-1">Por favor, preencha o seu nome (mín. 3 caracteres).</p>}
            </div>

            {/* Campo: Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#C1FAD7] mb-1">E-mail</label>
              <div className={`flex rounded-lg border overflow-hidden ${fieldClass("email", emailValid)}`}>
                <span className="flex items-center px-3 bg-background">
                  <Image src="/assets/mail.svg" alt="" width={18} height={18} className="opacity-70" />
                </span>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); markDirty("email"); }}
                  placeholder="Digite seu e-mail"
                  className="flex-1 py-3 px-3 bg-background outline-none text-sm"
                />
              </div>
              {showError("email", emailValid) && <p className="text-red text-xs mt-1">Por favor, insira um e-mail válido.</p>}
            </div>

            {/* Campo: Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-[#C1FAD7] mb-1">Senha</label>
              <div className={`flex rounded-lg border overflow-hidden ${fieldClass("senha", senhaAllValid)}`}>
                <span className="flex items-center px-3 bg-background">
                  <LockIcon />
                </span>
                <input
                  id="senha" type={showPassword ? "text" : "password"} value={senha}
                  onChange={(e) => { setSenha(e.target.value); markDirty("senha"); }}
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                  className="flex-1 py-3 px-3 bg-background outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 bg-background hover:text-neon transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Campo: Confirmar Senha */}
            <div>
              <label htmlFor="confirmaSenha" className="block text-sm font-semibold text-[#C1FAD7] mb-1">Confirmar Senha</label>
              <div className={`flex rounded-lg border overflow-hidden ${fieldClass("confirma", senhaMatch)}`}>
                <span className="flex items-center px-3 bg-background">
                  <LockIcon />
                </span>
                <input
                  id="confirmaSenha" type={showPassword ? "text" : "password"} value={confirmaSenha}
                  onChange={(e) => { setConfirmaSenha(e.target.value); markDirty("confirma"); }}
                  placeholder="Confirme a senha"
                  autoComplete="new-password"
                  className="flex-1 py-3 px-3 bg-background outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 bg-background hover:text-neon transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {showError("confirma", senhaMatch) && <p className="text-red text-xs mt-1">As senhas não coincidem.</p>}
            </div>

            {/* Lista de regras da senha (verde = ok, cinza = falta) */}
            <ul className="space-y-1 text-xs">
              {passwordRules.map((rule) => (
                <li key={rule.id} className={`flex items-center gap-2 transition-colors ${rule.test(senha) ? "text-neon" : "text-white/60"}`}>
                  <RuleIcon valid={rule.test(senha)} /> {rule.label}
                </li>
              ))}
              <li className={`flex items-center gap-2 transition-colors ${senhaMatch ? "text-neon" : "text-white/60"}`}>
                <RuleIcon valid={senhaMatch} /> As senhas coincidem
              </li>
            </ul>
            <p className="text-xs text-white/50 italic">
              Guarde bem! Esta será sua senha de acesso oficial quando o StreamLedger for lançado.
            </p>

            {/* Checkboxes de termos */}
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" checked={politica} onChange={(e) => setPolitica(e.target.checked)} className="mt-0.5 accent-neon" />
                <span>Li e concordo com a <button type="button" onClick={() => setModal("psi")} className="text-neon hover:underline">Política de Segurança da Informação</button>.</span>
              </label>
              {showError("politica", politica) && <p className="text-red text-xs ml-5">Você precisa aceitar a Política de Segurança.</p>}

              <label className="flex items-start gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" checked={lgpd} onChange={(e) => setLgpd(e.target.checked)} className="mt-0.5 accent-neon" />
                <span>Autorizo o compartilhamento e tratamento dos meus dados conforme a <button type="button" onClick={() => setModal("lgpd")} className="text-neon hover:underline">LGPD</button>.</span>
              </label>
              {showError("lgpd", lgpd) && <p className="text-red text-xs ml-5">Você precisa autorizar os termos da LGPD.</p>}
            </div>

            {/* Botão de enviar */}
            <div className="text-center pt-2">
              <button type="submit" className="px-6 py-2.5 rounded-full border border-neon/20 font-semibold hover:bg-neon/10 transition-all">
                Concluir
              </button>
            </div>
          </form>
          </FadeIn>
        </div>

        {/* Coluna da imagem (só aparece no lg+) */}
        <FadeIn className="hidden lg:flex justify-center" delay={0.3}>
          <Image src="/assets/hero-dashboard.svg" alt="Dashboard StreamLedger" width={500} height={400} className="w-full max-w-md" />
        </FadeIn>
      </div>

      {/* ==================== MODAIS ==================== */}

      {/* Modal de sucesso */}
      {modal === "success" && (
        <Modal onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-neon/10 border border-neon/40 mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#39FF88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 className="text-neon font-bold text-xl mb-2">Inscrição confirmada!</h3>
            <p className="text-muted mb-1">Bem-vindo ao <strong className="text-white">StreamLedger</strong>. Você será notificado assim que tivermos novidades.</p>
            {successName && <p className="text-neon text-sm font-medium">Bem-vindo(a), {successName} ✦</p>}
            <button onClick={() => setModal(null)} className="mt-4 px-5 py-2 rounded-full border border-neon/20 font-semibold hover:bg-neon/10 transition-all">Fechar</button>
          </div>
        </Modal>
      )}

      {/* Modal da Política de Segurança */}
      {modal === "psi" && (
        <Modal onClose={() => setModal(null)}>
          <h3 className="text-neon font-bold text-lg mb-4">Política de Segurança da Informação</h3>
          <div className="text-muted text-sm space-y-3 max-h-80 overflow-y-auto leading-relaxed">
            <p>Bem-vindo à Política de Segurança da Informação do <strong className="text-white">StreamLedger</strong>.</p>
            <p>O StreamLedger tem como prioridade garantir a confidencialidade, integridade e disponibilidade dos dados sob nossa responsabilidade.</p>
            <h4 className="text-white font-semibold mt-4">1. Proteção de Dados Financeiros</h4>
            <p>Suas informações de fluxo de caixa e histórico de transações são armazenadas localmente com tecnologia de cifragem robusta, garantindo que somente você tenha acesso.</p>
            <h4 className="text-white font-semibold mt-4">2. Comunicação Criptografada</h4>
            <p>Toda conexão entre o seu ambiente cliente e nossos registros é criptografada fim a fim usando HTTPS sobre protocolos TLS de alto padrão.</p>
            <h4 className="text-white font-semibold mt-4">3. Prevenção e Monitoramento</h4>
            <p>Aplicamos continuamente auditorias contra ameaças cibernéticas como SQL Injection e XSS via Políticas de Segurança de Conteúdo (CSP).</p>
            <p className="italic">Última atualização: Maio de 2026.</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/5">Fechar</button>
            <button onClick={() => { setPolitica(true); setModal(null); }} className="px-4 py-2 text-sm rounded-lg border border-neon font-semibold hover:bg-neon/10">Aceitar Política</button>
          </div>
        </Modal>
      )}

      {/* Modal da LGPD */}
      {modal === "lgpd" && (
        <Modal onClose={() => setModal(null)}>
          <h3 className="text-neon font-bold text-lg mb-4">Aviso de Privacidade (LGPD)</h3>
          <div className="text-muted text-sm space-y-3 max-h-80 overflow-y-auto leading-relaxed">
            <p>De acordo com a <strong className="text-white">Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018)</strong>, informamos sobre a coleta e o consentimento explícito dos seus dados.</p>
            <h4 className="text-white font-semibold mt-4">Quais dados coletamos?</h4>
            <p>Armazenamos apenas informações diretas ligadas às operações descritas no registro da conta e seu fluxo financeiro inserido por você.</p>
            <h4 className="text-white font-semibold mt-4">Finalidade do tratamento</h4>
            <p>Os dados coletados são processados com a exclusiva finalidade de geração de relatórios para o seu Dashboard pessoal e cálculos pertinentes.</p>
            <h4 className="text-white font-semibold mt-4">Dos Seus Direitos</h4>
            <p>Você possui livre direito de exclusão da plataforma a qualquer momento. Pode requisitar a exportação ou exclusão limpa dos seus dados.</p>
            <p className="italic">Declaro compreender integralmente a legalidade supracitada.</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/5">Fechar</button>
            <button onClick={() => { setLgpd(true); setModal(null); }} className="px-4 py-2 text-sm rounded-lg border border-neon font-semibold hover:bg-neon/10">Aceitar Termos</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// Componentes auxiliares (ícones e modal)
// ============================================

// Modal genérico reutilizável
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card border border-neon/30 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// Ícone de cadeado (campo de senha)
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Ícone de olho aberto (mostrar senha)
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Ícone de olho fechado (esconder senha)
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Ícone de regra da senha (check = válido, traço = inválido)
function RuleIcon({ valid }: { valid: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {valid ? <polyline points="20 6 9 17 4 12" /> : <line x1="5" y1="12" x2="19" y2="12" />}
    </svg>
  );
}
