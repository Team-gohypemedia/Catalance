import React from 'react';
import { useTheme } from "@/components/providers/theme-provider";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Cpu from "lucide-react/dist/esm/icons/cpu";

const Footer = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <footer className={`relative w-full pt-16 pb-12 overflow-hidden transition-colors duration-300 ${isDark ? "bg-black bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-black via-[#0a0a0a] to-black" : "bg-white"}`}>
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
                            <span className={`text-2xl font-bold tracking-tight group-hover/logo:text-[#f2cc0d] transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>Catalance</span>
                        </a>
                        <p className={`text-lg font-medium leading-relaxed max-w-sm ${isDark ? "text-[#bab59c]" : "text-gray-600"}`}>
                            Orchestrating the future of work with premium enterprise talent solutions.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-4 mt-2">
                            {[
                                {
                                    icon: (props) => (
                                        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    ),
                                    color: "hover:text-[#1877F2]"
                                },
                                {
                                    icon: (props) => (
                                        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                                        </svg>
                                    ),
                                    color: "hover:text-[#0A66C2]"
                                },
                                {
                                    icon: (props) => (
                                        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                        </svg>
                                    ),
                                    color: "hover:text-[#E4405F]"
                                },
                                {
                                    icon: (props) => (
                                        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    ),
                                    color: "hover:text-[#FF0000]"
                                }
                            ].map((Social, index) => (
                                <a key={index} className={`group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(242,204,13,0.4)] hover:bg-[#f2cc0d] hover:text-[#181711] ${Social.color} ${isDark ? "bg-white/5 text-[#bab59c]" : "bg-black/5 text-gray-600"}`} href="#">
                                    <Social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns (Span 2 each -> 8 total) */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
                        {/* Platform */}
                        <div className="flex flex-col gap-4">
                            <h3 className={`font-bold text-sm uppercase tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}>Platform</h3>
                            <nav className="flex flex-col gap-3">
                                {["Browse Talent", "Enterprise Solutions", "Pricing"].map((link) => (
                                    <a key={link} className={`transition-colors text-sm font-medium hover:text-[#f2cc0d] ${isDark ? "text-slate-400" : "text-gray-600"}`} href="#">{link}</a>
                                ))}
                            </nav>
                        </div>
                        {/* Company */}
                        <div className="flex flex-col gap-4">
                            <h3 className={`font-bold text-sm uppercase tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}>Company</h3>
                            <nav className="flex flex-col gap-3">
                                <a className={`transition-colors text-sm font-medium hover:text-[#f2cc0d] ${isDark ? "text-slate-400" : "text-gray-600"}`} href="#">About Us</a>
                                <a className={`transition-colors text-sm font-medium flex items-center hover:text-[#f2cc0d] ${isDark ? "text-slate-400" : "text-gray-600"}`} href="#">
                                    Careers <span className="ml-1 text-[10px] bg-[#f2cc0d]/20 text-[#f2cc0d] px-1.5 py-0.5 rounded font-bold">Hiring</span>
                                </a>
                            </nav>
                        </div>
                        {/* Resources */}
                        <div className="flex flex-col gap-4">
                            <h3 className={`font-bold text-sm uppercase tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}>Resources</h3>
                            <nav className="flex flex-col gap-3">
                                {["Blog", "Help Center"].map((link) => (
                                    <a key={link} className={`transition-colors text-sm font-medium hover:text-[#f2cc0d] ${isDark ? "text-slate-400" : "text-gray-600"}`} href="#">{link}</a>
                                ))}
                            </nav>
                        </div>
                        {/* Legal */}
                        <div className="flex flex-col gap-4">
                            <h3 className={`font-bold text-sm uppercase tracking-wider ${isDark ? "text-white" : "text-gray-900"}`}>Legal</h3>
                            <nav className="flex flex-col gap-3">
                                {["Terms of Service", "Privacy Policy"].map((link) => (
                                    <a key={link} className={`transition-colors text-sm font-medium hover:text-[#f2cc0d] ${isDark ? "text-slate-400" : "text-gray-600"}`} href="#">{link}</a>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Newsletter Section */}
                <div className={`border-t pt-12 pb-12 mb-8 ${isDark ? "border-white/10" : "border-black/5"}`}>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex flex-col gap-2 max-w-md">
                            <h3 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Stay ahead of the curve</h3>
                            <p className={`text-sm ${isDark ? "text-[#bab59c]" : "text-gray-600"}`}>Get the latest insights on enterprise scaling and workforce management delivered to your inbox.</p>
                        </div>
                        <div className="w-full max-w-md">
                            <form className="relative group">
                                <input className={`w-full h-14 pl-6 pr-16 border-none rounded-2xl focus:ring-2 focus:ring-[#f2cc0d]/50 transition-all outline-none ${isDark ? "bg-neutral-900 text-white placeholder:text-neutral-500" : "bg-gray-100 text-gray-900 placeholder:text-gray-500"}`} placeholder="Enter your email address" type="email" />
                                <button className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center bg-[#f2cc0d] rounded-xl text-[#181711] hover:bg-[#ffe03d] transition-colors shadow-lg shadow-[#f2cc0d]/20" type="button">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-transparent">
                    <p className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-gray-500"}`}>© 2024 Catalance Inc. All rights reserved.</p>
                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-6">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-gray-600"}`}>All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
