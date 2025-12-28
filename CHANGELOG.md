# Changelog - Correções do Whiteboard Mobile

## Resumo das Mudanças

Esta atualização corrige problemas críticos no whiteboard, especialmente relacionados à funcionalidade mobile (iOS/Android), e implementa melhorias significativas na experiência de desenho e edição de texto.

## Mudanças Principais

### 1. Sistema de Undo/Redo Completo ✅
- **Implementado**: Sistema completo de histórico com até 50 estados
- **Funcionalidades**:
  - Botões de Undo/Redo na interface
  - Atalhos de teclado: `Ctrl+Z` (Undo) e `Ctrl+Y` ou `Ctrl+Shift+Z` (Redo)
  - Histórico é limpo quando `limparTudo()` é chamado
  - Histórico é atualizado automaticamente quando formas são adicionadas

### 2. Função `limparTudo()` Corrigida ✅
- **Antes**: Apenas limpava o array de shapes
- **Agora**: Limpa completamente:
  - Canvas (contexto 2D)
  - Estado de shapes
  - Estado de texto em edição
  - Histórico de undo/redo
  - localStorage (autosave se existir)
  - Estados de desenho (isDrawing, isPanning, etc.)
  - Animações pendentes (cancelAnimationFrame)
  - Rastreamento de pointers ativos

### 3. Overlay ContentEditable para Texto Mobile ✅
- **Implementado**: Substituição do `<input>` por `<div contentEditable>`
- **Benefícios**:
  - Suporte completo para IME (Input Method Editor) em mobile
  - Teclado virtual abre corretamente no iOS/Android
  - Suporte para composition events (chinês, japonês, etc.)
  - Placeholder visual quando vazio
  - Melhor posicionamento e foco automático
  - Rasterização no canvas após confirmação

### 4. Pointer Events com Fallback ✅
- **Migrado**: De eventos separados (mouse/touch) para Pointer Events
- **Fallback**: Mantém suporte para navegadores antigos
- **Melhorias**:
  - `setPointerCapture()` para melhor rastreamento mobile
  - Prevenção de multi-touch durante desenho
  - Rastreamento de múltiplos pointers simultâneos
  - `onPointerCancel` para lidar com perda de pointer

### 5. Smoothing de Traço (Quadratic Curves) ✅
- **Implementado**: Algoritmo de suavização usando curvas quadráticas
- **Resultado**: Traços mais suaves e naturais, especialmente em mobile
- **Aplicado em**: Desenho de paths (caneta e borracha)

### 6. Throttle rAF Melhorado ✅
- **Implementado**: Throttling mais eficiente com `minRedrawInterval` (16ms ≈ 60fps)
- **Otimizações**:
  - Cancelamento de frames pendentes antes de novos redraws
  - `desynchronized: true` no contexto 2D para melhor performance mobile
  - `alpha: false` para melhor performance
  - `imageSmoothingQuality: 'high'` para melhor qualidade visual

### 7. Touch-Action e UI Touch-Friendly ✅
- **Implementado**: 
  - `touch-action: none` no canvas container (previne scroll durante desenho)
  - `touch-action: manipulation` em todos os botões (previne double-tap zoom)
  - `-webkit-tap-highlight-color: transparent` para remover highlight azul no iOS
  - Botões maiores e mais espaçados para facilitar toque
  - `overscroll-behavior-y: contain` para prevenir pull-to-refresh

### 8. DevicePixelRatio Correto ✅
- **Corrigido**: Uso consistente de `devicePixelRatio` em:
  - Resize do canvas
  - Transformações de desenho
  - Conversão de coordenadas
- **Resultado**: Desenho nítido em telas de alta densidade (Retina, etc.)

### 9. Handlers Conflitantes Corrigidos ✅
- **Problema**: Conflitos entre mouse/touch/pointer events
- **Solução**:
  - Detecção de suporte a Pointer Events
  - Fallback automático para mouse/touch quando necessário
  - Prevenção de eventos duplicados
  - Rastreamento de pointers ativos para evitar multi-touch

### 10. Melhorias Adicionais
- **Orientation Change**: Listener para mudanças de orientação
- **Performance**: Otimizações de redraw e cancelamento de animações
- **Acessibilidade**: Melhor suporte para teclado e screen readers
- **CSS**: Arquivo `index.css` com estilos globais e otimizações mobile

## Arquivos Modificados

1. `components/CanvasBoard.tsx` - Refatoração completa
2. `index.css` - Novo arquivo com estilos globais

## Testes Recomendados

Ver `QA_CHECKLIST.md` para lista completa de testes manuais.

## Breaking Changes

Nenhum. Todas as mudanças são retrocompatíveis.

## Notas Técnicas

- Pointer Events são suportados em todos os navegadores modernos (Chrome 55+, Safari 13+, Firefox 59+)
- Fallback para mouse/touch garante compatibilidade com navegadores antigos
- IME support funciona em iOS 13+ e Android 7+
- Smoothing pode ser desabilitado se necessário (comentar chamada de `smoothPath`)



