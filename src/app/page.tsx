const foundation = ['Repository structure', 'Mobile auth flow', 'Supabase schema', 'Row-level security']

export default function Home() {
  return (
    <main>
      <header><div className="mark">S</div><div><p className="eyebrow">SWACHTA OPERATIONS</p><h1>Foundation dashboard</h1></div></header>
      <section className="hero"><div><span className="status">Sprint 1 · In progress</span><h2>Build a trusted start for every pickup.</h2><p>Authentication, profiles, serviceability, and saved addresses form the first production boundary.</p></div><div className="metric"><strong>4</strong><span>foundation modules scaffolded</span></div></section>
      <section><h3>Development readiness</h3><div className="grid">{foundation.map((item) => <article key={item}><span>✓</span><p>{item}</p></article>)}</div></section>
      <section className="next"><div><p className="eyebrow">NEXT BLOCKER</p><h3>Connect development services</h3><p>Create the development Supabase project, configure SMS OTP, install dependencies, and push the repository.</p></div><button type="button">View setup checklist</button></section>
    </main>
  )
}
