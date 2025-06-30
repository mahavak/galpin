'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Protocol {
  id: string
  title: string
  category: string
  description: string
  content: string
  keyPoints: string[]
  dosage?: string
  timing?: string
  evidence?: string
}

const protocols: Protocol[] = [
  {
    id: 'metabolic-flexibility',
    title: 'Metabolic Flexibility Training',
    category: 'Performance',
    description: 'Dr. Galpin\'s approach to developing true metabolic flexibility - not just fat burning, but the ability to efficiently use both carbohydrates and fats.',
    content: `True metabolic flexibility means having the ability to run the whole gamut of fuel sources. It's not just about maximizing fat burning - that's specialization, not flexibility.

You should be able to go 6 hours without food and still perform cognitively. You shouldn't be hangry and cranky because you missed lunch. You should be able to not eat any calories for 24 hours and still exercise.`,
    keyPoints: [
      'Metabolic flexibility = ability to use both carbs and fats efficiently',
      'Should handle 6+ hours without food while maintaining cognitive function',
      'Fasted training under 60 minutes can enhance mitochondrial adaptations',
      'Personal preference matters more than theoretical benefits',
      'Exercise develops metabolic flexibility better than diet alone'
    ],
    timing: 'Assess current flexibility before implementing interventions'
  },
  {
    id: 'fasted-training',
    title: 'Fasted Training Protocol',
    category: 'Training',
    description: 'Strategic use of fasted training for specific adaptations based on Dr. Galpin\'s research and recommendations.',
    content: `Fasted training can provide benefits for mitochondrial adaptations and fat oxidation, but only under specific conditions:

- Exercise duration under 60 minutes
- Low to moderate intensity (Zone 2)
- Personal tolerance is key
- Benefits are subtle but real`,
    keyPoints: [
      'Best for sub-60 minute, moderate intensity exercise',
      'Enhances mitochondrial enzyme adaptations',
      'Personal preference trumps small physiological benefits',
      'Not recommended for strength training',
      'Morning timing often works best'
    ],
    timing: 'Morning preferred, avoid for strength training'
  },
  {
    id: 'time-restricted-eating',
    title: '16:8 Time-Restricted Eating',
    category: 'Nutrition',
    description: 'Dr. Galpin\'s latest research on 16:8 intermittent fasting for muscle growth and performance.',
    content: `Recent study showed 16:8 time-restricted eating works for muscle growth IF you hit your numbers:

- Same muscle growth as normal eating patterns
- Slightly less fat gain during bulking
- Some fatigue accumulation over time
- Harder to hit high carbohydrate targets`,
    keyPoints: [
      'Can maintain muscle growth if protein targets are met',
      'May reduce fat gain during muscle-building phases',
      'GI distress from cramming carbs into 8-hour window',
      'Evening fasting may be superior to morning fasting',
      'Not the first choice for well-trained athletes'
    ],
    dosage: 'Standard protein targets (1.6g+ per kg bodyweight)',
    timing: 'Consider evening fast vs morning fast based on training schedule'
  },
  {
    id: 'carb-timing',
    title: 'Carbohydrate Timing Strategy',
    category: 'Nutrition',
    description: 'Precision carbohydrate timing for performance and recovery based on Dr. Galpin\'s protocols.',
    content: `Carbohydrate timing matters significantly for endurance performance and recovery:

Pre-exercise (3-4 hours): 50-100g slow-digesting carbs
Pre-exercise (30 min): 50-60g fast carbs (avoid glucose double-whammy)
During exercise (60+ min): 60-100g per hour
Post-exercise: 100g within 1 hour for rapid glycogen replenishment`,
    keyPoints: [
      'Timing matters more for carbs than protein',
      'Avoid fast carbs 30min before exercise (glucose dip)',
      'During exercise: prioritize fast absorption',
      'Post-exercise: faster carb intake = faster glycogen replenishment',
      'Practice race nutrition in training'
    ],
    dosage: '50-100g pre, 60-100g/hour during, 100g post',
    timing: 'Timing is everything - follow the specific windows'
  },
  {
    id: 'magnesium-protocol',
    title: 'Magnesium Supplementation',
    category: 'Supplements',
    description: 'Dr. Galpin\'s go-to mineral supplement for 90% of his clients.',
    content: `Magnesium is the most commonly deficient mineral, especially in athletes:

- 40-60% of population is deficient
- Athletes need 10-20% more than RDA due to sweat and tissue breakdown
- Forms: bisglycinate, citrate, or threonate all work well
- Clear benefits for sleep quality and recovery`,
    keyPoints: [
      '90% of Dr. Galpin\'s clients supplement magnesium',
      'Most people consume <250mg vs 320-420mg RDA',
      'Athletes have higher needs due to sweat losses',
      'Significant improvements in sleep metrics',
      'GI distress is main side effect (dose-dependent)'
    ],
    dosage: '150-200mg starting dose, can double for larger individuals',
    timing: 'Can take anytime, many prefer evening for sleep benefits'
  },
  {
    id: 'omega3-protocol',
    title: 'Omega-3 Optimization',
    category: 'Supplements',
    description: 'Essential fatty acid protocol for performance and recovery.',
    content: `Omega-3s are a staple for nearly all of Dr. Galpin\'s clients:

- Most people have extremely low omega-3 index
- Professional athletes often have <5% omega-3 index (should be 8%+)
- Benefits for muscle preservation, recovery, and inflammation
- Preloading for 4+ weeks maximizes benefits`,
    keyPoints: [
      'NBA players often have <5% omega-3 index',
      'Reduces disuse atrophy by ~50% when preloaded',
      'Sensitizes muscle to amino acids',
      'Anti-inflammatory and membrane health benefits',
      'Food sources preferred but supplementation often needed'
    ],
    dosage: '1.5-2g per day to reach 8% omega-3 index',
    timing: 'With meals, consistent daily intake for 4+ weeks'
  },
  {
    id: 'creatine-protocol',
    title: 'Creatine Monohydrate',
    category: 'Supplements',
    description: 'The gold standard performance supplement according to Dr. Galpin.',
    content: `Creatine is the #1 performance supplement with the most research backing:

- Enhances power output and training volume
- Supports muscle growth through increased training capacity
- Cognitive benefits increasingly recognized
- No need for loading phases in most cases`,
    keyPoints: [
      'Most researched and effective performance supplement',
      'Benefits power, strength, and muscle growth',
      'Emerging cognitive and neuroprotective effects',
      'Monohydrate is the gold standard form',
      'Safe for long-term use'
    ],
    dosage: '3-5g daily, no loading needed',
    timing: 'Anytime, can be taken with other supplements'
  },
  {
    id: 'rhodiola-protocol',
    title: 'Rhodiola Rosea for Stress Adaptation',
    category: 'Supplements',
    description: 'Adaptogenic herb for managing training stress without compromising adaptations.',
    content: `Rhodiola helps manage stress response to high-intensity training:

- Reduces HRV disruption from hard training
- Maintains performance while reducing stress markers
- Not a stimulant - different mechanism than caffeine
- Muscular endurance benefits documented`,
    keyPoints: [
      'Adaptogen that mitigates stress response',
      'Doesn\'t compromise training adaptations',
      'Benefits muscular endurance performance',
      'No stimulant effects or sleep disruption',
      'Take chronically, not just pre-workout'
    ],
    dosage: '150mg starting dose, can go up to 800mg',
    timing: 'Morning preferred, can take daily'
  },
  {
    id: 'caffeine-protocol',
    title: 'Strategic Caffeine Use',
    category: 'Supplements',
    description: 'Optimizing caffeine for performance without adaptation issues.',
    content: `Caffeine remains one of the most effective performance enhancers:

- Performance benefits independent of tolerance
- Don\'t need to cycle off for effectiveness
- Enhances power, endurance, and focus
- Fat oxidation benefits are acute, not long-term`,
    keyPoints: [
      'No need to cycle off for performance benefits',
      'Works even with daily use/tolerance',
      '4-6mg per kg bodyweight optimal',
      'Fat burning effect is acute during exercise',
      'Avoid >500mg doses (diminishing returns + side effects)'
    ],
    dosage: '150-400mg or 4-6mg per kg bodyweight',
    timing: '30-60 minutes before training'
  },
  {
    id: 'recovery-nutrition',
    title: 'Post-Exercise Recovery Nutrition',
    category: 'Nutrition',
    description: 'Dr. Galpin\'s hierarchy for optimal post-workout nutrition.',
    content: `Recovery nutrition priority depends on your schedule:

Multiple sessions per day: Immediate carb + protein
Daily training: Prioritize total daily intake
Occasional training: Timing matters less

The faster you need to recover, the more timing matters.`,
    keyPoints: [
      'Timing importance scales with training frequency',
      'Carb timing matters more than protein timing',
      'Multiple daily sessions require immediate refueling',
      'Total daily intake trumps timing for most people',
      'Practice competition nutrition strategies'
    ],
    dosage: '100g carbs + 20-40g protein post-workout',
    timing: 'Within 1 hour for rapid recovery needs'
  }
]

