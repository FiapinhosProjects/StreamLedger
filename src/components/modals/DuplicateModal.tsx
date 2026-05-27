// ============================================
// DuplicateModal.tsx - Modal de alerta de duplicata
// Avisa quando o usuário tenta salvar uma transação que já existe
// ============================================

"use client";

// Props que o modal recebe
// open: se o modal está aberto
// onClose: função para fechar (cancelar)
// onConfirm: função para salvar mesmo assim
export default function DuplicateModal({ open, onClose, onConfirm }: any) {
  // Se não está aberto, não renderiza nada
  if (!open) return null;

  return (
    // Fundo escuro que fecha o modal ao clicar
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      {/* Caixa do modal */}
      <div className="bg-card border border-yellow/30 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          {/* Ícone de alerta (triângulo amarelo) */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow/10 border border-yellow/30 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Título e mensagem */}
          <h3 className="text-lg font-bold mb-2">Transação Duplicada</h3>
          <p className="text-muted text-sm mb-6">
            Já existe uma transação com a mesma descrição, valor e categoria. Deseja salvar mesmo assim?
          </p>

          {/* Botões de ação */}
          <div className="flex justify-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/5 transition-all">
              Cancelar
            </button>
            <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-yellow/20 border border-yellow/40 text-yellow font-semibold hover:bg-yellow/30 transition-all">
              Salvar Mesmo Assim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
