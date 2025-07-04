import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Galpin Performance Tracker
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Science-based performance optimization for athletes. Track your training, 
            sleep, and supplements based on Dr. Andy Galpin&apos;s research.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all transform hover:scale-105 border border-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Optimize Every Aspect of Your Performance
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Training */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Training Tracking</h3>
              <p className="text-gray-300">
                Log workouts with fasted state, intensity, and nutrition timing. 
                Get recommendations based on training type.
              </p>
            </div>

            {/* Sleep */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Sleep Analytics</h3>
              <p className="text-gray-300">
                Monitor sleep quality, duration, and environmental factors like CO2 levels. 
                Understand how sleep impacts performance.
              </p>
            </div>

            {/* Recovery */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Recovery Tracking</h3>
              <p className="text-gray-300">
                Track post-workout carb timing, readiness scores, and recovery 
                modalities like cold therapy and massage.
              </p>
            </div>

            {/* Supplements */}
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Supplement Management</h3>
              <p className="text-gray-300">
                Track supplements with proper dosing and timing. Get evidence-based 
                recommendations for performance enhancement.
              </p>
            </div>
          </div>
        </div>

        {/* Science Section */}
        <div className="py-16 border-t border-white/20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-white">
                Based on Scientific Research
              </h2>
              <p className="text-gray-300 mb-6">
                Our recommendations are based on insights from Dr. Andy Galpin, 
                Director of the Human Performance Center at Parker University, and 
                backed by peer-reviewed research.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Evidence-based supplement protocols</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Optimal training and nutrition timing</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Sleep quality optimization strategies</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h3 className="font-semibold text-lg mb-4 text-white">Key Insights Include:</h3>
              <div className="space-y-4 text-sm">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <p className="font-medium text-white">Fasted Training</p>
                  <p className="text-gray-300 mt-1">
                    Beneficial for endurance under 60 minutes, not recommended for strength training
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <p className="font-medium text-white">Sleep & CO2</p>
                  <p className="text-gray-300 mt-1">
                    CO2 levels above 900ppm negatively impact sleep quality and recovery
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <p className="font-medium text-white">Strategic Supplementation</p>
                  <p className="text-gray-300 mt-1">
                    Proper timing and dosing of supplements like caffeine, beetroot, and rhodiola
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}