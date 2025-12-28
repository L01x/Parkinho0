# Como Executar o Projeto

## ⚠️ IMPORTANTE
**NÃO abra o `index.html` diretamente no navegador!** 
Este é um projeto React/Vite que precisa de um servidor de desenvolvimento.

## 📋 Passos para Executar

### 1. Instalar Dependências
Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Isso instalará todas as dependências necessárias (React, Vite, etc.).

### 2. Iniciar Servidor de Desenvolvimento
Após instalar as dependências, execute:

```bash
npm run dev
```

### 3. Acessar no Navegador
O servidor iniciará automaticamente e você verá algo como:

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Abra seu navegador e acesse: **http://localhost:3000**

## 🛠️ Outros Comandos Úteis

### Build para Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

## ❓ Problemas Comuns

### "npm não é reconhecido"
- Instale o Node.js: https://nodejs.org/
- Reinicie o terminal após instalar

### "Porta 3000 já está em uso"
- O Vite tentará usar outra porta automaticamente
- Ou altere a porta no `vite.config.ts`

### Tela preta no navegador
- Verifique o console do navegador (F12) para erros
- Certifique-se de que o servidor está rodando (`npm run dev`)
- Não abra o arquivo HTML diretamente!

