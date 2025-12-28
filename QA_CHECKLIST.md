# Checklist de QA - Whiteboard Mobile

## Ambiente de Teste

### Dispositivos Recomendados
- **iOS**: iPhone 12+ (iOS 15+), iPad (iPadOS 15+)
- **Android**: Samsung Galaxy S21+ (Android 11+), Google Pixel 6+ (Android 12+)
- **Desktop**: Chrome, Firefox, Safari, Edge (últimas versões)

---

## ✅ Funcionalidades Básicas

### 1. Desenho com Caneta
- [ ] **Desktop**: Desenhar com mouse produz traços suaves
- [ ] **Mobile**: Desenhar com dedo produz traços suaves (sem lag)
- [ ] **Mobile**: Traços são suaves mesmo em movimento rápido
- [ ] **Mobile**: Não há scroll da página durante desenho
- [ ] **Mobile**: Não há zoom acidental (double-tap)
- [ ] **Mobile**: Desenho funciona em orientação portrait e landscape

### 2. Borracha
- [ ] **Desktop**: Borracha apaga corretamente
- [ ] **Mobile**: Borracha funciona com toque
- [ ] **Mobile**: Área de apagamento é proporcional à espessura selecionada

### 3. Formas (Retângulo/Círculo)
- [ ] **Desktop**: Formas são criadas corretamente com mouse
- [ ] **Mobile**: Formas são criadas corretamente com toque
- [ ] **Mobile**: Preview da forma aparece durante criação
- [ ] **Mobile**: Forma finaliza corretamente ao soltar o dedo

### 4. Ferramenta Mão (Pan)
- [ ] **Desktop**: Pan funciona com botão do meio ou Espaço
- [ ] **Mobile**: Pan funciona com toque quando ferramenta Mão está selecionada
- [ ] **Mobile**: Pan funciona com Espaço (se teclado virtual disponível)
- [ ] **Mobile**: Não desenha acidentalmente durante pan

---

## ✅ Inserção de Texto

### 5. Abertura do Teclado
- [ ] **Mobile iOS**: Ao tocar com ferramenta Texto, teclado virtual abre
- [ ] **Mobile Android**: Ao tocar com ferramenta Texto, teclado virtual abre
- [ ] **Mobile**: Campo de texto aparece na posição tocada
- [ ] **Mobile**: Campo de texto tem foco automático

### 6. Edição de Texto
- [ ] **Mobile**: É possível digitar texto normalmente
- [ ] **Mobile**: Placeholder "Digite..." aparece quando vazio
- [ ] **Mobile**: Texto é visível e legível
- [ ] **Mobile**: Tamanho da fonte corresponde à espessura selecionada
- [ ] **Mobile**: Cor do texto corresponde à cor selecionada

### 7. IME Support (Input Method Editor)
- [ ] **Mobile Android**: Teclado em chinês/japonês funciona (se disponível)
- [ ] **Mobile iOS**: Teclado em chinês/japonês funciona (se disponível)
- [ ] **Mobile**: Composition events são tratados corretamente
- [ ] **Mobile**: Texto final aparece corretamente após composição

### 8. Confirmação de Texto
- [ ] **Mobile**: Enter confirma e adiciona texto ao canvas
- [ ] **Mobile**: Escape cancela edição
- [ ] **Mobile**: Blur (tocar fora) confirma texto
- [ ] **Mobile**: Texto é rasterizado no canvas após confirmação
- [ ] **Mobile**: Campo de texto desaparece após confirmação

### 9. Posicionamento
- [ ] **Mobile**: Texto aparece na posição correta (onde foi tocado)
- [ ] **Mobile**: Texto permanece na posição correta após zoom/pan
- [ ] **Mobile**: Texto não fica cortado nas bordas da tela

---

## ✅ Limpar Tudo (limparTudo)

### 10. Limpeza Completa
- [ ] **Desktop**: Botão "Limpar" mostra confirmação
- [ ] **Mobile**: Botão "Limpar" mostra confirmação
- [ ] **Após confirmar**: Canvas fica completamente branco
- [ ] **Após confirmar**: Todas as formas desaparecem
- [ ] **Após confirmar**: Campo de texto em edição fecha
- [ ] **Após confirmar**: Histórico de undo/redo é limpo
- [ ] **Após confirmar**: Botões Undo/Redo ficam desabilitados
- [ ] **Após confirmar**: É possível desenhar novamente normalmente

### 11. Cancelamento
- [ ] **Desktop**: Cancelar não limpa o canvas
- [ ] **Mobile**: Cancelar não limpa o canvas
- [ ] **Após cancelar**: Formas permanecem visíveis
- [ ] **Após cancelar**: Histórico permanece intacto

---

## ✅ Undo/Redo

### 12. Funcionalidade Básica
- [ ] **Desktop**: Botão Undo desfaz última ação
- [ ] **Mobile**: Botão Undo desfaz última ação
- [ ] **Desktop**: Botão Redo refaz última ação desfeita
- [ ] **Mobile**: Botão Redo refaz última ação desfeita
- [ ] **Desktop**: Atalho Ctrl+Z funciona
- [ ] **Desktop**: Atalho Ctrl+Y funciona
- [ ] **Desktop**: Atalho Ctrl+Shift+Z funciona

### 13. Estados dos Botões
- [ ] **Sem ações**: Botões Undo/Redo estão desabilitados
- [ ] **Após desenhar**: Botão Undo fica habilitado
- [ ] **Após undo**: Botão Redo fica habilitado
- [ ] **No início do histórico**: Botão Undo fica desabilitado
- [ ] **No fim do histórico**: Botão Redo fica desabilitado

