export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-geist selection:bg-brand-violet/30 selection:text-brand-violet-light">
      {children}
    </div>
  );
}
