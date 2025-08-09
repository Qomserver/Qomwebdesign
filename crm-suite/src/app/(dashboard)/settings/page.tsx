export default function SettingsPage() {
  const sections = [
    "افزودن افراد و دادن دسترسی",
    "تیم‌ها",
    "نقش‌های کاربری",
    "ایجاد نقش کاربری",
    "پیکربندی دسترسی‌ها",
    "تنظیمات محصولات",
    "افزودن محصول",
    "اتصال به ووکامرس",
    "فیلدها",
    "فیلدهای پیش‌فرض لید",
    "مدیریت وضعیت لید",
    "افزودن فیلد اختصاصی",
    "دسته‌بندی بانک شماره",
    "گروه‌های هدف",
    "صفات کاربران",
    "افزودن صفت",
    "اتصالات",
    "ووکامرس",
    "پیامک",
    "تنظیمات متفرقه",
    "مدیریت صف ارسال ایمیل و پیامک",
    "مدیریت پیش‌شماره",
    "فیلد اصلی لید برای یکتا بودن",
    "زمان خروج لید از زیرمجموعه فروشنده",
    "مدیریت مشتری",
  ];
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">تنظیمات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="font-semibold mb-1">{s}</div>
            <div className="text-sm opacity-70">پیکربندی این بخش به زودی</div>
          </div>
        ))}
      </div>
    </main>
  );
}