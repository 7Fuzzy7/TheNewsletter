import NewsFeed from "@/components/NewsFeed";
import { getNews } from "@/lib/news";

// A página é regerada no servidor a cada 60s; o cliente continua atualizando sozinho.
export const revalidate = 60;

export default async function Home() {
  const initial = await getNews();
  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>
            <span className="pulse" aria-hidden="true" /> Radar Notícias
          </h1>
          <p className="tagline">As principais notícias do Brasil e do mundo, atualizadas ao vivo.</p>
        </div>
      </header>
      <NewsFeed initial={initial} />
      <footer className="footer">
        Os títulos e resumos pertencem aos respectivos veículos. Clique para ler a matéria completa na fonte.
      </footer>
    </main>
  );
}
