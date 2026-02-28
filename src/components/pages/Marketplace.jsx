import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, User, Image as ImageIcon, X, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const useDebounce = (val, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(val);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(val);
        }, delay);
        return () => clearTimeout(handler);
    }, [val, delay]);
    return debouncedValue;
};

// Generate deterministic beautiful gradients for missing images based on strings
const getCategoryGradient = (category) => {
    const gradients = [
        "from-emerald-500/20 to-teal-900/40",
        "from-blue-500/20 to-indigo-900/40",
        "from-purple-500/20 to-violet-900/40",
        "from-rose-500/20 to-red-900/40",
        "from-amber-500/20 to-orange-900/40",
        "from-cyan-500/20 to-blue-900/40"
    ];
    if (!category) return gradients[0];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
};

const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const Marketplace = () => {
    const [q, setQ] = useState("");
    const debouncedQ = useDebounce(q, 500);

    const [category, setCategory] = useState("all");
    const [minBudget, setMinBudget] = useState("");
    const [maxBudget, setMaxBudget] = useState("");
    const debouncedMinBudget = useDebounce(minBudget, 500);
    const debouncedMaxBudget = useDebounce(maxBudget, 500);

    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    const categories = [
        { label: "All Categories", value: "all" },
        { label: "Web Development", value: "web_development" },
        { label: "App Development", value: "app_development" },
        { label: "AI Automation", value: "ai_automation" },
        { label: "Branding", value: "branding" },
        { label: "SEO", value: "seo" },
        { label: "Lead Generation", value: "lead_generation" },
        { label: "Video Editing", value: "video_editing" },
        { label: "Performance Marketing", value: "performance_marketing" },
        { label: "Email Marketing", value: "email_marketing" },
        { label: "SMM", value: "smm" },
        { label: "UGC Marketing", value: "ugc_marketing" },
        { label: "CRM & ERP", value: "crm_erp" },
        { label: "Voice Agent", value: "voice_agent" },
        { label: "Customer Support", value: "customer_support" },
        { label: "Public Relations", value: "public_relations" }
    ];

    const fetchResults = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                q: debouncedQ,
                sort,
                page: page.toString(),
                limit: "15"
            });
            if (category !== "all") query.append("category", category);
            if (debouncedMinBudget) query.append("minBudget", debouncedMinBudget);
            if (debouncedMaxBudget) query.append("maxBudget", debouncedMaxBudget);

            const res = await fetch(`/api/marketplace?${query.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            if (json) {
                setData(json.data || []);
                setTotal(json.total || 0);
                setTotalPages(json.totalPages || 0);
            }
        } catch (err) {
            console.error(err);
            setData([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [debouncedQ, category, debouncedMinBudget, debouncedMaxBudget, sort, page]);

    // Reset page to 1 when filters change natively
    useEffect(() => {
        setPage(1);
    }, [debouncedQ, category, debouncedMinBudget, debouncedMaxBudget, sort]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    // Container variants for staggered entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] pt-24 min-h-screen flex flex-col">

            {/* Hero Header */}
            <div className="mb-6 space-y-1.5">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Marketplace</h1>
                <p className="text-base text-muted-foreground max-w-2xl">Browse premium services from verified freelancers and instantly accelerate your business.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 flex-1 relative z-10">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-[280px] flex-shrink-0 relative z-20">
                    <Card className="sticky top-24 p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow bg-card/50 backdrop-blur-md border border-gray-200/60 dark:border-border/50 rounded-2xl space-y-6">
                        <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                            <h2 className="text-lg font-semibold tracking-tight">Filters</h2>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full bg-background/50 border-input hover:bg-accent/50 transition-colors">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Budget Range (₹)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full bg-background/50 focus-visible:ring-primary/30"
                                    value={minBudget}
                                    onChange={(e) => setMinBudget(e.target.value)}
                                />
                                <span className="text-muted-foreground/50">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    className="w-full bg-background/50 focus-visible:ring-primary/30"
                                    value={maxBudget}
                                    onChange={(e) => setMaxBudget(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Search Bar Row */}
                    <div className="relative w-full mb-4 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                        <Input
                            type="text"
                            placeholder="Search services or freelancers..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full bg-background/50 backdrop-blur-sm rounded-2xl pl-10 pr-10 py-5 transition-all focus-visible:ring-primary/40 focus-visible:border-primary/50 shadow-sm border border-gray-200/60 dark:border-border/50 hover:shadow-md hover:border-foreground/30"
                        />
                        {q && (
                            <button
                                onClick={() => setQ("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Quick Filter Chips (Optional visual flair) */}
                    <div className="flex flex-wrap gap-2 mb-6 hidden sm:flex relative z-20">
                        <Badge
                            variant="secondary"
                            className={cn("cursor-pointer rounded-full transition-colors hover:bg-primary/20", sort === "newest" && category === "all" ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-secondary/50 border border-gray-200/60 dark:border-border/50 shadow-sm")}
                            onClick={() => { setSort('newest'); setCategory('all'); }}
                        >
                            All Services
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={cn("cursor-pointer rounded-full transition-colors hover:bg-primary/20", category === "web_development" ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-secondary/50 border border-gray-200/60 dark:border-border/50 shadow-sm")}
                            onClick={() => setCategory('web_development')}
                        >
                            Web Development
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={cn("cursor-pointer rounded-full transition-colors hover:bg-primary/20", category === "ai_automation" ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-secondary/50 border border-gray-200/60 dark:border-border/50 shadow-sm")}
                            onClick={() => setCategory('ai_automation')}
                        >
                            AI Automation
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={cn("cursor-pointer rounded-full transition-colors hover:bg-primary/20", sort === "price_asc" ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-secondary/50 border border-gray-200/60 dark:border-border/50 shadow-sm")}
                            onClick={() => setSort('price_asc')}
                        >
                            Most Affordable
                        </Badge>
                    </div>

                    {/* Results & Sort Row */}
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/50">
                        <span className="text-sm font-medium text-muted-foreground/80">
                            {total} {total === 1 ? 'Result' : 'Results'}
                        </span>
                        <div className="w-[180px]">
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="w-full bg-background/50 rounded-full border border-gray-200/60 dark:border-border/50 shadow-sm hover:shadow-md transition-colors">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-lg border-gray-200/60 dark:border-border/50">
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>



                    {/* Grid */}
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i} className="flex flex-col overflow-hidden border border-gray-200/60 dark:border-border/50 bg-card/20 shadow-none rounded-2xl">
                                        <Skeleton className="w-full h-40 rounded-none opacity-50" />
                                        <CardContent className="p-5 space-y-4 flex-1">
                                            <Skeleton className="h-4 w-3/4 opacity-50" />
                                            <Skeleton className="h-3 w-1/2 opacity-30" />
                                            <div className="pt-4 mt-auto border-t border-border/30">
                                                <Skeleton className="h-4 w-1/3 opacity-50" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </motion.div>
                        ) : data.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-32 bg-card/20 rounded-2xl border border-border/50 border-dashed m-auto w-full"
                            >
                                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-inner">
                                    <Search className="w-8 h-8 text-muted-foreground/60" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">No matches found</h3>
                                <p className="text-muted-foreground mt-2 text-center max-w-sm text-sm">
                                    We couldn't find any services matching your combined criteria. Try clearing some filters.
                                </p>
                                <Button variant="outline" className="mt-6 rounded-full" onClick={() => { setQ(""); setCategory("all"); setMinBudget(""); setMaxBudget(""); }}>
                                    Clear all filters
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {data.map((item) => {
                                    const rawPrice = item.serviceDetails?.minBudget || item.serviceDetails?.price;
                                    const rawRange = item.serviceDetails?.averageProjectPriceRange || item.serviceDetails?.priceRange;

                                    let priceDisplay = "Consult for price";
                                    if (rawPrice) {
                                        priceDisplay = `Rs. ${rawPrice.toLocaleString('en-IN')}`;
                                    } else if (rawRange) {
                                        const match = String(rawRange).match(/inr\s*([\d\.]+\s*(lakhs?|k|thousands?)?)/i);
                                        if (match) {
                                            priceDisplay = `Rs. ${match[1].replace(/s$/, '')}`; // "1 Lakhs" -> "1 Lakh"
                                        } else {
                                            priceDisplay = String(rawRange).replace(/inr /i, 'Rs. ');
                                        }
                                    }

                                    const image = item.serviceDetails?.coverImage || item.serviceDetails?.image || null;
                                    const authorName = item.freelancer?.fullName || "Anonymous";
                                    const categoryLabel = formatCategory(item.serviceKey);
                                    const placeholderGradient = getCategoryGradient(item.serviceKey || item.id);

                                    return (
                                        <motion.div variants={itemVariants} key={item.id} className="h-full">
                                            <Card className="group h-full cursor-pointer flex flex-col border border-gray-200/60 dark:border-border/40 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 overflow-hidden rounded-2xl">
                                                {/* Image Box */}
                                                <div className="w-full h-40 relative shrink-0 overflow-hidden bg-muted">
                                                    {image ? (
                                                        <>
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60"></div>
                                                            <img src={image} alt={item.service} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60"></div>
                                                            <img
                                                                src={[
                                                                    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
                                                                    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop"
                                                                ][Math.abs(item.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)) % 12]}
                                                                alt={item.service}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out fallback-img"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextElementSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                            <div className={cn("hidden w-full h-full flex-col items-center justify-center bg-gradient-to-br absolute inset-0 z-0", placeholderGradient)}>
                                                                <ImageIcon className="w-10 h-10 text-white/30 mb-2 drop-shadow-md" />
                                                                <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold drop-shadow-sm">No Preview</span>
                                                            </div>
                                                        </>
                                                    )}

                                                    {categoryLabel && (
                                                        <Badge variant="secondary" className="absolute top-3 left-3 z-20 bg-background/90 text-foreground backdrop-blur-md shadow-sm border-white/10 font-medium px-2.5 py-0.5">
                                                            {categoryLabel}
                                                        </Badge>
                                                    )}

                                                    {item.isFeatured && (
                                                        <Badge className="absolute top-3 right-3 z-20 bg-emerald-500 text-white backdrop-blur-md shadow-sm border-none flex items-center gap-1 font-semibold">
                                                            <Sparkles className="w-3 h-3" /> Featured
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Content Area */}
                                                <CardContent className="p-5 flex flex-col flex-1 justify-between">
                                                    <div className="space-y-3.5">
                                                        <div className="flex items-center gap-3">
                                                            {item.freelancer?.avatar ? (
                                                                <img src={item.freelancer.avatar} alt={authorName} className="w-7 h-7 rounded-full object-cover ring-2 ring-background shadow-xs" />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center ring-2 ring-background shadow-xs">
                                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1 font-bold text-base text-foreground group-hover:text-primary transition-colors">
                                                                <span className="truncate">{authorName}</span>
                                                                {item.freelancer?.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                                            </div>
                                                        </div>
                                                        <h3 className="font-medium text-muted-foreground text-sm line-clamp-2 leading-snug transition-colors">
                                                            {item.service || "Untitled Service"}
                                                        </h3>

                                                        {item.bio && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                {item.bio}
                                                            </p>
                                                        )}

                                                        {item.techStack && item.techStack.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                                {item.techStack.slice(0, 3).map((tech, i) => (
                                                                    <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 bg-muted/30 text-muted-foreground border-gray-200/60 dark:border-border/60 font-medium">
                                                                        {tech}
                                                                    </Badge>
                                                                ))}
                                                                {item.techStack.length > 3 && (
                                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/30 text-muted-foreground border-gray-200/60 dark:border-border/60 font-medium">
                                                                        +{item.techStack.length - 3}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between group/btn">
                                                        <div>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block mb-1">Starts From</span>
                                                            <span className="text-foreground font-extrabold text-[15px] tracking-tight">{priceDisplay}</span>
                                                        </div>
                                                        <Button variant="outline" size="sm" className="h-8 shadow-sm text-xs font-semibold rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30">
                                                            View
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between pt-10 pb-6 border-t border-border/30 mt-8 gap-4">
                            <span className="text-sm text-muted-foreground order-2 sm:order-1 font-medium">
                                Page {page} of {totalPages}
                            </span>

                            <div className="flex items-center gap-1.5 order-1 sm:order-2 bg-card/30 p-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-full w-9 h-9 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const p = i + 1;
                                        if (totalPages > 5 && (p < page - 1 || p > page + 1) && p !== 1 && p !== totalPages) {
                                            if (p === page - 2 || p === page + 2) return <span key={p} className="px-1 text-muted-foreground flex items-center text-xs">•••</span>;
                                            return null;
                                        }
                                        return (
                                            <Button
                                                key={p}
                                                variant={page === p ? "default" : "ghost"}
                                                size="icon"
                                                onClick={() => setPage(p)}
                                                className={cn("w-9 h-9 rounded-full transition-all text-sm font-semibold", page === p && "shadow-sm")}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="rounded-full w-9 h-9 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Marketplace;
