export default function ReportsPage() {
  const sections = [
    "گزارشات تفکیکی",
    "بر اساس سال",
    "بر اساس محصول",
    "بر اساس بازاریاب",
    "فروش روزانه",
    "مانیتور",
  ];
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">گزارشات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="font-semibold mb-1">{s}</div>
            <div className="text-sm opacity-70">به زودی</div>
          </div>
        ))}
      </div>
    </main>
  );
}