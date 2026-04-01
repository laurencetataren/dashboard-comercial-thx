# THX Group | Dashboard Comercial

## Deploy Guide

### 1. Google Sheets Setup

1. Criar uma Google Sheet com 3 abas: "Deals", "Historico", "Metas"
2. Aba **Deals** (colunas): id, titulo, valor, status (open/won/lost), estagio, vendedora, empresa, data_criacao, data_atualizacao, data_ganho, motivo_perda, mes
3. Aba **Historico** (colunas): mes, won_count, won_value, lost_count, lost_value, new_count, conversion_rate, ticket_medio, ciclo_medio_dias
4. Aba **Metas** (colunas): mes, meta_valor, meta_deals
5. Ir em Google Cloud Console > APIs & Services > Credentials > Create API Key
6. Habilitar "Google Sheets API" no projeto
7. Copiar o Sheet ID da URL (entre /d/ e /edit)

### 2. Vercel Deploy

1. Push do projeto para um repo GitHub
2. Importar no Vercel (https://vercel.com/new)
3. Framework Preset: Vite
4. Environment Variables:
   - `GOOGLE_SHEET_ID` = ID da Google Sheet
   - `GOOGLE_SHEETS_API_KEY` = API Key do Google Cloud
5. Deploy!

### 3. Modo Demo (sem Google Sheets)

O app funciona sem Google Sheets configurado, usando dados mock para demonstracao.
Basta rodar `npm run dev` sem configurar as env vars.

### Stack

- React 19 + Vite 8
- Tailwind CSS v4
- Google Sheets API (via Vercel Serverless Functions)
- Recharts (graficos)
- Lucide React (icones)
- Vercel (hosting)

### Estrutura

```
dashboard-comercial/
  api/
    sheets.js          # Vercel serverless function (Google Sheets -> JSON)
  src/
    components/
      ParticleNetwork.jsx  # Animacao de particulas (background)
      TechGrid.jsx         # Grid tech (background)
      UI.jsx               # GlassCard, KPICard, ProgressBar, Badge, etc.
    lib/
      useComercialData.js  # Hook de dados (fetch + metricas calculadas)
      formatters.js        # Formatadores (moeda, %, mes)
    pages/
      Dashboard.jsx        # Pagina principal com 5 abas
    App.jsx
    main.jsx
    index.css
  index.html
  package.json
  vite.config.js
  vercel.json
```
