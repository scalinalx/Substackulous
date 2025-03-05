"use client"

import { useState } from 'react';
import { BarChart3, Smile, Settings2, Crown, TrendingUp, Mail, Target, Smartphone, Briefcase, LineChart, RefreshCcw, DollarSign, ShoppingCart, Gift, Phone, Lock } from 'lucide-react';

export function PopupBuilder() {
  const [activeTab, setActiveTab] = useState('create');

  const tabData = {
    'create': {
      heading: 'Content Creation Engine',
      subheading: 'Transform ideas into engaging newsletters in minutes, not hours',
      features: [
        {
          icon: <BarChart3 className="w-6 h-6" />,
          title: 'AI-Powered Writing Assistant',
          description: 'Generate captivating content with our AI-powered writing assistant'
        },
        {
          icon: <Smile className="w-6 h-6" />,
          title: 'Eye-Catching Thumbnails',
          description: 'Create eye-catching thumbnails that drive 3X more clicks'
        },
        {
          icon: <Settings2 className="w-6 h-6" />,
          title: 'Viral Substack Notes',
          description: 'Craft viral Substack Notes that expand your reach exponentially'
        },
        {
          icon: <Crown className="w-6 h-6" />,
          title: 'Proven Templates',
          description: 'Access proven templates tailored to your specific niche'
        }
      ]
    },
    'grow': {
      heading: 'Subscriber Accelerator',
      subheading: 'Build your audience from zero to 10,000+ subscribers',
      features: [
        {
          icon: <TrendingUp className="w-6 h-6" />,
          title: 'Deep Niche Research',
          description: 'Identify viral-worthy topics with our deep niche research tool'
        },
        {
          icon: <Mail className="w-6 h-6" />,
          title: 'Pattern Recognition',
          description: 'Optimize your content strategy with pattern recognition technology'
        },
        {
          icon: <Target className="w-6 h-6" />,
          title: 'Headline Formulas',
          description: 'Convert 40% more visitors with our proven headline formulas'
        },
        {
          icon: <Smartphone className="w-6 h-6" />,
          title: 'Competitive Intelligence',
          description: 'Outperform competitors with actionable competitive intelligence'
        }
      ]
    },
    'monetize': {
      heading: 'Revenue Maximizer',
      subheading: 'Turn your audience into a thriving, profitable business',
      features: [
        {
          icon: <Briefcase className="w-6 h-6" />,
          title: 'Irresistible Paid Offers',
          description: 'Create irresistible paid offers that convert 5X better'
        },
        {
          icon: <LineChart className="w-6 h-6" />,
          title: 'Perfect Monetization Model',
          description: 'Identify your perfect monetization model with our strategic advisor'
        },
        {
          icon: <RefreshCcw className="w-6 h-6" />,
          title: 'Pricing Strategy',
          description: 'Optimize your pricing strategy for maximum lifetime value'
        },
        {
          icon: <DollarSign className="w-6 h-6" />,
          title: 'Upsell Journeys',
          description: 'Design upsell journeys that increase average revenue per subscriber'
        }
      ]
    },
    'simplify': {
      heading: 'All-in-One Solution',
      subheading: 'Replace 12+ tools with one streamlined platform',
      features: [
        {
          icon: <ShoppingCart className="w-6 h-6" />,
          title: 'Cost Savings',
          description: 'Save up to $300/month on redundant subscriptions'
        },
        {
          icon: <Gift className="w-6 h-6" />,
          title: 'Streamlined Workflow',
          description: 'Cut your workflow time by 75% with our integrated dashboard'
        },
        {
          icon: <Phone className="w-6 h-6" />,
          title: 'Intuitive Platform',
          description: 'Master one intuitive platform instead of juggling multiple tools'
        },
        {
          icon: <Lock className="w-6 h-6" />,
          title: 'Future-Proof Business',
          description: 'Future-proof your newsletter business with monthly feature updates'
        }
      ]
    }
  };

  return (
    <section className="w-full bg-gradient-to-b from-[#fff6f2] to-[#fcd12a] py-24 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open_Sans','Helvetica_Neue',sans-serif]">
      <div className="container max-w-[1200px] mx-auto text-center px-5 relative">
        <div className="text-[14px] tracking-[2px] mb-4 font-medium text-black">SINCE 2012</div>
        
        <h1 className="text-[36px] leading-[1.3] font-semibold mb-5 text-black">
        Transform Your Newsletter<br/>
        From Zero to 10,000 Subscribers
        </h1>

        {/* Stacked paper effect */}
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-white transform translate-x-4 translate-y-4 rounded-md shadow-md"></div>
          <div className="absolute inset-0 bg-gray-200 transform translate-x-2 translate-y-2 rounded-md shadow-md"></div>
          <div className="relative bg-black rounded-md shadow-lg">
            <h1 className='text-[40px] md:text-[56px] leading-[1.1] font-extrabold text-white px-6 py-3'>
              And $10,000+ per month!
            </h1>
          </div>
        </div>
        
        <p className="text-[16px] leading-[1.6] text-gray-700 max-w-[800px] mx-auto mb-12">
        Substackulous is the all-in-one platform that helps you <br/>create, grow, and monetize your newsletter without the guesswork.  
        </p>
        
        <div className="relative">
          <div className="flex justify-center bg-white rounded-full p-1 shadow-md max-w-[700px] mx-auto absolute -top-6 left-1/3 transform -translate-x-1/2 z-10">
            {Object.keys(tabData).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full font-medium text-[15px] transition-all ${
                  activeTab === tab ? 'bg-black text-white' : 'text-black hover:bg-gray-50'
                }`}
              >
                {tab === 'create' ? 'CREATE' :
                 tab === 'grow' ? 'GROW' :
                 tab === 'monetize' ? 'MONETIZE' : 'SIMPLIFY'}
              </button>
            ))}
          </div>

          {Object.entries(tabData).map(([tab, content]) => (
            <div
              key={tab}
              className={`${
                activeTab === tab ? 'block' : 'hidden'
              }`}
            >
              <div className="bg-black rounded-[20px] p-10 text-white relative border-[3px] border-[rgba(255,128,102,0.6)] pt-16">
                <h2 className="text-[32px] mb-6 font-semibold">{content.heading}</h2>
                <p className="text-[18px] mb-10 text-gray-300">{content.subheading}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left mt-8">
                  {content.features.map((feature, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="text-[24px] flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-[20px] mb-2.5">{feature.title}</h3>
                        <p className="text-[15px] leading-[1.5] text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12">
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-transform hover:scale-105"
            onClick={() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            START YOUR JOURNEY TODAY
          </button>
        </div>
      </div>
    </section>
  );
} 