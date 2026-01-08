# 🚀 Integração com Notion

Este aplicativo está preparado para integração com o Notion. Atualmente, as funções de API estão simuladas, mas você pode facilmente conectar ao Notion seguindo estas instruções.

## 📋 Pré-requisitos

1. Conta no Notion
2. Criar uma integração no Notion (https://www.notion.so/my-integrations)
3. Obter o token de API
4. Criar um banco de dados no Notion para armazenar as ideias

## 🔧 Estrutura do Banco de Dados no Notion

Crie um banco de dados com as seguintes propriedades:

- **Título** (title): Nome da ideia
- **Descrição** (rich_text): Descrição detalhada
- **Usuário** (rich_text): Nome do criador
- **Email** (email): Email do criador
- **Desenho** (files): URL da imagem do desenho
- **Data de Criação** (created_time): Data automática
- **Status** (select): Status da ideia

## 💻 Implementação

### 1. Instalar dependências

```bash
npm install @notionhq/client
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local`:

```env
VITE_NOTION_API_KEY=seu_token_aqui
VITE_NOTION_DATABASE_ID=id_do_banco_de_dados
```

### 3. Substituir as funções simuladas

No arquivo `/App.tsx`, substitua as funções simuladas:

```typescript
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: import.meta.env.VITE_NOTION_API_KEY,
});

const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID;

// Criar ideia no Notion
const sendToNotion = async (idea: Idea): Promise<string> => {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Título: {
          title: [{ text: { content: idea.title } }],
        },
        Descrição: {
          rich_text: [{ text: { content: idea.description } }],
        },
        Usuário: {
          rich_text: [{ text: { content: idea.userName } }],
        },
        Email: {
          email: idea.userEmail,
        },
        Status: {
          select: { name: 'Parkinho' },
        },
      },
    });
    
    // Upload da imagem para um serviço de storage (S3, Cloudinary, etc)
    // e adicionar a URL ao Notion
    
    return response.id;
  } catch (error) {
    console.error('Erro ao enviar para Notion:', error);
    throw error;
  }
};

// Atualizar ideia no Notion
const updateInNotion = async (idea: Idea) => {
  if (!idea.notionId) return;
  
  try {
    await notion.pages.update({
      page_id: idea.notionId,
      properties: {
        Título: {
          title: [{ text: { content: idea.title } }],
        },
        Descrição: {
          rich_text: [{ text: { content: idea.description } }],
        },
        Usuário: {
          rich_text: [{ text: { content: idea.userName } }],
        },
        Email: {
          email: idea.userEmail,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar no Notion:', error);
    throw error;
  }
};

// Deletar do Notion
const deleteFromNotion = async (notionId: string) => {
  try {
    await notion.pages.update({
      page_id: notionId,
      archived: true,
    });
  } catch (error) {
    console.error('Erro ao deletar do Notion:', error);
    throw error;
  }
};
```

## 🖼️ Upload de Imagens

Para o desenho (canvas), você precisará:

1. Converter o canvas para Blob
2. Fazer upload para um serviço de storage (AWS S3, Cloudinary, Imgur, etc)
3. Obter a URL pública
4. Adicionar a URL ao Notion

Exemplo com conversão para Blob:

```typescript
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
};

// No momento do envio:
const blob = await canvasToBlob(canvasRef.current);
const imageUrl = await uploadToStorage(blob); // Sua função de upload
```

## 📊 Sincronização Bidirecional

Para carregar ideias do Notion ao abrir o app:

```typescript
const loadFromNotion = async (): Promise<Idea[]> => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Status',
      select: {
        equals: 'Parkinho',
      },
    },
  });
  
  return response.results.map((page: any) => ({
    id: page.id,
    notionId: page.id,
    title: page.properties.Título.title[0]?.text.content || '',
    description: page.properties.Descrição.rich_text[0]?.text.content || '',
    userName: page.properties.Usuário.rich_text[0]?.text.content || '',
    userEmail: page.properties.Email.email || '',
    drawing: page.properties.Desenho.files[0]?.file.url || '',
    createdAt: new Date(page.created_time),
  }));
};
```

## 🔒 Segurança

⚠️ **IMPORTANTE**: Nunca exponha seu token de API no código frontend!

Para produção, crie um backend (Node.js, Python, etc) que:
1. Mantenha o token de API seguro
2. Faça proxy das requisições ao Notion
3. Valide e sanitize os dados
4. Implemente rate limiting

## 📱 Fluxo Completo

1. ✍️ Usuário cria ideia → desenha → adiciona nome/email
2. 📤 App envia para seu backend
3. 🔐 Backend valida e envia ao Notion
4. ✅ Notion retorna ID da página
5. 💾 App salva localmente com notionId
6. 🎪 Ideia aparece no Parkinho
7. ✏️ Edições são sincronizadas com Notion
8. 🗑️ Deletar arquiva no Notion

## 🎨 Funcionalidades Atuais

Atualmente implementado (simulado):
- ✅ Envio de ideias para "Notion" (console.log)
- ✅ Atualização de ideias
- ✅ Exclusão de ideias
- ✅ Badge de sincronização
- ✅ Interface completa

## 🚀 Próximos Passos

1. Configurar backend para proxy seguro
2. Implementar upload de imagens
3. Adicionar sincronização em tempo real
4. Implementar cache local (IndexedDB)
5. Adicionar modo offline
