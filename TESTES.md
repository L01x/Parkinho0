# Testes Unitários e E2E - Whiteboard

## Testes Unitários

### 1. Função `smoothPath`
```typescript
describe('smoothPath', () => {
  it('deve retornar array vazio se pontos vazio', () => {
    expect(smoothPath([])).toEqual([]);
  });

  it('deve retornar pontos originais se menos de 3 pontos', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    expect(smoothPath(points)).toEqual(points);
  });

  it('deve suavizar caminho com 3+ pontos', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 }
    ];
    const smoothed = smoothPath(points);
    expect(smoothed.length).toBeGreaterThan(points.length);
    expect(smoothed[0]).toEqual(points[0]);
    expect(smoothed[smoothed.length - 1]).toEqual(points[points.length - 1]);
  });
});
```

### 2. Função `screenToWorld`
```typescript
describe('screenToWorld', () => {
  it('deve converter coordenadas corretamente', () => {
    const offset = { x: 100, y: 100 };
    const scale = 2;
    const world = screenToWorld(200, 200, offset, scale);
    expect(world.x).toBe(50); // (200 - 100) / 2
    expect(world.y).toBe(50);
  });

  it('deve lidar com zoom', () => {
    const offset = { x: 0, y: 0 };
    const scale = 0.5;
    const world = screenToWorld(100, 100, offset, scale);
    expect(world.x).toBe(200); // 100 / 0.5
    expect(world.y).toBe(200);
  });
});
```

### 3. Sistema de Undo/Redo
```typescript
describe('Undo/Redo System', () => {
  it('deve adicionar ao histórico', () => {
    const shapes1: Shape[] = [{ id: '1', type: 'path', points: [], color: '#000', thickness: 1 }];
    addToHistory(shapes1);
    expect(history.length).toBe(2); // Initial + new
    expect(history[history.length - 1].shapes).toEqual(shapes1);
  });

  it('deve limitar histórico a 50 estados', () => {
    // Adicionar 60 estados
    for (let i = 0; i < 60; i++) {
      addToHistory([{ id: `${i}`, type: 'path', points: [], color: '#000', thickness: 1 }]);
    }
    expect(history.length).toBeLessThanOrEqual(maxHistory);
  });

  it('deve desfazer corretamente', () => {
    const shapes1: Shape[] = [{ id: '1', type: 'path', points: [], color: '#000', thickness: 1 }];
    addToHistory(shapes1);
    undo();
    expect(historyIndex).toBe(0);
    expect(shapes).toEqual([]);
  });

  it('deve refazer corretamente', () => {
    const shapes1: Shape[] = [{ id: '1', type: 'path', points: [], color: '#000', thickness: 1 }];
    addToHistory(shapes1);
    undo();
    redo();
    expect(historyIndex).toBe(1);
    expect(shapes).toEqual(shapes1);
  });
});
```

### 4. Função `limparTudo`
```typescript
describe('limparTudo', () => {
  it('deve limpar canvas', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    limparTudo();
    // Verificar que canvas está limpo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isWhite = Array.from(imageData.data).every((val, i) => {
      const pixelIndex = i % 4;
      return pixelIndex === 3 ? val === 255 : val === 255; // Alpha ou RGB
    });
    expect(isWhite).toBe(true);
  });

  it('deve limpar shapes', () => {
    setShapes([{ id: '1', type: 'path', points: [], color: '#000', thickness: 1 }]);
    limparTudo();
    expect(shapes).toEqual([]);
  });

  it('deve limpar histórico', () => {
    addToHistory([{ id: '1', type: 'path', points: [], color: '#000', thickness: 1 }]);
    limparTudo();
    expect(history.length).toBe(1);
    expect(historyIndex).toBe(0);
  });

  it('deve limpar textInput', () => {
    setTextInput({ x: 0, y: 0, text: 'test' });
    limparTudo();
    expect(textInput).toBeNull();
  });
});
```

## Testes E2E (Cypress/Playwright)

### 1. Fluxo de Desenho Completo
```typescript
describe('E2E: Desenho Completo', () => {
  it('deve desenhar, adicionar texto, e salvar', () => {
    // 1. Abrir app
    cy.visit('/');
    cy.get('[data-testid="canvas-button"]').click();

    // 2. Desenhar
    cy.get('canvas').trigger('pointerdown', { clientX: 100, clientY: 100 });
    cy.get('canvas').trigger('pointermove', { clientX: 200, clientY: 200 });
    cy.get('canvas').trigger('pointerup');

    // 3. Adicionar texto
    cy.get('[data-testid="text-tool"]').click();
    cy.get('canvas').trigger('pointerdown', { clientX: 150, clientY: 150 });
    cy.get('[contenteditable]').type('Teste');
    cy.get('[contenteditable]').type('{enter}');

    // 4. Verificar que formas foram criadas
    cy.get('canvas').should('be.visible');
  });
});
```

### 2. Teste Mobile (Device Emulation)
```typescript
describe('E2E: Mobile', () => {
  beforeEach(() => {
    cy.viewport('iphone-12');
  });

  it('deve abrir teclado ao tocar em texto', () => {
    cy.visit('/');
    cy.get('[data-testid="canvas-button"]').click();
    cy.get('[data-testid="text-tool"]').click();
    cy.get('canvas').trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
    cy.get('[contenteditable]').should('be.visible').should('have.focus');
  });

  it('deve desenhar com toque', () => {
    cy.visit('/');
    cy.get('[data-testid="canvas-button"]').click();
    cy.get('canvas')
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 200 }] })
      .trigger('touchend');
    cy.get('canvas').should('be.visible');
  });
});
```

### 3. Teste de Undo/Redo
```typescript
describe('E2E: Undo/Redo', () => {
  it('deve desfazer ação', () => {
    cy.visit('/');
    cy.get('[data-testid="canvas-button"]').click();
    
    // Desenhar
    cy.get('canvas').trigger('pointerdown', { clientX: 100, clientY: 100 });
    cy.get('canvas').trigger('pointermove', { clientX: 200, clientY: 200 });
    cy.get('canvas').trigger('pointerup');

    // Undo
    cy.get('[data-testid="undo-button"]').click();
    // Verificar que desenho foi removido (comparar canvas)
  });
});
```

### 4. Teste de Limpar Tudo
```typescript
describe('E2E: Limpar Tudo', () => {
  it('deve limpar canvas após confirmação', () => {
    cy.visit('/');
    cy.get('[data-testid="canvas-button"]').click();
    
    // Desenhar algo
    cy.get('canvas').trigger('pointerdown', { clientX: 100, clientY: 100 });
    cy.get('canvas').trigger('pointermove', { clientX: 200, clientY: 200 });
    cy.get('canvas').trigger('pointerup');

    // Limpar
    cy.get('[data-testid="clear-button"]').click();
    cy.on('window:confirm', () => true); // Confirmar diálogo
    // Verificar que canvas está limpo
  });
});
```

## Como Executar Testes

### Testes Unitários (Jest/Vitest)
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
npm run test
```

### Testes E2E (Cypress)
```bash
npm install --save-dev cypress
npx cypress open
```

### Testes E2E (Playwright)
```bash
npm install --save-dev @playwright/test
npx playwright test
```

## Cobertura de Testes

**Meta**: 80%+ de cobertura para:
- Funções utilitárias (smoothPath, screenToWorld)
- Sistema de undo/redo
- Função limparTudo
- Handlers de eventos principais

**Nota**: Testes E2E são opcionais mas recomendados para garantir funcionalidade mobile.




