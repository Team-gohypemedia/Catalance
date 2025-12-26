import React from 'react';
import { useTheme } from "@/components/theme-provider";
import { 
    Twitter, 
    Linkedin, 
    Instagram, 
    Heart, 
    ArrowRight, 
    Cpu 
} from 'lucide-react';

const Footer = () => {
    // Theme is ignored for Footer as it is always dark
    
    return (
        <footer className="relative w-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-black via-[#0a0a0a] to-black pt-16 pb-12 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#f2cc0d]/5 blur-[120px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#f2cc0d]/5 blur-[100px]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
                    {/* Brand Column (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <a className="flex items-center gap-2 group/logo w-fit" href="#">
                            <div className="w-10 h-10 rounded-lg bg-[#f2cc0d] flex items-center justify-center text-[#181711]">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight group-hover/logo:text-[#f2cc0d] transition-colors">Catalance</span>
                        </a>
                        <p className="text-[#bab59c] text-lg font-medium leading-relaxed max-w-sm">
                            Orchestrating the future of work with premium enterprise talent solutions.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-4 mt-2">
                            {[
                                { icon: Twitter, color: "hover:text-[#1DA1F2]" },
                                { icon: Linkedin, color: "hover:text-[#0A66C2]" },
                                { icon: Instagram, color: "hover:text-[#E4405F]" },
                                { icon: Heart, color: "hover:text-red-500" }
                            ].map((Social, index) => (
                                <a key={index} className={`group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-[#bab59c] hover:bg-[#f2cc0d] hover:text-[#181711] transition-all duration-300 hover:shadow-[0_0_15px_rgba(242,204,13,0.4)] ${Social.color}`} href="#">
                                    <Social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns (Span 2 each -> 8 total) */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
                        {/* Platform */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Platform</h3>
                            <nav className="flex flex-col gap-3">
                                {["Browse Talent", "Enterprise Solutions", "Pricing"].map((link) => (
                                    <a key={link} className="text-slate-400 hover:text-[#f2cc0d] transition-colors text-sm font-medium" href="#">{link}</a>
                                ))}
                            </nav>
                        </div>
                        {/* Company */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Company</h3>
                            <nav className="flex flex-col gap-3">
                                <a className="text-slate-400 hover:text-[#f2cc0d] transition-colors text-sm font-medium" href="#">About Us</a>
                                <a className="text-slate-400 hover:text-[#f2cc0d] transition-colors text-sm font-medium flex items-center" href="#">
                                    Careers <span className="ml-1 text-[10px] bg-[#f2cc0d]/20 text-[#f2cc0d] px-1.5 py-0.5 rounded font-bold">Hiring</span>
                                </a>
                            </nav>
                        </div>
                        {/* Resources */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Resources</h3>
                            <nav className="flex flex-col gap-3">
                                {["Blog", "Help Center"].map((link) => (
                                    <a key={link} className="text-slate-400 hover:text-[#f2cc0d] transition-colors text-sm font-medium" href="#">{link}</a>
                                ))}
                            </nav>
                        </div>
                        {/* Legal */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Legal</h3>
                            <nav className="flex flex-col gap-3">
                                {["Terms of Service", "Privacy Policy"].map((link) => (
                                    <a key={link} className="text-slate-400 hover:text-[#f2cc0d] transition-colors text-sm font-medium" href="#">{link}</a>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Newsletter Section */}
                <div className="border-t border-white/10 pt-12 pb-12 mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex flex-col gap-2 max-w-md">
                            <h3 className="text-2xl font-bold text-white">Stay ahead of the curve</h3>
                            <p className="text-[#bab59c] text-sm">Get the latest insights on enterprise scaling and workforce management delivered to your inbox.</p>
                        </div>
                        <div className="w-full max-w-md">
                            <form className="relative group">
                                <input className="w-full h-14 pl-6 pr-16 bg-[#221f10] border-none rounded-2xl text-white placeholder:text-[#bab59c]/50 focus:ring-2 focus:ring-[#f2cc0d]/50 transition-all outline-none" placeholder="Enter your email address" type="email" />
                                <button className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center bg-[#f2cc0d] rounded-xl text-[#181711] hover:bg-[#ffe03d] transition-colors shadow-lg shadow-[#f2cc0d]/20" type="button">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-transparent">
                    <p className="text-slate-500 text-sm font-medium">© 2024 Catalance Inc. All rights reserved.</p>
                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-slate-300">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
