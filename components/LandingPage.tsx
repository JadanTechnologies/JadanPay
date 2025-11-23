
import React, { useEffect, useState } from 'react';
import { Smartphone, Zap, Shield, Globe, ArrowRight, Star, ChevronDown, Activity, Wifi, Box, CheckCircle, Moon, Sun, Quote } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '../constants';
import { SettingsService, AppSettings } from '../services/settingsService';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, toggleTheme, isDarkMode }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    SettingsService.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ 
            x: (e.clientX / window.innerWidth - 0.5) * 20, 
            y: (e.clientY / window.innerHeight - 0.5) * 20 
        });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleDownloadApp = () => {
      if(settings?.mobileAppUrl) {
          window.open(settings.mobileAppUrl, '_blank');
      } else {
          alert("App coming soon to Stores!");
      }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white overflow-x-hidden font-sans selection:bg-green-500 selection:text-black transition-colors duration-300">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                {settings?.appName.charAt(0) || 'J'}
            </div>
            <span className="text-xl font-bold tracking-tight">{settings?.appName || 'JadanPay'}</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-green-600 dark:hover:text-white transition-colors">Features</a>
            <a href="#reviews" className="hover:text-green-600 dark:hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex gap-4 items-center">
            <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={onLogin} className="text-sm font-bold text-gray-800 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">Log In</button>
            <button onClick={onGetStarted} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:bg-green-600 dark:hover:bg-green-400 hover:scale-105 transition-all duration-300">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Parallax */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Abstract Background Gradients - Adjusted for Light/Dark */}
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-green-500/10 dark:bg-green-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            
            {/* Text Content */}
            <div className="space-y-8" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-white/5 border border-green-100 dark:border-white/10 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-4 animate-fade-in-up">
                    <Zap size={12} className="fill-current" /> Fast. Secure. Reliable.
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                    {settings?.landingHeroTitle || "Stop Overpaying For Data."}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed">
                    {settings?.landingHeroSubtitle || "Experience the future of VTU. Seamless top-ups, instant delivery, and reseller friendly rates."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onGetStarted}
                        className="px-8 py-4 bg-green-500 text-black rounded-2xl font-bold text-lg hover:bg-green-400 hover:shadow-[0_0_30px_rgba(74,222,128,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none"
                    >
                        Create Free Account <ArrowRight size={20}/>
                    </button>
                    <button 
                        onClick={handleDownloadApp}
                        className="px-8 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <Smartphone size={20}/> Download App
                    </button>
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <img key={i} src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-10 h-10 rounded-full border-2 border-white dark:border-black" alt="" />
                        ))}
                    </div>
                    <div>
                        <div className="flex gap-1 text-yellow-400">
                            {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor"/>)}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Trusted by {settings?.landingStats?.activeUsers || "10,000+"} Nigerians</p>
                    </div>
                </div>
            </div>

            {/* 3D Visual Element */}
            <div className="relative h-[600px] flex items-center justify-center perspective-1000">
                <div 
                    className="relative w-[300px] h-[600px] bg-gray-900 rounded-[40px] border-8 border-gray-800 shadow-2xl transition-transform duration-100 ease-out"
                    style={{
                        transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
                        boxShadow: `${-mousePos.x * 2}px ${mousePos.y * 2}px 50px rgba(34,197,94,0.2)`
                    }}
                >
                    {/* Screen Content */}
                    <div className="absolute inset-0 rounded-[32px] overflow-hidden bg-gray-950 flex flex-col">
                        <div className="h-full w-full bg-gradient-to-b from-gray-900 to-black p-6 relative">
                            {/* Floating Elements inside phone */}
                            <div className="absolute top-10 left-6 right-6 h-32 bg-gradient-to-r from-green-600 to-emerald-800 rounded-2xl p-4 text-white shadow-lg transform translate-z-10">
                                <p className="text-xs opacity-80">Total Balance</p>
                                <h3 className="text-3xl font-bold font-mono mt-1">₦50,240.00</h3>
                                <div className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <Activity size={16} />
                                </div>
                            </div>

                            <div className="absolute top-48 left-6 right-6 grid grid-cols-2 gap-3">
                                <div className="bg-gray-800/50 p-3 rounded-xl border border-white/5 backdrop-blur-md">
                                    <div className="w-8 h-8 bg-yellow-400/20 text-yellow-400 rounded-lg flex items-center justify-center mb-2">
                                        <Zap size={16} />
                                    </div>
                                    <p className="text-[10px] text-gray-400">MTN Airtime</p>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded-xl border border-white/5 backdrop-blur-md">
                                    <div className="w-8 h-8 bg-green-400/20 text-green-400 rounded-lg flex items-center justify-center mb-2">
                                        <Wifi size={16} />
                                    </div>
                                    <p className="text-[10px] text-gray-400">Data Bundle</p>
                                </div>
                            </div>
                            
                             {/* Animated Receipt */}
                             <div className="absolute bottom-10 left-4 right-4 bg-white rounded-t-2xl p-4 animate-slide-up-slow opacity-90">
                                <div className="flex justify-center mb-2">
                                    <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-black font-bold text-sm">Transaction Success</p>
                                        <p className="text-gray-500 text-xs">You sent 10GB to 0803...</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Floating 3D Cards around Phone */}
                <div 
                    className="absolute top-20 right-0 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 p-4 rounded-2xl animate-float shadow-lg"
                    style={{ transform: `translateZ(50px) translateX(${-mousePos.x * 1.5}px)` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold">M</div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-300">MTN SME</p>
                            <p className="font-bold text-gray-900 dark:text-white">1GB @ ₦250</p>
                        </div>
                    </div>
                </div>

                <div 
                    className="absolute bottom-40 -left-10 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 p-4 rounded-2xl animate-float-delayed shadow-lg"
                    style={{ transform: `translateZ(80px) translateX(${mousePos.x * 1.5}px)` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">G</div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-300">Glo Data</p>
                            <p className="font-bold text-gray-900 dark:text-white">Instant Delivery</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="text-gray-500" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                  { label: "Active Users", val: settings?.landingStats?.activeUsers || "10K+" },
                  { label: "Daily Transactions", val: settings?.landingStats?.dailyTransactions || "5000+" },
                  { label: "Uptime", val: settings?.landingStats?.uptime || "99.9%" },
                  { label: "Support", val: settings?.landingStats?.support || "24/7" }
              ].map((stat, i) => (
                  <div key={i}>
                      <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{stat.val}</h3>
                      <p className="text-gray-500 uppercase tracking-wider text-xs font-bold">{stat.label}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Why {settings?.appName || 'JadanPay'}?</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">We've built a platform that puts speed and reliability first. No more "Transaction Pending" nightmares.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-green-500/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-xl">
                      <div className="w-14 h-14 bg-green-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-green-500 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
                          <Zap size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Lightning Fast</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Automated delivery system ensures you get value instantly. 99% of transactions complete in under 5 seconds.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-xl">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                          <Shield size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Bank-Grade Security</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Your wallet is secured with industry standard encryption. Two-factor authentication keeps your funds safe.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-purple-500/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-xl">
                      <div className="w-14 h-14 bg-purple-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-purple-500 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                          <Box size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Developer API</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Building your own VTU site? Integrate with our robust API documentation and start reselling in minutes.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials (Reviews) Section */}
      <section id="reviews" className="py-20 bg-gray-50 dark:bg-black relative border-y border-gray-100 dark:border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
                 <p className="text-gray-500 dark:text-gray-400">Trusted by resellers and individuals across Nigeria.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { name: "Ahmed Musa", role: "Reseller", text: "JadanPay changed my business. The API is super fast and my customers are always happy." },
                    { name: "Grace Eze", role: "Student", text: "Best data rates I've seen. I save almost ₦5,000 monthly on data subscriptions here." },
                    { name: "Tola B", role: "Developer", text: "Integration was smooth. Documentation is clear and support is responsive. Highly recommended." }
                ].map((review, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <Quote className="text-green-500 mb-4 opacity-50" size={32}/>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 italic leading-relaxed">"{review.text}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-500 dark:text-gray-400">
                                {review.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{review.name}</h4>
                                <p className="text-xs text-green-600 dark:text-green-400">{review.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* Referral Section */}
      <section className="py-20 bg-green-50 dark:bg-gradient-to-r dark:from-green-900/20 dark:to-black border-y border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500/5 blur-[100px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                  <div className="inline-block px-4 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-wider mb-6">
                      Refer & Earn
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Free Data for You and Your Friends.</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                      Share your unique referral code with friends. When they join JadanPay, you earn instant bonus credits which you can swap for data bundles.
                  </p>
                  <ul className="space-y-4 mb-8">
                      <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <CheckCircle className="text-green-500" size={20} /> Earn ₦100 per referral instant bonus
                      </li>
                      <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <CheckCircle className="text-green-500" size={20} /> Use bonus to buy any data plan
                      </li>
                      <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <CheckCircle className="text-green-500" size={20} /> No limits on earnings
                      </li>
                  </ul>
                  <button onClick={onGetStarted} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg">
                      Start Earning Now
                  </button>
              </div>
              <div className="relative">
                   <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                       <div className="flex justify-between items-center mb-8">
                           <h3 className="font-bold text-xl text-gray-900 dark:text-white">Referral Earnings</h3>
                           <div className="p-2 bg-green-500/10 text-green-500 dark:text-green-400 rounded-lg">
                               <Activity size={20} />
                           </div>
                       </div>
                       <div className="flex gap-4 mb-8">
                           <div className="flex-1 bg-gray-50 dark:bg-black p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                               <p className="text-gray-500 text-xs uppercase">Total Earned</p>
                               <p className="text-2xl font-bold text-green-600 dark:text-green-400">₦15,000</p>
                           </div>
                            <div className="flex-1 bg-gray-50 dark:bg-black p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                               <p className="text-gray-500 text-xs uppercase">Invited</p>
                               <p className="text-2xl font-bold text-gray-900 dark:text-white">150</p>
                           </div>
                       </div>
                       <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-dashed border-gray-300 dark:border-gray-600">
                           <code className="text-lg font-mono text-green-600 dark:text-green-400">JADAN-2024</code>
                           <span className="text-xs font-bold text-gray-400 uppercase">Your Code</span>
                       </div>
                   </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black font-bold">J</div>
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{settings?.appName || 'JadanPay'}</span>
                      </div>
                      <p className="text-gray-500 text-sm">Simplifying payments for the modern Nigerian.</p>
                  </div>
                  <div>
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Services</h4>
                      <ul className="space-y-2 text-sm text-gray-500">
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Buy Data</a></li>
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Airtime Top-up</a></li>
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Cable TV</a></li>
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Electricity</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Company</h4>
                      <ul className="space-y-2 text-sm text-gray-500">
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">About Us</a></li>
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Contact</a></li>
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Privacy Policy</a></li>
                          <li><a href="#" className="hover:text-green-600 dark:hover:text-green-400">Terms of Service</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Connect</h4>
                      <ul className="space-y-2 text-sm text-gray-500">
                          <li><a href={settings?.socialLinks?.twitter || "#"} className="hover:text-green-600 dark:hover:text-green-400">Twitter</a></li>
                          <li><a href={settings?.socialLinks?.instagram || "#"} className="hover:text-green-600 dark:hover:text-green-400">Instagram</a></li>
                          <li><a href={settings?.socialLinks?.facebook || "#"} className="hover:text-green-600 dark:hover:text-green-400">Facebook</a></li>
                      </ul>
                  </div>
              </div>
              <div className="text-center text-gray-500 text-xs">
                  &copy; {new Date().getFullYear()} {settings?.appName || 'JadanPay'}. All rights reserved.
              </div>
          </div>
      </footer>
      
      <div className="hidden"><CheckCircle size={0} /></div>
    </div>
  );
};
