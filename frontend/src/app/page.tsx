import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-[#FCFDFF] text-[#090D1A] font-sans min-h-screen flex flex-col selection:bg-indigo-100 selection:text-primary">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">DealFlow360</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#product" className="hover:text-primary transition-colors">Product</a>
              <a href="#workflows" className="hover:text-primary transition-colors">Workflows</a>
              <a href="#metrics" className="hover:text-primary transition-colors">Impact</a>
              <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/portal/login" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-all shadow-sm shadow-slate-900/10 active:scale-[0.98]">
              <span className="hidden sm:inline">Customer Portal</span>
              <span className="sm:hidden">Portal</span>
              <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section with Architectural Layered Composition */}
        <section className="relative pt-16 sm:pt-20 pb-28 sm:pb-36 overflow-hidden">
          {/* Architectural background geometry and subtle grid */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none opacity-60">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-tr from-indigo-200/40 via-sky-100/40 to-transparent rounded-full blur-[140px]"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 flex flex-col items-center text-center">
            {/* Minimal Live Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-sm shadow-slate-100 text-xs font-medium text-slate-600 mb-8 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
              <span>Sales operations, unified &amp; automated</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-slate-950 max-w-3xl leading-[1.08]">
              Close deals faster with zero friction.
            </h1>

            {/* Concise Subheadline */}
            <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-xl font-normal leading-relaxed px-4 sm:px-0">
              Streamline enterprise quotations, automate complex approvals, and coordinate multi-warehouse fulfillment in one unified workspace.
            </p>

            {/* Sleek CTAs */}
            <div className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto px-4 sm:px-0">
              <Link href="/auth/login" className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]">
                <span>Start free trial</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link href="/portal/login" className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">play_circle</span>
                <span>View live demo</span>
              </Link>
            </div>

            {/* Multi-Plane Layered Hero Showcase */}
            <div className="mt-16 sm:mt-20 w-full max-w-5xl relative px-2 sm:px-0">
              {/* Outer architectural plinth container */}
              <div className="relative rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-5 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/80 border border-slate-200/80 shadow-2xl shadow-indigo-950/10">
                {/* Plane 1: Integrated 3D Architectural Art Anchor */}
                <div className="relative w-full h-[200px] sm:h-[320px] md:h-[420px] lg:h-[480px] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    alt="Architectural geometric porcelain and indigo glass layers" 
                    className="w-full h-full object-cover object-center scale-[1.03] transition-transform duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUaf2LFN1QYw-atc8FMrGDjI2ku2q3uo6n87gc9P8Q6aWUVM5QSQCQw3atPxM8qVOAKCYeKBWL1wsuPVj2ftFCN0gvNdE8xcxNv324geaYXsCrAE_LQwvVa2Y35iC06wFu8uAe3cUetoN4uahTxiIhVoJGUINNnmpA52rb8z5a0npMob7VPtP-pKMpS34JaqgBvcRxNcV_LiEur2Ft1GC0WfWJc0s7EyU0Wx0AyMempYlAXoPMUNoq7Q"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-white/20"></div>
                </div>
                
                {/* Plane 2: Floating Frosted Dimensional UI Card Cluster hovering dynamically over the anchor artwork */}
                <div className="relative -mt-20 sm:-mt-36 md:-mt-44 mx-2 sm:mx-4 md:mx-6 bg-white/90 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-white/90 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)] p-4 sm:p-6 md:p-8 text-left transition-all">
                  {/* Top bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-100/90">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-50 border border-indigo-100/70 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px] sm:text-[24px]">verified</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Acme Global Deal Package</h3>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-600/20 flex-shrink-0">Approved</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">Quote #DF-2026-894 &bull; Prepared for enterprise deployment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      <div className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs text-slate-600 font-medium flex items-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-indigo-600">tune</span>
                        <span className="hidden xs:inline">Margin Guardrail:</span> 41.2%
                      </div>
                      <div className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm">
                        $40,900 ARR
                      </div>
                    </div>
                  </div>

                  {/* Clean visual summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mt-4 sm:mt-6">
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/70 border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="text-xs font-medium text-slate-500 mb-1">Approval Stage</div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 flex-shrink-0"></span>
                        <span className="truncate">Fully Verified &amp; Signed</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 hidden sm:block">Zero escalation lags detected</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/70 border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="text-xs font-medium text-slate-500 mb-1">Inventory Allocation</div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-sky-600 flex-shrink-0">local_shipping</span>
                        <span className="truncate">Smart Split (East + Central)</span>
                      </div>
                      <div className="mt-2 sm:mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                        <div className="bg-indigo-600 h-full w-[70%]"></div>
                        <div className="bg-sky-400 h-full w-[30%]"></div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/70 border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors sm:col-span-2 md:col-span-1">
                      <div className="text-xs font-medium text-slate-500 mb-1">Billing Structure</div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-indigo-600 flex-shrink-0">credit_card</span>
                        <span className="truncate">Hybrid (Hardware + SaaS)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 hidden sm:block">Co-termed auto-renew enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clean Enterprise Social Proof */}
        <section className="py-10 sm:py-12 border-y border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold text-center mb-6 sm:mb-8">
              Trusted by operations teams at fast-scaling companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-16 opacity-60">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">token</span> ACROSS
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">polymer</span> NEXUS
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 flex items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">data_object</span> SYNTHESIS
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 flex items-center gap-1.5 sm:gap-2 hidden sm:flex">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">view_in_ar</span> VANGUARD
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 flex items-center gap-1.5 sm:gap-2 hidden md:flex">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">grid_goldenratio</span> STRATA
              </span>
            </div>
          </div>
        </section>

        {/* High-Impact Metrics Horizontal Ribbon */}
        <section className="py-12 sm:py-16 bg-[#FCFDFF]" id="metrics">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-200/40">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-2 text-center py-4 sm:py-6 px-2 sm:px-4">
                <div className="flex flex-col items-center justify-center px-4 py-3 md:py-0 relative">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">50%</div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Faster quote approvals</p>
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-slate-200/70"></div>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-3 md:py-0 relative border-y md:border-y-0 border-slate-100">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">2x</div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Accelerated deal velocity</p>
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-slate-200/70"></div>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-3 md:py-0">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">99.9%</div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Platform availability SLA</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clean Capabilities Grid */}
        <section className="py-16 sm:py-24 bg-white" id="product">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Platform Features</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mt-4">Everything you need, nothing you don&apos;t.</h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed">
                Purpose-built modules designed to replace disjointed spreadsheets and accelerate your revenue cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Card 1 */}
              <div className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-[#FCFDFF] hover:border-indigo-200/80 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-indigo-50 ring-4 ring-indigo-50/50 text-indigo-600 flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">description</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Quote Builder</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Generate customized, error-free proposals in seconds with dynamic rule validation and margin guards.
                </p>
              </div>

              {/* Card 2 */}
              <div className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-[#FCFDFF] hover:border-emerald-200/80 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 ring-4 ring-emerald-50/50 text-emerald-600 flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">verified_user</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Smart Approvals</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Eliminate back-and-forth delays with risk-based automated routing and instantaneous policy checkpoints.
                </p>
              </div>

              {/* Card 3 */}
              <div className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-[#FCFDFF] hover:border-sky-200/80 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 relative overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-sky-50 ring-4 ring-sky-50/50 text-sky-600 flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">warehouse</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Fulfillment Engine</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Intelligent warehouse allocation automatically routes orders by customer proximity and real-time inventory.
                </p>
              </div>

              {/* Card 4 */}
              <div className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-[#FCFDFF] hover:border-violet-200/80 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 relative overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-violet-50 ring-4 ring-violet-50/50 text-violet-600 flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">public</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Customer Portal</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Empower clients to review terms, request line adjustments, and execute agreements through a branded portal.
                </p>
              </div>

              {/* Card 5 */}
              <div className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-[#FCFDFF] hover:border-amber-200/80 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 relative overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 ring-4 ring-amber-50/50 text-amber-600 flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">price_change</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Hybrid Billing</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Effortlessly combine one-off hardware, professional services, and recurring licenses within single contracts.
                </p>
              </div>

              {/* Card 6 */}
              <div className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-[#FCFDFF] hover:border-rose-200/80 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 relative overflow-hidden">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-rose-50 ring-4 ring-rose-50/50 text-rose-600 flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">troubleshoot</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Deal Health &amp; Telemetry</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Proactive alerts spot stalled negotiations, delivery bottlenecks, and margin variance before deals slip.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Workflow: Connected Linear Timeline */}
        <section className="py-16 sm:py-24 bg-[#FAFBFD] border-t border-slate-100 relative" id="workflows">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">End-to-End Workflow</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mt-4">From quote to cash in four simple steps</h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed">
                Eliminate fragmented handoffs between sales reps, finance controllers, and warehouse teams.
              </p>
            </div>

            {/* Connected timeline container with connecting rail */}
            <div className="relative">
              {/* Desktop rail connecting the nodes */}
              <div className="hidden lg:block absolute top-7 left-12 right-12 h-0.5 bg-gradient-to-r from-indigo-200 via-sky-200 to-indigo-200 z-0"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
                {/* Step 1 */}
                <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 ring-4 ring-white border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                      01
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Stage One</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Configure Quote</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Assemble multi-tiered product and subscription lines with instant pricing logic.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 ring-4 ring-white border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                      02
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Stage Two</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Automate Approval</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Smart rules evaluate margin thresholds and risk factors for rapid sign-off.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 ring-4 ring-white border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                      03
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Stage Three</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Customer Accepts</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Frictionless online portal review, negotiation comments, and digital signature.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 ring-4 ring-white border border-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                      04
                    </div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Stage Four</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">Fulfill &amp; Bill</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Automated warehouse dispatch and unified ERP billing sync in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Refined Bottom CTA Banner */}
        <section className="py-12 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6 sm:p-10 md:p-14 text-center shadow-xl shadow-slate-950/10 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-40 sm:w-60 h-40 sm:h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Ready to simplify your sales operations?
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Join hundreds of forward-thinking teams closing enterprise agreements faster with DealFlow360.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5">
                  <Link href="/auth/login" className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all shadow-sm">
                    Get started free
                  </Link>
                  <Link href="/portal/login" className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all border border-white/10">
                    Access Customer Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Polished Clean Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[16px]">hub</span>
            </div>
            <span className="font-bold text-slate-900 text-base">DealFlow360</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-slate-500">
            <a href="#product" className="hover:text-slate-900 transition-colors">Product</a>
            <a href="#workflows" className="hover:text-slate-900 transition-colors">Workflows</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          </nav>
          <div className="text-xs text-slate-400">
            &copy; 2026 DealFlow360. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
