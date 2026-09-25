export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-geist selection:bg-brand-600/30 selection:text-brand-600-light">
      {children}
    </div>
  );
}
