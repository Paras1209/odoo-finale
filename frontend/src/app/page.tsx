// ===========================================
// DealFlow360 - Landing Page
// ===========================================
// PHASE 0: Simple landing with navigation to auth.
// ===========================================

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-indigo-900">DealFlow360</h1>
          <nav className="space-x-4">
            <Link 
              href="/auth/login" 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Internal Login
            </Link>
            <Link 
              href="/portal/login" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Customer Portal
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Intelligent Sales Operations Platform
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Streamline quotations, approvals, fulfillment, and billing in one unified platform.
            Built for teams that need control, visibility, and speed.
          </p>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <FeatureCard 
              title="Quotation Builder"
              description="Create and manage quotes with automatic discount calculations"
              icon="📝"
            />
            <FeatureCard 
              title="Smart Approvals"
              description="Configurable approval chains with risk assessment"
              icon="✅"
            />
            <FeatureCard 
              title="Fulfillment"
              description="Multi-warehouse inventory with smart allocation"
              icon="📦"
            />
            <FeatureCard 
              title="Customer Portal"
              description="Self-service portal for customers to track orders"
              icon="🌐"
            />
          </div>

          {/* CTA */}
          <div className="mt-16 space-x-4">
            <Link 
              href="/auth/login"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition inline-block"
            >
              Get Started
            </Link>
            <Link 
              href="/portal/login"
              className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition inline-block"
            >
              Customer Portal
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
