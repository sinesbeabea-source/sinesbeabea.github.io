import React from "react";

const floatingItems = [
  { emoji: '💕', top: '8%', left: '8%', delay: '0s', size: 'text-2xl' },
  { emoji: '⭐', top: '12%', right: '10%', delay: '0.5s', size: 'text-xl' },
  { emoji: '🌟', top: '20%', left: '18%', delay: '1s', size: 'text-lg' },
  { emoji: '💖', top: '30%', right: '6%', delay: '0.3s', size: 'text-2xl' },
  { emoji: '✨', bottom: '28%', left: '6%', delay: '0.8s', size: 'text-xl' },
  { emoji: '💗', bottom: '18%', right: '12%', delay: '0.2s', size: 'text-2xl' },
  { emoji: '⭐', bottom: '10%', left: '20%', delay: '1.2s', size: 'text-lg' },
  { emoji: '🌸', top: '50%', left: '3%', delay: '0.6s', size: 'text-xl' },
  { emoji: '💫', top: '60%', right: '4%', delay: '1.4s', size: 'text-lg' },
];

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(280 40% 18%) 0%, hsl(240 35% 10%) 60%)' }}
    >
      {/* Floating kawaii decorations */}
      {floatingItems.map((item, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: item.top, left: item.left, right: item.right, bottom: item.bottom,
            animation: `kawaii-bounce 3s ease-in-out infinite`,
            animationDelay: item.delay,
            opacity: 0.7,
          }}
        >
          <span className={item.size}>{item.emoji}</span>
        </div>
      ))}

      {/* Soft glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #FF85C2 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #85FFD4 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-pink-400 mb-5 kawaii-bounce"
            style={{ boxShadow: '0 8px 32px hsl(330 100% 72% / 0.5)' }}
          >
            <Icon className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-accent font-semibold mt-2">{subtitle}</p>}
        </div>

        <div className="p-8 rounded-3xl border border-primary/25"
          style={{
            background: 'hsl(240 30% 14% / 0.85)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 0 1px hsl(160 80% 60% / 0.15), 0 8px 48px hsl(240 35% 5% / 0.7), inset 0 1px 0 hsl(330 100% 72% / 0.1)',
          }}
        >
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6 font-semibold">{footer}</p>
        )}
      </div>
    </div>
  );
}