### 14. Histórico
- [ ] **Múltiplas ações**: Undo desfaz uma ação por vez
- [ ] **Múltiplas ações**: Redo refaz uma ação por vez
- [ ] **Limite**: Histórico mantém até 50 estados
- [ ] **Performance**: Undo/Redo é instantâneo mesmo com muitos estados

---

## ✅ Performance e Suavidade

### 15. Desenho Suave
- [ ] **Mobile**: Desenho não tem lag perceptível
- [ ] **Mobile**: Traços são suaves mesmo em movimento rápido
- [ ] **Mobile**: Não há "pontos" ou "quebras" no traço
- [ ] **Mobile**: Performance mantém-se com muitas formas no canvas

### 16. Zoom e Pan
- [ ] **Mobile**: Zoom com pinch é suave
- [ ] **Mobile**: Pan é suave sem lag
- [ ] **Mobile**: Canvas redesenha corretamente após zoom/pan
- [ ] **Mobile**: Texto e formas mantêm proporções corretas

### 17. Throttling
- [ ] **Mobile**: Redraws são throttled (não há excesso de frames)
- [ ] **Mobile**: Performance não degrada durante desenho longo
- [ ] **Mobile**: Bateria não drena excessivamente

---

## ✅ Multi-Touch e Gestos

### 18. Prevenção de Multi-Touch
- [ ] **Mobile**: Desenho para quando segundo dedo toca a tela
- [ ] **Mobile**: Pan/zoom com dois dedos não interfere no desenho
- [ ] **Mobile**: Desenho continua após remover um dedo (se outro ainda está)

### 19. Pointer Capture
- [ ] **Mobile**: Pointer é capturado durante desenho
- [ ] **Mobile**: Desenho continua mesmo se dedo sair da área do canvas
- [ ] **Mobile**: Pointer é liberado corretamente ao soltar

---

## ✅ DevicePixelRatio e Qualidade

### 20. Nitidez
- [ ] **Retina/High-DPI**: Desenho é nítido (não pixelado)
- [ ] **Retina/High-DPI**: Texto é nítido
- [ ] **Retina/High-DPI**: Formas são nítidas
- [ ] **Desktop**: Desenho é nítido em monitores 4K

### 21. Resize
- [ ] **Mobile**: Canvas redimensiona corretamente ao rotacionar
- [ ] **Mobile**: Canvas redimensiona corretamente ao redimensionar janela (se aplicável)
- [ ] **Mobile**: Conteúdo não é perdido ao redimensionar

---

## ✅ Acessibilidade e UX

### 22. Botões Touch-Friendly
- [ ] **Mobile**: Todos os botões são fáceis de tocar (tamanho adequado)
- [ ] **Mobile**: Botões não têm highlight azul indesejado (iOS)
- [ ] **Mobile**: Botões respondem imediatamente ao toque
- [ ] **Mobile**: Espaçamento entre botões é adequado

### 23. Feedback Visual
- [ ] **Mobile**: Ferramenta ativa é destacada visualmente
- [ ] **Mobile**: Cor selecionada é destacada
- [ ] **Mobile**: Espessura selecionada é destacada
- [ ] **Mobile**: Zoom atual é exibido corretamente

### 24. Prevenção de Ações Acidentais
- [ ] **Mobile**: Scroll da página não acontece durante desenho
- [ ] **Mobile**: Pull-to-refresh não acontece durante desenho
- [ ] **Mobile**: Zoom do navegador não acontece (double-tap)
- [ ] **Mobile**: Seleção de texto não acontece acidentalmente

---

## ✅ Persistência e Storage

### 25. Autosave (se implementado)
- [ ] **Mobile**: Autosave funciona corretamente
- [ ] **Mobile**: Dados são recuperados após refresh
- [ ] **Mobile**: LimparTudo remove autosave

### 26. Thumbnail
- [ ] **Mobile**: Thumbnail é gerado corretamente
- [ ] **Mobile**: Thumbnail é salvo corretamente ao enviar para Parkinho

---

## ✅ Casos Especiais

### 27. Orientação
- [ ] **Mobile**: App funciona em portrait
- [ ] **Mobile**: App funciona em landscape
- [ ] **Mobile**: Mudança de orientação não quebra o canvas
- [ ] **Mobile**: Conteúdo é preservado ao rotacionar

### 28. Navegadores
- [ ] **iOS Safari**: Todas as funcionalidades funcionam
- [ ] **Android Chrome**: Todas as funcionalidades funcionam
- [ ] **Android Samsung Internet**: Todas as funcionalidades funcionam (se testável)

### 29. Edge Cases
- [ ] **Mobile**: Desenho funciona próximo às bordas da tela
- [ ] **Mobile**: Texto pode ser adicionado próximo às bordas
- [ ] **Mobile**: Zoom extremo (máximo/mínimo) funciona
- [ ] **Mobile**: Muitas formas no canvas não quebram performance

---

## Notas de Teste

### Como Reportar Problemas
1. Anotar dispositivo e versão do OS
2. Anotar navegador e versão
3. Descrever passos para reproduzir
4. Incluir screenshots se possível
5. Verificar console do navegador para erros

### Prioridades
- **P0 (Crítico)**: Itens 1-11 (Funcionalidades básicas, texto, limpar)
- **P1 (Alto)**: Itens 12-19 (Undo/redo, performance, multi-touch)
- **P2 (Médio)**: Itens 20-29 (Qualidade, acessibilidade, edge cases)

---

## Status do Teste

**Testador**: _________________  
**Data**: _________________  
**Dispositivo**: _________________  
**Navegador**: _________________  
**OS**: _________________  

**Total de Itens**: 29 seções  
**Passou**: ___ / ___  
**Falhou**: ___ / ___  
**Não Testado**: ___ / ___



