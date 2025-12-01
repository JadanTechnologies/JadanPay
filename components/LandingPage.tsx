import React, { useEffect, useState } from 'react';
import { Smartphone, Zap, Shield, ArrowRight, Star, ChevronDown, Activity, Wifi, Box, CheckCircle, Moon, Sun, Quote, X, Mail, MapPin, Phone, Code2 } from 'lucide-react';
import { SettingsService, AppSettings } from '../services/settingsService';
import { AIAgent } from './AIAgent';

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
  
  // Info Modal State
  const [activeInfoModal, setActiveInfoModal] = useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);

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

  const renderInfoModal = () => {
      if (!activeInfoModal || !settings) return null;
      
      let title = "";
      let content = "";

      switch(activeInfoModal) {
        case 'about':
          title = "About Us";
          content = settings.aboutUsContent;
          break;
        case 'contact':
          title = "Contact Us";
          // Contact is special, it has structured data
          break;
        case 'privacy':
          title = "Privacy Policy";
          content = settings.privacyPolicyContent;
          break;
         case 'terms':
          title = "Terms of Service";
          content = settings.termsOfServiceContent;
          break;
      }

      return (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in pointer-events-auto" style={{zIndex: 99999}}>
           <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
              <button 
                onClick={() => setActiveInfoModal(null)}
                className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors z-10"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white pr-10 border-b border-gray-100 dark:border-gray-800 pb-4">{title}</h2>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeInfoModal === 'contact' ? (
                     <div className="space-y-6 text-gray-700 dark:text-gray-200 text-base">
                       <p>We are here to help 24/7. Reach out to us through any of the channels below.</p>
                       <div className="space-y-4">
                           <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-2xl flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                              <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full text-green-700 dark:text-green-400"><Mail size={24} /></div>
                              <div><p className="font-bold text-gray-900 dark:text-white">Email Support</p><p className="text-sm font-medium">{settings?.supportEmail}</p></div>
                           </div>
                           <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-2xl flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-700 dark:text-blue-400"><Phone size={24} /></div>
                              <div><p className="font-bold text-gray-900 dark:text-white">Phone / Whatsapp</p><p className="text-sm font-medium">{settings?.supportPhone}</p></div>
                           </div>
                           <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-2xl flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                              <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full text-purple-700 dark:text-purple-400"><MapPin size={24} /></div>
                              <div><p className="font-bold text-gray-900 dark:text-white">Head Office</p><p className="text-sm font-medium">{settings.officeAddress}</p></div>
                           </div>
                       </div>
                    </div>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}></div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => setActiveInfoModal(null)}
                    className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-lg hover:bg-green-800 transition-colors shadow-lg shadow-green-900/20"
                  >
                      Close
                  </button>
              </div>
           </div>
        </div>
      );
  };

  const appName = settings?.appName || 'JadanPay';
  const logoUrl = settings?.logoUrl;

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white overflow-x-hidden font-sans selection:bg-green-500 selection:text-black transition-colors duration-300">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 dark:bg-black/90 backdrop-blur-lg border-b border-gray-200 dark:border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm" />
            ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-xl flex items-center justify-center text-black font-black text-lg md:text-xl shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    {appName.charAt(0)}
                </div>
            )}
            <span className="text-lg md:text-xl font-bold tracking-tight">{appName}</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-green-600 dark:hover:text-white transition-colors">Features</a>
            <a href="#reviews" className="hover:text-green-600 dark:hover:text-white transition-colors">Reviews</a>
            <button onClick={() => setActiveInfoModal('about')} className="hover:text-green-600 dark:hover:text-white transition-colors">About</button>
            <button onClick={() => setActiveInfoModal('contact')} className="hover:text-green-600 dark:hover:text-white transition-colors">Contact</button>
          </div>
          <div className="flex gap-2 md:gap-4 items-center">
            <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={onLogin} className="text-sm font-bold text-gray-800 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors hidden sm:block">Log In</button>
            <button onClick={onGetStarted} className="px-4 md:px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs md:text-sm hover:bg-green-600 dark:hover:bg-green-400 hover:scale-105 transition-all duration-300 shadow-md">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Parallax */}
      <section className="relative min-h-screen flex items-center pt-24 md:pt-20 overflow-hidden">
        {/* Abstract Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-green-500/10 dark:bg-green-600/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[80px] md:blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            
            {/* Text Content */}
            <div className="space-y-6 md:space-y-8" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-white/5 border border-green-100 dark:border-white/10 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-2 md:mb-4 animate-fade-in-up">
                    <Zap size={12} className="fill-current" /> Fast. Secure. Reliable.
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                    {settings?.landingHeroTitle || "Stop Overpaying For Data."}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed">
                    {settings?.landingHeroSubtitle || "Experience the future of VTU. Seamless top-ups, instant delivery, and reseller friendly rates."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onGetStarted}
                        className="px-8 py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-500 hover:shadow-[0_0_30px_rgba(22,163,74,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-green-200 dark:shadow-green-900/30"
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
                            <img key={i} src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-10 h-10 rounded-full border-2 border-white dark:border-black shadow-sm" alt="" />
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

            {/* 3D Visual Element (Hidden on mobile) */}
            <div className="relative h-[600px] items-center justify-center perspective-1000 hidden lg:flex">
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
            </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
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
                      <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">{stat.val}</h3>
                      <p className="text-gray-500 uppercase tracking-wider text-[10px] md:text-xs font-bold">{stat.label}</p>
                  </div>
              ))}
          </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12 md:mb-20">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Why {appName}?</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">We've built a platform that puts speed and reliability first. No more "Transaction Pending" nightmares.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-green-500/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-xl">
                      <div className="w-14 h-14 bg-green-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-green-500 dark:text-green-400 mb-6 group-hover:scale-110 transition-transform">
                          <Zap size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Lightning Fast</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm md:text-base">Automated delivery system ensures you get value instantly. 99% of transactions complete in under 5 seconds.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-xl">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                          <Shield size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Bank-Grade Security</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm md:text-base">Your wallet is secured with industry standard encryption. Two-factor authentication keeps your funds safe.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-purple-500/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group shadow-sm hover:shadow-xl">
                      <div className="w-14 h-14 bg-purple-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-purple-500 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                          <Box size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Developer API</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm md:text-base">Building your own VTU site? Integrate with our robust API documentation and start reselling in minutes.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Referral Section - FIXED CONTRAST */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
          {/* Subtle Background Effect */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-green-600/10 blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                  <div className="inline-block px-4 py-1 rounded-full bg-green-500/20 text-green-300 font-bold text-xs uppercase tracking-wider mb-6 border border-green-500/30">
                      Refer & Earn
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Free Data for You and Your Friends.</h2>
                  <p className="text-gray-100 text-lg mb-8 leading-relaxed">
                      Share your unique referral code with friends. When they join {appName}, you earn instant bonus credits which you can swap for data bundles.
                  </p>
                  <ul className="space-y-4 mb-8">
                      <li className="flex items-center gap-3 text-white">
                          <CheckCircle className="text-green-400 shrink-0" size={20} /> Earn ₦{settings?.referralReward || 100} per referral instant bonus
                      </li>
                      <li className="flex items-center gap-3 text-white">
                          <CheckCircle className="text-green-400 shrink-0" size={20} /> Use bonus to buy any data plan
                      </li>
                      <li className="flex items-center gap-3 text-white">
                          <CheckCircle className="text-green-400 shrink-0" size={20} /> No limits on earnings
                      </li>
                  </ul>
                  <button onClick={onGetStarted} className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg">
                      Start Earning Now
                  </button>
              </div>
              
              <div className="relative">
                   <div className="bg-white/5 border border-white/10 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl backdrop-blur-md">
                       <div className="flex justify-between items-center mb-8">
                           <h3 className="font-bold text-xl text-white">Referral Earnings</h3>
                           <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                               <Activity size={20} />
                           </div>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-4 mb-8">
                           <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/10">
                               <p className="text-gray-400 text-xs uppercase">Total Earned</p>
                               <p className="text-2xl font-bold text-green-400">₦15,000</p>
                           </div>
                            <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/10">
                               <p className="text-gray-400 text-xs uppercase">Invited</p>
                               <p className="text-2xl font-bold text-white">150</p>
                           </div>
                       </div>
                       <div className="bg-black/40 p-4 rounded-xl flex items-center justify-between border border-dashed border-gray-600">
                           <code className="text-lg font-mono text-green-400">JADAN-2024</code>
                           <span className="text-xs font-bold text-gray-500 uppercase">Your Code</span>
                       </div>
                   </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center gap-2 mb-4">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                        ) : (
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black font-bold">
                                {appName.charAt(0)}
                            </div>
                        )}
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{appName}</span>
                      </div>
                      <p className="text-gray-500 text-sm">Simplifying payments for the modern Nigerian.</p>
                  </div>
                  <div>
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Services</h4>
                      <ul className="space-y-2 text-sm text-gray-500">
                          <li><button onClick={onLogin} className="hover:text-green-600 dark:hover:text-green-400 text-left">Buy Data</button></li>
                          <li><button onClick={onLogin} className="hover:text-green-600 dark:hover:text-green-400 text-left">Airtime Top-up</button></li>
                          <li><button onClick={onLogin} className="hover:text-green-600 dark:hover:text-green-400 text-left">Cable TV</button></li>
                          <li><button onClick={onLogin} className="hover:text-green-600 dark:hover:text-green-400 text-left">Electricity</button></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Company</h4>
                      <ul className="space-y-2 text-sm text-gray-500">
                          <li><button onClick={() => setActiveInfoModal('about')} className="hover:text-green-600 dark:hover:text-green-400 text-left">About Us</button></li>
                          <li><button onClick={() => setActiveInfoModal('contact')} className="hover:text-green-600 dark:hover:text-green-400 text-left">Contact</button></li>
                          <li><button onClick={() => setActiveInfoModal('privacy')} className="hover:text-green-600 dark:hover:text-green-400 text-left">Privacy Policy</button></li>
                          <li><button onClick={() => setActiveInfoModal('terms')} className="hover:text-green-600 dark:hover:text-green-400 text-left">Terms of Service</button></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Connect</h4>
                      <ul className="space-y-2 text-sm text-gray-500">
                          <li><a href={settings?.socialLinks?.twitter || "#"} target="_blank" rel="noreferrer" className="hover:text-green-600 dark:hover:text-green-400">Twitter</a></li>
                          <li><a href={settings?.socialLinks?.instagram || "#"} target="_blank" rel="noreferrer" className="hover:text-green-600 dark:hover:text-green-400">Instagram</a></li>
                          <li><a href={settings?.socialLinks?.facebook || "#"} target="_blank" rel="noreferrer" className="hover:text-green-600 dark:hover:text-green-400">Facebook</a></li>
                      </ul>
                  </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center">
                  <p className="text-gray-500 text-xs mb-2">
                      &copy; {new Date().getFullYear()} {appName}. All rights reserved.
                  </p>
              </div>
          </div>
      </footer>
      
      {/* AI Agent */}
      {settings?.aiAgentSettings?.enabled && <AIAgent />}
      
      {activeInfoModal && renderInfoModal()}
    </div>
  );
};