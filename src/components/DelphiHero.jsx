import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { useTheme } from "./theme-provider";
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sparkles as SparklesIcon,
    Briefcase,
    Target,
    Users,
    ShieldCheck,
    Sparkles,
    ArrowRight,
    Zap,
    TrendingUp
} from 'lucide-react';

const DelphiHero = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    // Animation mount state
    const [isMounted, setIsMounted] = useState(false);

    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const contentRef = useRef(null);

    // Store refs for cleanup and animation
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const segmentsRef = useRef([]);
    const scrollPosRef = useRef(0);

    // Set mounted after initial render for animations
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- CONFIGURATION ---
    // Tuned to match the reference design's density and scale
    const TUNNEL_WIDTH = 24;
    const TUNNEL_HEIGHT = 16;
    const SEGMENT_DEPTH = 6; // Short depth for "square-ish" floor tiles
    const NUM_SEGMENTS = 14;
    const FOG_DENSITY = 0.02;

    // Grid Divisions
    const FLOOR_COLS = 6; // Number of columns on floor/ceiling
    const WALL_ROWS = 4;  // Number of rows on walls

    // Derived dimensions
    const COL_WIDTH = TUNNEL_WIDTH / FLOOR_COLS;
    const ROW_HEIGHT = TUNNEL_HEIGHT / WALL_ROWS;

    // Unsplash images - Mix of portraits, landscapes, and abstracts
    const imageUrls = [
        "https://plus.unsplash.com/premium_photo-1720287601920-ee8c503af775?q=80&w=600&fit=crop", // Portrait
        "https://plus.unsplash.com/premium_photo-1719839720683-72c8eb65b10a?q=80&w=600&fit=crop", // Portrait
        "https://plus.unsplash.com/premium_photo-1721080251127-76315300cc5c?q=80&w=600&fit=crop", // People
        "https://plus.unsplash.com/premium_photo-1743827754663-4bfa8fd7fb3c?q=80&w=600&fit=crop", // Portrait
        "https://plus.unsplash.com/premium_photo-1661675440353-6a6019c95bc7?q=80&w=600&fit=crop", // Portrait
        "https://plus.unsplash.com/premium_photo-1710500924455-5107300bdff3?q=80&w=600&fit=crop", // Portrait
        "https://plus.unsplash.com/premium_photo-1668004508880-8f81d9552dce?q=80&w=600&fit=crop", // People
        "https://plus.unsplash.com/premium_photo-1685283298465-e52e933a3312?q=80&w=600&fit=crop", // Abstract/Dark
        "https://plus.unsplash.com/premium_photo-1683977922495-3ab3ce7ba4e6?q=80&w=600&fit=crop", // Tech
        "https://plus.unsplash.com/premium_photo-1661677875843-5c66d889cfe9?q=80&w=600&fit=crop", // Portrait
        "https://images.unsplash.com/photo-1690191848328-7410cdf9962b?q=80&w=600&fit=crop", // Abstract
        "https://plus.unsplash.com/premium_photo-1661284873147-ed893ed67d03?q=80&w=600&fit=crop", // Abstract
        "https://plus.unsplash.com/premium_photo-1683141123111-c445910abc29?q=80&w=600&fit=crop", // Portrait
        "https://images.unsplash.com/photo-1504691342899-4d92b50853e1?q=80&w=600&fit=crop", // Portrait

        "https://plus.unsplash.com/premium_photo-1664297701028-3e9919a2574f?q=80&w=600&fit=crop", // Portrait

        "https://plus.unsplash.com/premium_photo-1733306696471-807493ff845b?q=80&w=600&fit=crop", // Portrait

        "https://images.unsplash.com/photo-1694903089438-bf28d4697d9a?q=80&w=600&fit=crop", // Portrait

        "https://plus.unsplash.com/premium_photo-1679814561282-2f735b0ce81f?q=80&w=600&fit=crop", // Portrait

        "https://plus.unsplash.com/premium_photo-1718641527614-8edd0ca13235?q=80&w=600&fit=crop", // Portrait


    ];

    // Helper: Create a segment with grid lines and filled cells
    const createSegment = (zPos) => {
        const group = new THREE.Group();
        group.position.z = zPos;

        const w = TUNNEL_WIDTH / 2;
        const h = TUNNEL_HEIGHT / 2;
        const d = SEGMENT_DEPTH;

        // --- 1. Grid Lines ---
        // Start with default light mode colors; these will be updated by useEffect immediately on mount
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb0b0b0, transparent: true, opacity: 0.5 });
        const lineGeo = new THREE.BufferGeometry();
        const vertices = [];

        // A. Longitudinal Lines (Z-axis)
        // Floor & Ceiling (varying X)
        for (let i = 0; i <= FLOOR_COLS; i++) {
            const x = -w + (i * COL_WIDTH);
            // Floor line
            vertices.push(x, -h, 0, x, -h, -d);
            // Ceiling line
            vertices.push(x, h, 0, x, h, -d);
        }
        // Walls (varying Y) - excluding top/bottom corners already drawn
        for (let i = 1; i < WALL_ROWS; i++) {
            const y = -h + (i * ROW_HEIGHT);
            // Left Wall line
            vertices.push(-w, y, 0, -w, y, -d);
            // Right Wall line
            vertices.push(w, y, 0, w, y, -d);
        }

        // B. Latitudinal Lines (Ring at z=0)
        // Floor (Bottom edge)
        vertices.push(-w, -h, 0, w, -h, 0);
        // Ceiling (Top edge)
        vertices.push(-w, h, 0, w, h, 0);
        // Left Wall (Left edge)
        vertices.push(-w, -h, 0, -w, h, 0);
        // Right Wall (Right edge)
        vertices.push(w, -h, 0, w, h, 0);

        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const lines = new THREE.LineSegments(lineGeo, lineMaterial);
        group.add(lines);

        // Initial population of images
        populateImages(group, w, h, d);

        return group;
    };

    // Helper: Populate images in a segment
    const populateImages = (group, w, h, d) => {
        const textureLoader = new THREE.TextureLoader();
        const cellMargin = 0.4;

        const addImg = (pos, rot, wd, ht) => {
            const url = imageUrls[Math.floor(Math.random() * imageUrls.length)];
            const geom = new THREE.PlaneGeometry(wd - cellMargin, ht - cellMargin);
            const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
            textureLoader.load(url, (tex) => {
                tex.minFilter = THREE.LinearFilter;
                mat.map = tex;
                mat.needsUpdate = true;
                gsap.to(mat, { opacity: 0.85, duration: 1 });
            });
            const m = new THREE.Mesh(geom, mat);
            m.position.copy(pos);
            m.rotation.copy(rot);
            m.name = "slab_image";
            group.add(m);
        };

        // Logic: Iterate slots, but skip if the previous slot was filled.
        // Threshold adjusted to 0.80 (20%) to compensate for skipped slots and maintain density.

        // Floor
        let lastFloorIdx = -999;
        for (let i = 0; i < FLOOR_COLS; i++) {
            // Must be at least 2 slots away from last image to avoid adjacency (i > last + 1)
            if (i > lastFloorIdx + 1) {
                if (Math.random() > 0.80) {
                    addImg(new THREE.Vector3(-w + i * COL_WIDTH + COL_WIDTH / 2, -h, -d / 2), new THREE.Euler(-Math.PI / 2, 0, 0), COL_WIDTH, d);
                    lastFloorIdx = i;
                }
            }
        }

        // Ceiling
        let lastCeilIdx = -999;
        for (let i = 0; i < FLOOR_COLS; i++) {
            if (i > lastCeilIdx + 1) {
                if (Math.random() > 0.88) { // Keep ceiling sparser
                    addImg(new THREE.Vector3(-w + i * COL_WIDTH + COL_WIDTH / 2, h, -d / 2), new THREE.Euler(Math.PI / 2, 0, 0), COL_WIDTH, d);
                    lastCeilIdx = i;
                }
            }
        }

        // Left Wall
        let lastLeftIdx = -999;
        for (let i = 0; i < WALL_ROWS; i++) {
            if (i > lastLeftIdx + 1) {
                if (Math.random() > 0.80) {
                    addImg(new THREE.Vector3(-w, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2), new THREE.Euler(0, Math.PI / 2, 0), d, ROW_HEIGHT);
                    lastLeftIdx = i;
                }
            }
        }

        // Right Wall
        let lastRightIdx = -999;
        for (let i = 0; i < WALL_ROWS; i++) {
            if (i > lastRightIdx + 1) {
                if (Math.random() > 0.80) {
                    addImg(new THREE.Vector3(w, -h + i * ROW_HEIGHT + ROW_HEIGHT / 2, -d / 2), new THREE.Euler(0, -Math.PI / 2, 0), d, ROW_HEIGHT);
                    lastRightIdx = i;
                }
            }
        }
    }

    // --- INITIAL SETUP ---
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // THREE JS SETUP
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
        camera.position.set(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        // Generate segments
        const segments = [];
        for (let i = 0; i < NUM_SEGMENTS; i++) {
            const z = -i * SEGMENT_DEPTH;
            const segment = createSegment(z);
            scene.add(segment);
            segments.push(segment);
        }
        segmentsRef.current = segments;

        // Animation Loop
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;

            const targetZ = -scrollPosRef.current * 0.05;
            const currentZ = cameraRef.current.position.z;
            cameraRef.current.position.z += (targetZ - currentZ) * 0.1;

            // Bidirectional Infinite Logic
            const tunnelLength = NUM_SEGMENTS * SEGMENT_DEPTH;

            const camZ = cameraRef.current.position.z;

            segmentsRef.current.forEach((segment) => {
                // 1. Moving Forward
                if (segment.position.z > camZ + SEGMENT_DEPTH) {
                    let minZ = 0;
                    segmentsRef.current.forEach(s => minZ = Math.min(minZ, s.position.z));
                    segment.position.z = minZ - SEGMENT_DEPTH;

                    // Re-populate
                    const toRemove = [];
                    segment.traverse((c) => { if (c.name === 'slab_image') toRemove.push(c); });
                    toRemove.forEach(c => {
                        segment.remove(c);
                        if (c instanceof THREE.Mesh) {
                            c.geometry.dispose();
                            if (c.material.map) c.material.map.dispose();
                            c.material.dispose();
                        }
                    });
                    const w = TUNNEL_WIDTH / 2; const h = TUNNEL_HEIGHT / 2; const d = SEGMENT_DEPTH;
                    populateImages(segment, w, h, d);
                }

                // 2. Moving Backward
                if (segment.position.z < camZ - tunnelLength - SEGMENT_DEPTH) {
                    let maxZ = -999999;
                    segmentsRef.current.forEach(s => maxZ = Math.max(maxZ, s.position.z));
                    segment.position.z = maxZ + SEGMENT_DEPTH;

                    // Re-populate
                    const toRemove = [];
                    segment.traverse((c) => { if (c.name === 'slab_image') toRemove.push(c); });
                    toRemove.forEach(c => {
                        segment.remove(c);
                        if (c instanceof THREE.Mesh) {
                            c.geometry.dispose();
                            if (c.material.map) c.material.map.dispose();
                            c.material.dispose();
                        }
                    });
                    const w = TUNNEL_WIDTH / 2; const h = TUNNEL_HEIGHT / 2; const d = SEGMENT_DEPTH;
                    populateImages(segment, w, h, d);
                }
            });

            rendererRef.current.render(sceneRef.current, cameraRef.current);
        };
        animate();

        const onScroll = () => { scrollPosRef.current = window.scrollY; };
        window.addEventListener('scroll', onScroll);
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
            renderer.dispose();
        };
    }, []); // Run once on mount

    // --- THEME UPDATE EFFECT ---
    useEffect(() => {
        if (!sceneRef.current) return;

        // Define theme colors
        const bgHex = isDarkMode ? 0x050505 : 0xffffff;
        const fogHex = isDarkMode ? 0x050505 : 0xffffff;

        // Light mode: Light Grey lines (0xb0b0b0), higher opacity
        // Dark mode: Medium Grey lines (0x555555) for visibility, slightly adjusted opacity
        const lineHex = isDarkMode ? 0x555555 : 0xb0b0b0;
        const lineOp = isDarkMode ? 0.35 : 0.5;

        // Apply to scene
        sceneRef.current.background = new THREE.Color(bgHex);
        if (sceneRef.current.fog) {
            sceneRef.current.fog.color.setHex(fogHex);
        }

        // Apply to existing grid lines
        segmentsRef.current.forEach(segment => {
            segment.children.forEach(child => {
                if (child instanceof THREE.LineSegments) {
                    const mat = child.material;
                    mat.color.setHex(lineHex);
                    mat.opacity = lineOp;
                    mat.needsUpdate = true;
                }
            });
        });
    }, [isDarkMode]);

    // Text Entrance Animation
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out", delay: 0.5 }
            );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-[500vh] transition-colors duration-700 bg-white dark:bg-[#050505]">
            <div className="sticky top-0 w-full h-screen overflow-hidden">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 text-center">

                    {/* Badge */}
                    <div className={`flex justify-center mb-4 mt-16 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <Badge className="group [&>svg]:size-6 [&>svg]:pointer-events-auto bg-white/30 hover:bg-white/50 text-gray-900 border-gray-200/50 backdrop-blur-sm dark:bg-black/30 dark:hover:bg-black/50 dark:text-white dark:border-white/20 dark:backdrop-blur-md border px-6 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer">
                            <SparklesIcon size={24} className="text-primary" />
                            Trusted by <span className="text-primary font-semibold">10,000+</span> Freelancers & Clients
                        </Badge>
                    </div>

                    {/* Headlines */}
                    <div className={` ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                        <h1
                            className="font-medium tracking-tight leading-tight whitespace-nowrap mb-4 text-zinc-900 dark:text-white"
                            style={{ fontSize: 'clamp(1.5rem, 4vw, 4rem)' }}
                        >
                            Connecting <span className="text-primary">Ideas</span> with The Right <span className="text-primary">Experts</span>.
                        </h1>
                    </div>

                    {/* Subhead */}
                    <p
                        className={`text-lg md:text-xl lg:text-2xl text-zinc-500 dark:text-gray-400 mx-auto mb-6 font-light leading-relaxed whitespace-nowrap ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '200ms' }}
                    >
                        A platform that helps projects move from brief to delivery with clarity and control.
                    </p>

                    {/* Cards Container */}
                    <div
                        className={`relative max-w-3xl mx-auto mb-16 px-4 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '300ms' }}
                    >
                        <div className="grid md:grid-cols-2 gap-15 relative">
                            {/* OR Circle */}
                            <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                <div className="relative w-22 h-22 rounded-full border-2 flex items-center justify-center pointer-events-auto bg-white/30 backdrop-blur-sm border-primary/50 dark:bg-black/50 dark:backdrop-blur-xl shadow-[0_0_20px_var(--color-primary)]">
                                    <span className="text-foreground font-medium text-2xl tracking-wider">OR</span>
                                    <div className="absolute inset-0 rounded-full bg-linear-to-r from-primary/10 via-primary/20 to-primary/10 dark:from-primary/20 dark:via-primary/40 dark:to-primary/20 blur-xl animate-pulse -z-10" />
                                </div>
                            </div>

                            {/* Business Card */}
                            <div className="group relative p-6 rounded-3xl flex flex-col text-left min-h-[450px] border bg-white/10 backdrop-blur-sm border-gray-200/50 dark:bg-black/40 dark:border-white/10 dark:backdrop-blur-xl">
                                <div className="mb-6 flex flex-col items-start">
                                    <div className="px-0 py-2">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium uppercase tracking-wide text-primary">
                                        For Businesses
                                    </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-2 leading-tight">
                                    Hire Elite Talent
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed min-h-[40px]">
                                    Access our curated network of{" "}
                                    <span className="text-primary dark:text-primary font-semibold">world-class professionals</span>{" "}
                                    ready to transform your vision into reality.
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-8">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Verified expertise</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">50K+ professionals</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Secure payments</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Dedicated support</span>
                                    </div>
                                </div>
                                <Link to="/service" className="w-full mt-auto">
                                    <Button
                                        size="lg"
                                        className="w-full group/btn bg-transparent hover:bg-primary text-primary hover:text-primary-foreground border border-primary/50 hover:border-primary font-semibold px-6 py-6 text-base shadow-none hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        Explore Talent
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </Link>
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-orange-500/0 to-amber-500/0 -z-10 blur-xl" />
                            </div>

                            {/* Freelancer Card */}
                            <div className="group relative p-6 rounded-3xl flex flex-col text-left min-h-[450px] border bg-white/10 backdrop-blur-sm border-gray-200/50 dark:bg-black/40 dark:border-white/10 dark:backdrop-blur-xl">
                                <div className="mb-6 flex flex-col items-start">
                                    <div className="px-0 py-2">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium uppercase tracking-wide text-primary">
                                        For Freelancers
                                    </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-2 leading-tight whitespace-nowrap">
                                    Launch Careers
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed min-h-[72px]">
                                    Join an exclusive community and connect with{" "}
                                    <span className="text-primary-strong dark:text-primary font-semibold">premium opportunities</span>{" "}
                                    that match your ambitions.
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-8">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Zero commission</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Global network</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Secure payments</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Fast hiring</span>
                                    </div>
                                </div>
                                <Link to="/freelancer/onboarding" className="w-full mt-auto">
                                    <Button
                                        size="lg"
                                        className="w-full group/btn bg-transparent hover:bg-primary text-primary hover:text-primary-foreground border border-primary/50 hover:border-primary font-semibold px-6 py-6 text-base shadow-none hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        Start Your Career
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </Link>
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/0 to-primary/0 -z-10 blur-xl" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DelphiHero;