export default function GalpinProtocolsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: 'All Protocols', icon: '📚' },
    { id: 'Nutrition', name: 'Nutrition', icon: '🥗' },
    { id: 'Supplements', name: 'Supplements', icon: '💊' },
    { id: 'Training', name: 'Training', icon: '🏋️' },
    { id: 'Performance', name: 'Performance', icon: '⚡' }
  ]

  const filteredProtocols = selectedCategory === 'all' 
    ? protocols 
    : protocols.filter(p => p.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Dr. Andy Galpin's Performance Protocols</h1>
        <p className="text-blue-100 mb-4">
          Evidence-based protocols from the director of the Human Performance Center at Parker University
        </p>
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-sm">
            🎙️ <strong>Source:</strong> The Optimal Diet, Supplement, & Recovery Protocol for Peak Performance
            <br />
            📺 Latest research from muscle physiology expert and performance coach to Olympians and UFC fighters
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Protocol Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-3 rounded-lg border transition-all text-center ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-xs text-white">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Protocols List */}
      <div className="space-y-4">
        {filteredProtocols.map((protocol) => (
          <div key={protocol.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
            <div 
              className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      {protocol.category}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{protocol.title}</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{protocol.description}</p>
                  
                  {protocol.dosage && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-400">
                        <strong>Dosage:</strong> {protocol.dosage}
                      </span>
                      {protocol.timing && (
                        <span className="text-yellow-400">
                          <strong>Timing:</strong> {protocol.timing}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-white ml-4">
                  {expandedProtocol === protocol.id ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {expandedProtocol === protocol.id && (
              <div className="px-6 pb-6 border-t border-white/20">
                <div className="mt-4 space-y-4">
                  {/* Detailed Content */}
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Protocol Details</h4>
                    <div className="text-gray-300 text-sm whitespace-pre-line">
                      {protocol.content}
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-300 mb-2">Key Takeaways</h4>
                    <ul className="space-y-1">
                      {protocol.keyPoints.map((point, index) => (
                        <li key={index} className="text-blue-200 text-sm flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Implementation */}
                  <div className="bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-300 mb-2">Implementation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {protocol.dosage && (
                        <div>
                          <span className="text-green-400 font-medium">Dosage: </span>
                          <span className="text-green-200">{protocol.dosage}</span>
                        </div>
                      )}
                      {protocol.timing && (
                        <div>
                          <span className="text-green-400 font-medium">Timing: </span>
                          <span className="text-green-200">{protocol.timing}</span>
                        </div>
                      )}
                      {protocol.evidence && (
                        <div className="md:col-span-2">
                          <span className="text-green-400 font-medium">Evidence: </span>
                          <span className="text-green-200">{protocol.evidence}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
        <h4 className="font-medium text-yellow-300 mb-2">⚠️ Important Disclaimer</h4>
        <p className="text-yellow-200 text-sm">
          These protocols are based on Dr. Andy Galpin's research and clinical experience. Individual responses may vary. 
          Consult with healthcare providers before making significant changes to your nutrition or supplementation routine, 
          especially if you have medical conditions or take medications.
        </p>
      </div>
    </div>
  )
}