import type { CSSProperties } from 'react'
import { usePrivacidade } from '../../context/PrivacidadeContext'

interface ValorProps {
  valor: number
  className?: string
  style?: CSSProperties
  prefixo?: string // ex: '+ ', '− '
}

export function Valor({ valor, className, style, prefixo = '' }: ValorProps) {
  const { valoresOcultos } = usePrivacidade()

  if (valoresOcultos) {
    return (
      <span className={className} style={style}>
        R$ ••••••
      </span>
    )
  }

  return (
    <span className={className} style={style}>
      {prefixo}R$ {valor.toLocaleString('pt-BR')}
    </span>
  )
}
