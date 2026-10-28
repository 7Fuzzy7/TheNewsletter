import { getNews } from "@/lib/news";

// Cache curto no servidor: muitos visitantes não geram muitas requisições às fontes.
export const revalidate = 60;

export async function GET() {
  const data = await getNews();
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
  });
}
