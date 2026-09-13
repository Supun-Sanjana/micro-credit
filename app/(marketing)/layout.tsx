export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-geist selection:bg-brand-green/30 selection:text-brand-green-light">
      {children}
    </div>
  );
}
