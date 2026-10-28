import "./globals.css";

export const metadata = {
  title: "Radar Notícias — o que importa, ao vivo",
  description: "Principais notícias do Brasil e do mundo, atualizadas automaticamente em tempo real.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
