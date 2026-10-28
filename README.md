# Radar Notícias

Site de notícias do Brasil e do mundo que se atualiza sozinho (Next.js 15 + RSS).

## Como funciona

- `lib/feeds.js`: lista de fontes RSS (g1, Folha, UOL, Agência Brasil, CNN Brasil, BBC Brasil, DW). Edite para trocar fontes.
- `lib/news.js`: lê todas as fontes em paralelo, remove duplicadas e ordena da mais recente para a mais antiga. Se uma fonte cair, as outras continuam.
- `app/api/news/route.js`: endpoint `/api/news` com cache de 60s.
- `components/NewsFeed.js`: busca novidades a cada 60s (só com a aba visível), mostra o aviso "N novas notícias", filtros por região/fonte e busca.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Deploy na Vercel

1. Suba a pasta para um repositório no GitHub.
2. Na Vercel, "Add New Project" e importe o repositório. Não precisa de variáveis de ambiente.

## Próximos passos possíveis

- Newsletter por e-mail (cadastro + resumo diário via Resend ou Brevo, com Vercel Cron).
- Categorias (política, economia, tecnologia) usando os feeds por editoria de cada veículo.
- Ranking de "mais importantes" por quantidade de veículos que cobrem o mesmo assunto.
