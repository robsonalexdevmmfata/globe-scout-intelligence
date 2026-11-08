const PORTFOLIO_URL = "https://agenciainfotech.com.br/";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t py-6 text-center text-xs text-muted-foreground ${className}`}>
      <p>
        Desenvolvido por{" "}
        <a
          href={PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Agência Info Tech Ltda
        </a>
      </p>
      <p className="mt-1">
        <a
          href={PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary/80 hover:text-primary hover:underline underline-offset-4"
        >
          agenciainfotech.com.br
        </a>
      </p>
    </footer>
  );
}
