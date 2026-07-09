interface DeleteConfirmBarProps {
  onConfirm: () => void
  onCancel: () => void
  label?: string
}

export function DeleteConfirmBar({ onConfirm, onCancel, label = 'Excluir este item?' }: DeleteConfirmBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 my-1">
      <span className="text-xs font-semibold text-[#991B1B]">{label}</span>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onCancel}
          className="text-xs font-semibold px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-destructive text-white hover:opacity-90"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}
