const footerLinks = {
  Platform: ["Features", "Architecture", "Technology"],
  Resources: ["Documentation", "API Reference", "Community"],
  Contact: ["Support", "Feedback", "Partnerships"],
};

export default function Footer() {
  return (
    <footer className="border-t border-glass-border bg-card/50 px-4 py-12" style={{ backdropFilter: "blur(12px)" }}>
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-3 font-display text-lg font-bold">
              <span className="gradient-text">Mind</span>Tech
            </h3>
            <p className="text-sm text-muted-foreground">
              Mental Health Support Platform built using Service-Oriented Architecture for M.Tech Project.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-primary">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-glass-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 MindTech – AI Powered Mental Health Support Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
