export default function Hero() {
  return (
    <section className="border-b border-stone-200 bg-gradient-to-br from-rose-50 via-amber-50 to-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-display text-3xl font-bold leading-tight text-stone-900 sm:text-5xl">
          Something sweet,<br className="hidden sm:block" /> delivered to your table.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-stone-600 sm:text-base">
          A live dessert catalogue from <span className="font-semibold text-stone-800">TheMealDB</span>, with a cart
          and order history kept in memory while this tab stays open.
        </p>
      </div>
    </section>
  );
}
