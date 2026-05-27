// ============================================
// DeleteModal.tsx - Modal de confirmação de exclusão
// Pergunta ao usuário se ele realmente quer excluir
// ============================================

"use client";

// Props que o modal recebe
// open: se o modal está aberto
// onClose: função para fechar o modal
// onConfirm: função chamada quando o usuário confirma a exclusão
export default function DeleteModal({ open, onClose, onConfirm }: any) {
  // Se não está aberto, não renderiza nada
  if (!open) return null;

  return (
    // Fundo escuro que fecha o modal ao clicar
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      {/* Caixa do modal - stopPropagation evita fechar ao clicar dentro */}
      <div className="bg-card border border-red/30 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          {/* Ícone de lixeira */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red/10 border border-red/30 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          {/* Título e mensagem */}
          <h3 className="text-lg font-bold mb-2">Excluir Transação</h3>
          <p className="text-muted text-sm mb-6">
            Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
          </p>

          {/* Botões de ação */}
          <div className="flex justify-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/5 transition-all">
              Cancelar
            </button>
            <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red/20 border border-red/40 text-red font-semibold hover:bg-red/30 transition-all">
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
