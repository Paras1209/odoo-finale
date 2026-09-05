import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">DealFlow360</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/auth/login" 
                className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/portal/login" 
                className="btn-primary btn-sm"
              >
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-600 mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Trusted by sales teams worldwide
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
              Sales operations,{' '}
              <span className="text-slate-500">simplified</span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto text-pretty">
              Streamline quotations, automate approvals, and accelerate fulfillment. 
              One platform for your entire sales workflow.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/auth/login"
                className="btn-primary btn-lg w-full sm:w-auto"
              >
                Get started free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                href="/portal/login"
                className="btn-secondary btn-lg w-full sm:w-auto"
              >
                Customer login
              </Link>
            </div>
          </div>
          
          {/* Hero visual */}
          <div className="mt-16 sm:mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl shadow-slate-900/20 max-w-5xl mx-auto">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                {/* Mock browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-slate-600" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-700/50 rounded-md h-6 max-w-md mx-auto" />
                  </div>
                </div>
                {/* Dashboard preview */}
                <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 p-6 sm:p-8">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
                        <div className="h-6 w-20 bg-slate-300 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm h-48">
                      <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-300 rounded-full" style={{ width: `${80 - i * 20}%` }} />
                            </div>
                            <div className="h-3 w-8 bg-slate-200 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm h-48">
                      <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-full" />
                            <div className="flex-1">
                              <div className="h-2 w-full bg-slate-100 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container-wide">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              A complete toolkit for managing your sales pipeline from quote to cash
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <FeatureCard 
              title="Quote Builder"
              description="Build professional quotes with automatic pricing, discounts, and margin calculations"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <FeatureCard 
              title="Smart Approvals"
              description="Configurable approval workflows with risk scoring and automated routing"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <FeatureCard 
              title="Fulfillment"
              description="Multi-warehouse inventory management with intelligent allocation"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
            />
            <FeatureCard 
              title="Customer Portal"
              description="Self-service portal for customers to review quotes and track orders"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24">
        <div className="container-wide">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <StatItem value="99.9%" label="Uptime SLA" />
            <StatItem value="50%" label="Faster approvals" />
            <StatItem value="2x" label="Deal velocity" />
            <StatItem value="24/7" label="Support" />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="container-wide">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              From quote to cash
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              A streamlined workflow that keeps your team focused and your customers happy
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <WorkflowStep 
              step="01"
              title="Create Quote"
              description="Build quotes with product catalog, auto-calculated pricing, and smart suggestions"
            />
            <WorkflowStep 
              step="02"
              title="Get Approval"
              description="Risk-based routing ensures the right people review at the right time"
            />
            <WorkflowStep 
              step="03"
              title="Customer Accepts"
              description="Customers review via portal, negotiate terms, and confirm orders"
            />
            <WorkflowStep 
              step="04"
              title="Fulfill & Bill"
              description="Automated fulfillment allocation and invoice generation"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container-wide">
          <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Ready to streamline your sales?
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
              Join teams that have already transformed their sales operations with DealFlow360
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/auth/login"
                className="btn-primary btn-lg w-full sm:w-auto"
              >
                Start for free
              </Link>
              <Link 
                href="/portal/login"
                className="btn-secondary btn-lg w-full sm:w-auto"
              >
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 sm:py-12">
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold text-slate-900">DealFlow360</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} DealFlow360. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StatItem({ 
  value, 
  label 
}: { 
  value: string; 
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function WorkflowStep({ 
  step, 
  title, 
  description 
}: { 
  step: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="relative">
      <div className="text-6xl font-bold text-slate-800/50 mb-4">{step}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
