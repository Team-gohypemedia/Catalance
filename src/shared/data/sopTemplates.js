export const SOP_TEMPLATES = {
  WEBSITE: {
    phases: [
      { id: "1", name: "Discovery & Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Design & Development", status: "pending", progress: 0 },
      { id: "3", name: "Content, Testing & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Launch & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Discovery & Planning
      { id: "1", title: "Collect business requirements and project goals", phase: "1", status: "pending" },
      { id: "2", title: "Identify target audience and user journey", phase: "1", status: "pending" },
      { id: "3", title: "Create website sitemap and page structure", phase: "1", status: "pending" },
      { id: "4", title: "Collect design inspirations and reference websites", phase: "1", status: "pending" },
      { id: "5", title: "Finalize project scope, features, and timeline", phase: "1", status: "pending" },
      // Phase 2 - Design & Development
      { id: "6", title: "Create wireframes and UI/UX mockups", phase: "2", status: "pending" },
      { id: "7", title: "Finalize branding, typography, and color palette", phase: "2", status: "pending" },
      { id: "8", title: "Set up hosting, domain, SSL, and development environment", phase: "2", status: "pending" },
      { id: "9", title: "Develop responsive frontend pages", phase: "2", status: "pending" },
      { id: "10", title: "Configure backend, database, and CMS/framework", phase: "2", status: "pending" },
      { id: "11", title: "Implement forms, APIs, payment gateways, and integrations", phase: "2", status: "pending" },
      // Phase 3 - Content, Testing & Optimization
      { id: "12", title: "Upload website content, images, and media assets", phase: "3", status: "pending" },
      { id: "13", title: "Implement on-page SEO elements", phase: "3", status: "pending" },
      { id: "14", title: "Perform functionality testing and bug fixing", phase: "3", status: "pending" },
      { id: "15", title: "Test mobile responsiveness and cross-browser compatibility", phase: "3", status: "pending" },
      { id: "16", title: "Optimize website speed and performance", phase: "3", status: "pending" },
      // Phase 4 - Launch & Handover
      { id: "17", title: "Share staging website for client review and approval", phase: "4", status: "pending" },
      { id: "18", title: "Deploy website to the live server", phase: "4", status: "pending" },
      { id: "19", title: "Configure analytics, tracking, and webmaster tools", phase: "4", status: "pending" },
      { id: "20", title: "Provide admin access, credentials, and documentation", phase: "4", status: "pending" },
      { id: "21", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  APP: {
    phases: [
      { id: "1", name: "Discovery & Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "UI/UX Design & Development", status: "pending", progress: 0 },
      { id: "3", name: "Testing & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Discovery & Planning
      { id: "a1", title: "Understand business goals and app requirements", phase: "1", status: "pending" },
      { id: "a2", title: "Define target audience and user journeys", phase: "1", status: "pending" },
      { id: "a3", title: "Prepare feature list and functional requirements", phase: "1", status: "pending" },
      { id: "a4", title: "Finalize platform requirements (iOS, Android, Web)", phase: "1", status: "pending" },
      { id: "a5", title: "Create project roadmap, milestones, and timeline", phase: "1", status: "pending" },
      // Phase 2 - UI/UX Design & Development
      { id: "a6", title: "Create wireframes and user flow diagrams", phase: "2", status: "pending" },
      { id: "a7", title: "Design UI screens and interactive prototypes", phase: "2", status: "pending" },
      { id: "a8", title: "Set up project architecture and development environment", phase: "2", status: "pending" },
      { id: "a9", title: "Develop frontend application screens", phase: "2", status: "pending" },
      { id: "a10", title: "Develop backend APIs, database, and business logic", phase: "2", status: "pending" },
      { id: "a11", title: "Integrate authentication, payments, notifications, and APIs", phase: "2", status: "pending" },
      { id: "a12", title: "Implement admin panel and analytics features", phase: "2", status: "pending" },
      // Phase 3 - Testing & Optimization
      { id: "a13", title: "Perform functional testing and bug fixing", phase: "3", status: "pending" },
      { id: "a14", title: "Test app performance and optimize loading speed", phase: "3", status: "pending" },
      { id: "a15", title: "Perform security testing and validation", phase: "3", status: "pending" },
      { id: "a16", title: "Test app compatibility across devices and operating systems", phase: "3", status: "pending" },
      { id: "a17", title: "Share beta version for client review and approval", phase: "3", status: "pending" },
      // Phase 4 - Deployment & Handover
      { id: "a18", title: "Prepare app store assets and metadata", phase: "4", status: "pending" },
      { id: "a19", title: "Deploy application to App Store and Google Play Store", phase: "4", status: "pending" },
      { id: "a20", title: "Configure analytics, crash reporting, and monitoring", phase: "4", status: "pending" },
      { id: "a21", title: "Provide source code, credentials, and documentation", phase: "4", status: "pending" },
      { id: "a22", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  SOFTWARE: {
    phases: [
      { id: "1", name: "Requirement & Reference Lock ( Phase-1 )", status: "in-progress", progress: 0 },
      { id: "2", name: "System Direction Setup ( Phase-2 )", status: "pending", progress: 0 },
      { id: "3", name: "Full Development & Completion ( Phase-3 )", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Handover ( Phase-4 )", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "s1", title: "Understand business workflow", phase: "1", status: "pending" },
      { id: "s2", title: "Finalize modules and features", phase: "1", status: "pending" },
      { id: "s3", title: "Define user roles", phase: "1", status: "pending" },
      { id: "s4", title: "Lock scope and timeline", phase: "1", status: "pending" },
      { id: "s5", title: "Share requirement doc / workflow sheet / demo link", phase: "1", status: "pending" },
      // Stage 2
      { id: "s6", title: "Setup basic architecture", phase: "2", status: "pending" },
      { id: "s7", title: "Design database structure", phase: "2", status: "pending" },
      { id: "s8", title: "Build sample module or demo", phase: "2", status: "pending" },
      { id: "s9", title: "Confirm technical direction", phase: "2", status: "pending" },
      // Stage 3
      { id: "s10", title: "Develop all modules", phase: "3", status: "pending" },
      { id: "s11", title: "Integrate features", phase: "3", status: "pending" },
      { id: "s12", title: "Setup role-based access", phase: "3", status: "pending" },
      { id: "s13", title: "Fix functional issues", phase: "3", status: "pending" },
      // Stage 4
      { id: "s14", title: "Deploy to production", phase: "4", status: "pending" },
      { id: "s15", title: "Share system access", phase: "4", status: "pending" },
      { id: "s16", title: "Share basic documentation", phase: "4", status: "pending" },
      { id: "s17", title: "Close work", phase: "4", status: "pending" }
    ]
  },
  SEO: {
    phases: [
      { id: "1", name: "Research & Strategy", status: "in-progress", progress: 0 },
      { id: "2", name: "Implementation & Optimization", status: "pending", progress: 0 },
      { id: "3", name: "Content & Authority Building", status: "pending", progress: 0 },
      { id: "4", name: "Monitoring & Reporting", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Research & Strategy
      { id: "seo1", title: "Analyze client business, competitors, and target audience", phase: "1", status: "pending" },
      { id: "seo2", title: "Perform keyword research and finalize target keywords", phase: "1", status: "pending" },
      { id: "seo3", title: "Conduct website/GMB audit and identify opportunities", phase: "1", status: "pending" },
      { id: "seo4", title: "Create SEO/GMB strategy and roadmap", phase: "1", status: "pending" },
      // Phase 2 - Implementation & Optimization
      { id: "seo5", title: "Optimize website pages or Google Business Profile", phase: "2", status: "pending" },
      { id: "seo6", title: "Implement technical SEO fixes", phase: "2", status: "pending" },
      { id: "seo7", title: "Optimize titles, meta descriptions, headings, and schema", phase: "2", status: "pending" },
      { id: "seo8", title: "Set up analytics and search console tracking", phase: "2", status: "pending" },
      // Phase 3 - Content & Authority Building
      { id: "seo9", title: "Create and publish SEO content/blogs", phase: "3", status: "pending" },
      { id: "seo10", title: "Build backlinks and local citations", phase: "3", status: "pending" },
      { id: "seo11", title: "Publish Google Business Profile posts and updates", phase: "3", status: "pending" },
      { id: "seo12", title: "Manage reviews and local engagement", phase: "3", status: "pending" },
      // Phase 4 - Monitoring & Reporting
      { id: "seo13", title: "Track keyword rankings and traffic performance", phase: "4", status: "pending" },
      { id: "seo14", title: "Generate monthly SEO/GMB reports", phase: "4", status: "pending" },
      { id: "seo15", title: "Review performance and optimize strategy", phase: "4", status: "pending" },
      { id: "seo16", title: "Present recommendations for the next cycle", phase: "4", status: "pending" }
    ]
  },
  PERFORMANCE_MARKETING: {
    phases: [
      { id: "1", name: "Strategy & Campaign Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Campaign Setup & Asset Preparation", status: "pending", progress: 0 },
      { id: "3", name: "Launch & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Scaling", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Strategy & Campaign Planning
      { id: "pm1", title: "Understand business goals, target audience, and campaign objectives", phase: "1", status: "pending" },
      { id: "pm2", title: "Research competitors, market trends, and advertising opportunities", phase: "1", status: "pending" },
      { id: "pm3", title: "Define campaign strategy, funnel, and targeting approach", phase: "1", status: "pending" },
      { id: "pm4", title: "Finalize advertising platforms, budget allocation, and KPIs", phase: "1", status: "pending" },
      { id: "pm5", title: "Prepare campaign timeline and execution roadmap", phase: "1", status: "pending" },
      // Phase 2 - Campaign Setup & Asset Preparation
      { id: "pm6", title: "Set up advertising accounts, pixels, tags, and conversion tracking", phase: "2", status: "pending" },
      { id: "pm7", title: "Create campaign structure, audiences, and targeting segments", phase: "2", status: "pending" },
      { id: "pm8", title: "Prepare ad creatives, copywriting, and landing page assets", phase: "2", status: "pending" },
      { id: "pm9", title: "Configure bidding strategy, placements, and campaign settings", phase: "2", status: "pending" },
      { id: "pm10", title: "Review campaign setup and obtain client approval", phase: "2", status: "pending" },
      // Phase 3 - Launch & Optimization
      { id: "pm11", title: "Launch advertising campaigns", phase: "3", status: "pending" },
      { id: "pm12", title: "Monitor campaign performance and delivery metrics", phase: "3", status: "pending" },
      { id: "pm13", title: "Optimize audiences, creatives, placements, and bidding", phase: "3", status: "pending" },
      { id: "pm14", title: "Conduct A/B testing for ads, creatives, and targeting", phase: "3", status: "pending" },
      { id: "pm15", title: "Analyze conversions, ROI, and campaign performance", phase: "3", status: "pending" },
      // Phase 4 - Reporting & Scaling
      { id: "pm16", title: "Prepare campaign performance reports and insights", phase: "4", status: "pending" },
      { id: "pm17", title: "Present optimization recommendations and next steps", phase: "4", status: "pending" },
      { id: "pm18", title: "Scale successful campaigns and optimize budget allocation", phase: "4", status: "pending" },
      { id: "pm19", title: "Document campaign learnings and performance benchmarks", phase: "4", status: "pending" },
      { id: "pm20", title: "Obtain client approval and continue or close campaign cycle", phase: "4", status: "pending" }
    ]
  },
  LEAD_GENERATION: {
    phases: [
      { id: "1", name: "Lead Strategy & Reference Lock ( Phase-1 )", status: "in-progress", progress: 0 },
      { id: "2", name: "Funnel Setup ( Phase-2 )", status: "pending", progress: 0 },
      { id: "3", name: "Lead Execution ( Phase-3 )", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure ( Phase-4 )", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "lg1", title: "Define target audience", phase: "1", status: "pending" },
      { id: "lg2", title: "Choose platforms", phase: "1", status: "pending" },
      { id: "lg3", title: "Decide funnel type", phase: "1", status: "pending" },
      { id: "lg4", title: "Lock CPL goal", phase: "1", status: "pending" },
      { id: "lg5", title: "Share funnel plan / lead sheet / form link", phase: "1", status: "pending" },
      // Stage 2
      { id: "lg6", title: "Create landing page / form", phase: "2", status: "pending" },
      { id: "lg7", title: "Setup CRM", phase: "2", status: "pending" },
      { id: "lg8", title: "Setup automation", phase: "2", status: "pending" },
      { id: "lg9", title: "Test lead flow", phase: "2", status: "pending" },
      // Stage 3
      { id: "lg10", title: "Run campaigns", phase: "3", status: "pending" },
      { id: "lg11", title: "Monitor lead quality", phase: "3", status: "pending" },
      { id: "lg12", title: "Optimize flow", phase: "3", status: "pending" },
      { id: "lg13", title: "Maintain data", phase: "3", status: "pending" },
      // Stage 4
      { id: "lg14", title: "Analyze leads", phase: "4", status: "pending" },
      { id: "lg15", title: "Prepare report", phase: "4", status: "pending" },
      { id: "lg16", title: "Share insights", phase: "4", status: "pending" },
      { id: "lg17", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  SOCIAL_MEDIA_MANAGEMENT: {
    phases: [
      { id: "1", name: "Strategy & Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Content Creation & Approval", status: "pending", progress: 0 },
      { id: "3", name: "Publishing & Engagement", status: "pending", progress: 0 },
      { id: "4", name: "Performance Analysis & Optimization", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Strategy & Planning
      { id: "sm1", title: "Understand business goals, target audience, and brand positioning", phase: "1", status: "pending" },
      { id: "sm2", title: "Analyze competitors, industry trends, and social media opportunities", phase: "1", status: "pending" },
      { id: "sm3", title: "Define content pillars, posting strategy, and campaign objectives", phase: "1", status: "pending" },
      { id: "sm4", title: "Identify platforms, content formats, and growth strategy", phase: "1", status: "pending" },
      { id: "sm5", title: "Prepare monthly content calendar and execution roadmap", phase: "1", status: "pending" },
      // Phase 2 - Content Creation & Approval
      { id: "sm6", title: "Research content ideas, trends, and engagement opportunities", phase: "2", status: "pending" },
      { id: "sm7", title: "Create social media graphics, carousels, reels, and visual assets", phase: "2", status: "pending" },
      { id: "sm8", title: "Write captions, hashtags, and call-to-action content", phase: "2", status: "pending" },
      { id: "sm9", title: "Prepare platform-specific content variations", phase: "2", status: "pending" },
      { id: "sm10", title: "Share content calendar and creatives for client approval", phase: "2", status: "pending" },
      // Phase 3 - Publishing & Engagement
      { id: "sm11", title: "Schedule and publish approved content", phase: "3", status: "pending" },
      { id: "sm12", title: "Monitor comments, messages, and audience engagement", phase: "3", status: "pending" },
      { id: "sm13", title: "Participate in community management and brand interactions", phase: "3", status: "pending" },
      { id: "sm14", title: "Track trends and create real-time content opportunities", phase: "3", status: "pending" },
      { id: "sm15", title: "Optimize posting schedules and content performance", phase: "3", status: "pending" },
      // Phase 4 - Performance Analysis & Optimization
      { id: "sm16", title: "Analyze reach, engagement, followers, and conversion metrics", phase: "4", status: "pending" },
      { id: "sm17", title: "Prepare monthly performance reports and insights", phase: "4", status: "pending" },
      { id: "sm18", title: "Identify top-performing content and optimization opportunities", phase: "4", status: "pending" },
      { id: "sm19", title: "Develop recommendations and strategy for the next cycle", phase: "4", status: "pending" },
      { id: "sm20", title: "Review performance with the client and finalize monthly deliverables", phase: "4", status: "pending" }
    ]
  },
  CREATIVE_DESIGN: {
    phases: [
      { id: "1", name: "Creative Brief & Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Concept Development", status: "pending", progress: 0 },
      { id: "3", name: "Design Production", status: "pending", progress: 0 },
      { id: "4", name: "Review & Final Delivery", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Creative Brief & Planning
      { id: "cd1", title: "Understand business goals, campaign objectives, and target audience", phase: "1", status: "pending" },
      { id: "cd2", title: "Collect brand assets, guidelines, and design requirements", phase: "1", status: "pending" },
      { id: "cd3", title: "Research competitors, industry trends, and design references", phase: "1", status: "pending" },
      { id: "cd4", title: "Define deliverables, formats, and project timeline", phase: "1", status: "pending" },
      { id: "cd5", title: "Prepare creative brief and project roadmap", phase: "1", status: "pending" },
      // Phase 2 - Concept Development
      { id: "cd6", title: "Develop creative concepts and design directions", phase: "2", status: "pending" },
      { id: "cd7", title: "Create moodboards, layouts, and visual references", phase: "2", status: "pending" },
      { id: "cd8", title: "Present initial concepts for client approval", phase: "2", status: "pending" },
      { id: "cd9", title: "Collect feedback and finalize design direction", phase: "2", status: "pending" },
      // Phase 3 - Design Production
      { id: "cd10", title: "Create final designs, graphics, and visual assets", phase: "3", status: "pending" },
      { id: "cd11", title: "Apply branding, typography, and visual consistency", phase: "3", status: "pending" },
      { id: "cd12", title: "Create variations and platform-specific adaptations", phase: "3", status: "pending" },
      { id: "cd13", title: "Perform quality checks and optimize design files", phase: "3", status: "pending" },
      { id: "cd14", title: "Prepare editable source files and export versions", phase: "3", status: "pending" },
      // Phase 4 - Review & Final Delivery
      { id: "cd15", title: "Share final creatives for client review and approval", phase: "4", status: "pending" },
      { id: "cd16", title: "Implement revisions and finalize deliverables", phase: "4", status: "pending" },
      { id: "cd17", title: "Export assets in required formats and dimensions", phase: "4", status: "pending" },
      { id: "cd18", title: "Deliver source files, assets, and documentation", phase: "4", status: "pending" },
      { id: "cd19", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  BRANDING_KIT: {
    phases: [
      { id: "1", name: "Brand Discovery & Strategy", status: "in-progress", progress: 0 },
      { id: "2", name: "Visual Identity Design", status: "pending", progress: 0 },
      { id: "3", name: "Brand Asset Development", status: "pending", progress: 0 },
      { id: "4", name: "Review & Brand Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Brand Discovery & Strategy
      { id: "bk1", title: "Understand business goals, vision, mission, and target audience", phase: "1", status: "pending" },
      { id: "bk2", title: "Research competitors, industry trends, and market positioning", phase: "1", status: "pending" },
      { id: "bk3", title: "Define brand personality, tone, and positioning strategy", phase: "1", status: "pending" },
      { id: "bk4", title: "Collect brand inspirations and visual references", phase: "1", status: "pending" },
      { id: "bk5", title: "Finalize branding scope, deliverables, and timeline", phase: "1", status: "pending" },
      // Phase 2 - Visual Identity Design
      { id: "bk6", title: "Create logo concepts and brand identity directions", phase: "2", status: "pending" },
      { id: "bk7", title: "Finalize logo design and variations", phase: "2", status: "pending" },
      { id: "bk8", title: "Define brand color palette and typography system", phase: "2", status: "pending" },
      { id: "bk9", title: "Create iconography, graphic elements, and visual patterns", phase: "2", status: "pending" },
      { id: "bk10", title: "Prepare visual identity mockups and presentations", phase: "2", status: "pending" },
      // Phase 3 - Brand Asset Development
      { id: "bk11", title: "Design business cards, letterheads, and stationery assets", phase: "3", status: "pending" },
      { id: "bk12", title: "Create social media branding assets and templates", phase: "3", status: "pending" },
      { id: "bk13", title: "Develop brand guidelines and usage instructions", phase: "3", status: "pending" },
      { id: "bk14", title: "Prepare presentation templates and brand materials", phase: "3", status: "pending" },
      { id: "bk15", title: "Organize all brand assets and source files", phase: "3", status: "pending" },
      // Phase 4 - Review & Brand Handover
      { id: "bk16", title: "Present brand identity and collect client feedback", phase: "4", status: "pending" },
      { id: "bk17", title: "Implement revisions and finalize assets", phase: "4", status: "pending" },
      { id: "bk18", title: "Export all files in required formats", phase: "4", status: "pending" },
      { id: "bk19", title: "Deliver brand kit, guidelines, and source files", phase: "4", status: "pending" },
      { id: "bk20", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  VIDEO_SERVICE: {
    phases: [
      { id: "1", name: "Pre-Production & Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Production & Asset Collection", status: "pending", progress: 0 },
      { id: "3", name: "Editing & Post-Production", status: "pending", progress: 0 },
      { id: "4", name: "Review & Final Delivery", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Pre-Production & Planning
      { id: "vs1", title: "Understand project goals, target audience, and content objectives", phase: "1", status: "pending" },
      { id: "vs2", title: "Define video format, duration, platform, and deliverables", phase: "1", status: "pending" },
      { id: "vs3", title: "Research references, competitors, and creative inspiration", phase: "1", status: "pending" },
      { id: "vs4", title: "Prepare script, storyboard, and shot list if required", phase: "1", status: "pending" },
      { id: "vs5", title: "Finalize project scope, timeline, and approval process", phase: "1", status: "pending" },
      // Phase 2 - Production & Asset Collection
      { id: "vs6", title: "Collect raw footage, audio files, graphics, and brand assets", phase: "2", status: "pending" },
      { id: "vs7", title: "Organize media assets and project files", phase: "2", status: "pending" },
      { id: "vs8", title: "Record voiceovers, interviews, or additional footage if required", phase: "2", status: "pending" },
      { id: "vs9", title: "Review and prepare assets for editing workflow", phase: "2", status: "pending" },
      // Phase 3 - Editing & Post-Production
      { id: "vs10", title: "Create rough cut and establish video structure", phase: "3", status: "pending" },
      { id: "vs11", title: "Add transitions, motion graphics, animations, and effects", phase: "3", status: "pending" },
      { id: "vs12", title: "Perform color correction, color grading, and visual enhancement", phase: "3", status: "pending" },
      { id: "vs13", title: "Add background music, sound effects, and audio mixing", phase: "3", status: "pending" },
      { id: "vs14", title: "Add subtitles, captions, branding, and call-to-actions", phase: "3", status: "pending" },
      { id: "vs15", title: "Export preview version for client review", phase: "3", status: "pending" },
      // Phase 4 - Review & Final Delivery
      { id: "vs16", title: "Collect client feedback and implement revisions", phase: "4", status: "pending" },
      { id: "vs17", title: "Perform final quality checks and optimization", phase: "4", status: "pending" },
      { id: "vs18", title: "Export videos in required formats, resolutions, and aspect ratios", phase: "4", status: "pending" },
      { id: "vs19", title: "Deliver final video files and source files if included", phase: "4", status: "pending" },
      { id: "vs20", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  AI_VIDEO_GENERATION: {
    phases: [
      { id: "1", name: "Strategy & Pre-Production", status: "in-progress", progress: 0 },
      { id: "2", name: "Script & Asset Creation", status: "pending", progress: 0 },
      { id: "3", name: "Video Production & Editing", status: "pending", progress: 0 },
      { id: "4", name: "Review & Delivery", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Strategy & Pre-Production
      { id: "av1", title: "Understand business goals, target audience, and campaign objectives", phase: "1", status: "pending" },
      { id: "av2", title: "Define video type, style, duration, and output requirements", phase: "1", status: "pending" },
      { id: "av3", title: "Research references, competitors, and creative inspiration", phase: "1", status: "pending" },
      { id: "av4", title: "Create storyboard, shot list, and production plan", phase: "1", status: "pending" },
      { id: "av5", title: "Finalize timeline, deliverables, and approval process", phase: "1", status: "pending" },
      // Phase 2 - Script & Asset Creation
      { id: "av6", title: "Write or finalize video script and messaging", phase: "2", status: "pending" },
      { id: "av7", title: "Generate AI visuals, avatars, characters, or scenes", phase: "2", status: "pending" },
      { id: "av8", title: "Create AI voice-over and narration assets", phase: "2", status: "pending" },
      { id: "av9", title: "Prepare branding elements, graphics, and supporting assets", phase: "2", status: "pending" },
      { id: "av10", title: "Review generated assets for quality and consistency", phase: "2", status: "pending" },
      // Phase 3 - Video Production & Editing
      { id: "av11", title: "Generate AI video sequences and scenes", phase: "3", status: "pending" },
      { id: "av12", title: "Edit video, transitions, animations, and effects", phase: "3", status: "pending" },
      { id: "av13", title: "Add subtitles, captions, and branding elements", phase: "3", status: "pending" },
      { id: "av14", title: "Add background music, sound design, and audio enhancements", phase: "3", status: "pending" },
      { id: "av15", title: "Export preview version for client review", phase: "3", status: "pending" },
      // Phase 4 - Review & Delivery
      { id: "av16", title: "Collect feedback and implement revisions", phase: "4", status: "pending" },
      { id: "av17", title: "Perform final quality check and optimization", phase: "4", status: "pending" },
      { id: "av18", title: "Export videos in required formats and resolutions", phase: "4", status: "pending" },
      { id: "av19", title: "Deliver final videos and supporting assets", phase: "4", status: "pending" },
      { id: "av20", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  CGI_3D_VFX: {
    phases: [
      { id: "1", name: "Concept & Pre-Production", status: "in-progress", progress: 0 },
      { id: "2", name: "Asset Creation & Production", status: "pending", progress: 0 },
      { id: "3", name: "Animation, VFX & Rendering", status: "pending", progress: 0 },
      { id: "4", name: "Review, Delivery & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Concept & Pre-Production
      { id: "cgi1", title: "Understand project goals, target audience, and usage platform", phase: "1", status: "pending" },
      { id: "cgi2", title: "Collect product references, assets, and creative requirements", phase: "1", status: "pending" },
      { id: "cgi3", title: "Research style references and visual inspiration", phase: "1", status: "pending" },
      { id: "cgi4", title: "Create storyboard, moodboard, and shot list", phase: "1", status: "pending" },
      { id: "cgi5", title: "Finalize animation concept, timeline, and deliverables", phase: "1", status: "pending" },
      // Phase 2 - Asset Creation & Production
      { id: "cgi6", title: "Create or optimize 3D models and assets", phase: "2", status: "pending" },
      { id: "cgi7", title: "Apply materials, textures, and shaders", phase: "2", status: "pending" },
      { id: "cgi8", title: "Set up environment, lighting, and scene composition", phase: "2", status: "pending" },
      { id: "cgi9", title: "Create camera movements and scene transitions", phase: "2", status: "pending" },
      { id: "cgi10", title: "Prepare simulations, particles, and visual effects setup", phase: "2", status: "pending" },
      // Phase 3 - Animation, VFX & Rendering
      { id: "cgi11", title: "Create animation sequences and keyframes", phase: "3", status: "pending" },
      { id: "cgi12", title: "Add VFX elements, simulations, and motion effects", phase: "3", status: "pending" },
      { id: "cgi13", title: "Perform lighting adjustments and scene optimization", phase: "3", status: "pending" },
      { id: "cgi14", title: "Render preview sequences for client review", phase: "3", status: "pending" },
      { id: "cgi15", title: "Apply revisions and render final output", phase: "3", status: "pending" },
      // Phase 4 - Review, Delivery & Handover
      { id: "cgi16", title: "Perform color grading and post-production editing", phase: "4", status: "pending" },
      { id: "cgi17", title: "Add sound design, music, and final effects if required", phase: "4", status: "pending" },
      { id: "cgi18", title: "Export deliverables in required formats and resolutions", phase: "4", status: "pending" },
      { id: "cgi19", title: "Share final output for client approval", phase: "4", status: "pending" },
      { id: "cgi20", title: "Deliver source files, assets, and project documentation", phase: "4", status: "pending" },
      { id: "cgi21", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  WRITING_CONTENT: {
    phases: [
      { id: "1", name: "Research & Content Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Content Creation", status: "pending", progress: 0 },
      { id: "3", name: "Review & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Approval", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Research & Content Planning
      { id: "wc1", title: "Understand business goals, target audience, and content objectives", phase: "1", status: "pending" },
      { id: "wc2", title: "Research industry trends, competitors, and target topics", phase: "1", status: "pending" },
      { id: "wc3", title: "Conduct keyword research and content opportunity analysis", phase: "1", status: "pending" },
      { id: "wc4", title: "Define content strategy, tone of voice, and content structure", phase: "1", status: "pending" },
      { id: "wc5", title: "Prepare content calendar, outline, and delivery timeline", phase: "1", status: "pending" },
      // Phase 2 - Content Creation
      { id: "wc6", title: "Create content outlines and content briefs", phase: "2", status: "pending" },
      { id: "wc7", title: "Write content according to approved strategy and objectives", phase: "2", status: "pending" },
      { id: "wc8", title: "Incorporate SEO keywords, CTAs, and brand messaging", phase: "2", status: "pending" },
      { id: "wc9", title: "Develop supporting elements such as headlines, meta descriptions, and captions", phase: "2", status: "pending" },
      { id: "wc10", title: "Prepare first draft for internal quality review", phase: "2", status: "pending" },
      // Phase 3 - Review & Optimization
      { id: "wc11", title: "Review content for grammar, clarity, readability, and accuracy", phase: "3", status: "pending" },
      { id: "wc12", title: "Optimize content for SEO, engagement, and conversions", phase: "3", status: "pending" },
      { id: "wc13", title: "Perform plagiarism checks and quality assurance", phase: "3", status: "pending" },
      { id: "wc14", title: "Share draft content with client for review and feedback", phase: "3", status: "pending" },
      { id: "wc15", title: "Implement revisions and finalize content", phase: "3", status: "pending" },
      // Phase 4 - Delivery & Approval
      { id: "wc16", title: "Format content according to platform or publishing requirements", phase: "4", status: "pending" },
      { id: "wc17", title: "Prepare supporting files and content assets", phase: "4", status: "pending" },
      { id: "wc18", title: "Deliver final content and editable source files if applicable", phase: "4", status: "pending" },
      { id: "wc19", title: "Provide publishing recommendations and optimization insights", phase: "4", status: "pending" },
      { id: "wc20", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  CUSTOMER_SUPPORT: {
    phases: [
      { id: "1", name: "Support Scope & Reference Lock ( Phase-1 )", status: "in-progress", progress: 0 },
      { id: "2", name: "Support Setup ( Phase-2 )", status: "pending", progress: 0 },
      { id: "3", name: "Live Support Execution ( Phase-3 )", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure ( Phase-4 )", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "cs1", title: "Understand support type (chat, email, call)", phase: "1", status: "pending" },
      { id: "cs2", title: "Define working hours and SLAs", phase: "1", status: "pending" },
      { id: "cs3", title: "Define issue categories", phase: "1", status: "pending" },
      { id: "cs4", title: "Lock tools", phase: "1", status: "pending" },
      { id: "cs5", title: "Share SOP doc / FAQs / escalation sheet link", phase: "1", status: "pending" },
      // Stage 2
      { id: "cs6", title: "Setup tools and access", phase: "2", status: "pending" },
      { id: "cs7", title: "Prepare response templates", phase: "2", status: "pending" },
      { id: "cs8", title: "Test basic workflows", phase: "2", status: "pending" },
      // Stage 3
      { id: "cs9", title: "Handle customer queries", phase: "3", status: "pending" },
      { id: "cs10", title: "Escalate issues as defined", phase: "3", status: "pending" },
      { id: "cs11", title: "Maintain support logs", phase: "3", status: "pending" },
      // Stage 4
      { id: "cs12", title: "Share support summary", phase: "4", status: "pending" },
      { id: "cs13", title: "Highlight recurring issues", phase: "4", status: "pending" },
      { id: "cs14", title: "Close cycle", phase: "4", status: "pending" }
    ]
  },
  INFLUENCER_MARKETING: {
    phases: [
      { id: "1", name: "Campaign Scope & Reference Lock ( Phase-1 )", status: "in-progress", progress: 0 },
      { id: "2", name: "Influencer Direction ( Phase-2 )", status: "pending", progress: 0 },
      { id: "3", name: "Campaign Execution ( Phase-3 )", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure ( Phase-4 )", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "im1", title: "Understand campaign goal", phase: "1", status: "pending" },
      { id: "im2", title: "Decide influencer type & budget", phase: "1", status: "pending" },
      { id: "im3", title: "Decide content format", phase: "1", status: "pending" },
      { id: "im4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "im5", title: "Share campaign brief / influencer shortlisting sheet", phase: "1", status: "pending" },
      // Stage 2
      { id: "im6", title: "Shortlist influencers", phase: "2", status: "pending" },
      { id: "im7", title: "Align on content direction", phase: "2", status: "pending" },
      { id: "im8", title: "Share posting guidelines", phase: "2", status: "pending" },
      // Stage 3
      { id: "im9", title: "Coordinate content creation", phase: "3", status: "pending" },
      { id: "im10", title: "Ensure posting as planned", phase: "3", status: "pending" },
      { id: "im11", title: "Track links and performance", phase: "3", status: "pending" },
      // Stage 4
      { id: "im12", title: "Analyze reach and engagement", phase: "4", status: "pending" },
      { id: "im13", title: "Share campaign report", phase: "4", status: "pending" },
      { id: "im14", title: "Close campaign", phase: "4", status: "pending" }
    ]
  },
  UGC_MARKETING: {
    phases: [
      { id: "1", name: "UGC Scope & Reference Lock ( Phase-1 )", status: "in-progress", progress: 0 },
      { id: "2", name: "Content Direction ( Phase-2 )", status: "pending", progress: 0 },
      { id: "3", name: "Content Creation ( Phase-3 )", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Closure ( Phase-4 )", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "ugc1", title: "Understand brand goal", phase: "1", status: "pending" },
      { id: "ugc2", title: "Decide number and type of UGC", phase: "1", status: "pending" },
      { id: "ugc3", title: "Decide creator profile", phase: "1", status: "pending" },
      { id: "ugc4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "ugc5", title: "Share UGC brief / sample references / content checklist", phase: "1", status: "pending" },
      // Stage 2
      { id: "ugc6", title: "Align creators on messaging", phase: "2", status: "pending" },
      { id: "ugc7", title: "Approve content direction", phase: "2", status: "pending" },
      // Stage 3
      { id: "ugc8", title: "Collect UGC videos/photos", phase: "3", status: "pending" },
      { id: "ugc9", title: "Apply fixes if required", phase: "3", status: "pending" },
      // Stage 4
      { id: "ugc10", title: "Deliver all UGC assets", phase: "4", status: "pending" },
      { id: "ugc11", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  CRM_ERP: {
    phases: [
      { id: "1", name: "Business Analysis & Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "System Design & Development", status: "pending", progress: 0 },
      { id: "3", name: "Testing & User Acceptance", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Business Analysis & Planning
      { id: "erp1", title: "Understand business processes, goals, and operational requirements", phase: "1", status: "pending" },
      { id: "erp2", title: "Identify departments, user roles, and workflow requirements", phase: "1", status: "pending" },
      { id: "erp3", title: "Document business processes and system requirements", phase: "1", status: "pending" },
      { id: "erp4", title: "Identify required integrations, reports, and automation needs", phase: "1", status: "pending" },
      { id: "erp5", title: "Finalize project scope, modules, milestones, and timeline", phase: "1", status: "pending" },
      // Phase 2 - System Design & Development
      { id: "erp6", title: "Design system architecture, database, and workflow diagrams", phase: "2", status: "pending" },
      { id: "erp7", title: "Develop user roles, permissions, and authentication systems", phase: "2", status: "pending" },
      { id: "erp8", title: "Develop CRM modules such as leads, customers, sales, and support", phase: "2", status: "pending" },
      { id: "erp9", title: "Develop ERP modules such as inventory, finance, HR, and operations", phase: "2", status: "pending" },
      { id: "erp10", title: "Integrate third-party systems, APIs, payment gateways, and communication tools", phase: "2", status: "pending" },
      { id: "erp11", title: "Implement dashboards, analytics, reports, and business automations", phase: "2", status: "pending" },
      // Phase 3 - Testing & User Acceptance
      { id: "erp12", title: "Perform module-wise functionality testing", phase: "3", status: "pending" },
      { id: "erp13", title: "Validate workflows, permissions, and business rules", phase: "3", status: "pending" },
      { id: "erp14", title: "Perform security, performance, and scalability testing", phase: "3", status: "pending" },
      { id: "erp15", title: "Conduct user acceptance testing (UAT) with stakeholders", phase: "3", status: "pending" },
      { id: "erp16", title: "Implement revisions and optimize system performance", phase: "3", status: "pending" },
      // Phase 4 - Deployment & Handover
      { id: "erp17", title: "Deploy the CRM/ERP solution to the production environment", phase: "4", status: "pending" },
      { id: "erp18", title: "Migrate existing business data if required", phase: "4", status: "pending" },
      { id: "erp19", title: "Configure monitoring, backups, and security settings", phase: "4", status: "pending" },
      { id: "erp20", title: "Provide user training, documentation, and admin access", phase: "4", status: "pending" },
      { id: "erp21", title: "Deliver source code, credentials, and technical documentation", phase: "4", status: "pending" },
      { id: "erp22", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  AI_AUTOMATION: {
    phases: [
      { id: "1", name: "Discovery & Workflow Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Automation Design & Development", status: "pending", progress: 0 },
      { id: "3", name: "Testing & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Discovery & Workflow Planning
      { id: "ai1", title: "Understand business objectives and automation requirements", phase: "1", status: "pending" },
      { id: "ai2", title: "Identify existing workflows, bottlenecks, and manual processes", phase: "1", status: "pending" },
      { id: "ai3", title: "Document workflow logic, triggers, and expected outcomes", phase: "1", status: "pending" },
      { id: "ai4", title: "Identify required tools, APIs, and integrations", phase: "1", status: "pending" },
      { id: "ai5", title: "Finalize project scope, milestones, and delivery timeline", phase: "1", status: "pending" },
      // Phase 2 - Automation Design & Development
      { id: "ai6", title: "Design automation architecture and workflow diagrams", phase: "2", status: "pending" },
      { id: "ai7", title: "Configure automation platform (Make, Zapier, n8n, etc.)", phase: "2", status: "pending" },
      { id: "ai8", title: "Build automation workflows and business logic", phase: "2", status: "pending" },
      { id: "ai9", title: "Integrate third-party applications and APIs", phase: "2", status: "pending" },
      { id: "ai10", title: "Implement AI models, prompts, or agents if required", phase: "2", status: "pending" },
      { id: "ai11", title: "Set up notifications, alerts, and exception handling", phase: "2", status: "pending" },
      // Phase 3 - Testing & Optimization
      { id: "ai12", title: "Perform end-to-end workflow testing", phase: "3", status: "pending" },
      { id: "ai13", title: "Validate data flow, triggers, and outputs", phase: "3", status: "pending" },
      { id: "ai14", title: "Optimize workflow performance and execution speed", phase: "3", status: "pending" },
      { id: "ai15", title: "Implement security checks and error recovery mechanisms", phase: "3", status: "pending" },
      { id: "ai16", title: "Share testing environment and workflows for client review", phase: "3", status: "pending" },
      // Phase 4 - Deployment & Handover
      { id: "ai17", title: "Deploy automation workflows to production environment", phase: "4", status: "pending" },
      { id: "ai18", title: "Set up monitoring, analytics, and reporting", phase: "4", status: "pending" },
      { id: "ai19", title: "Provide workflow documentation and process maps", phase: "4", status: "pending" },
      { id: "ai20", title: "Provide access credentials, API documentation, and training", phase: "4", status: "pending" },
      { id: "ai21", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  },
  WHATSAPP_CHATBOT: {
    phases: [
      { id: "1", name: "Bot Scope & Reference Lock ( Phase-1 )", status: "in-progress", progress: 0 },
      { id: "2", name: "Bot Direction ( Phase-2 )", status: "pending", progress: 0 },
      { id: "3", name: "Bot Completion ( Phase-3 )", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Closure ( Phase-4 )", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "wc1", title: "Understand bot purpose", phase: "1", status: "pending" },
      { id: "wc2", title: "Decide conversation flow", phase: "1", status: "pending" },
      { id: "wc3", title: "Decide integrations", phase: "1", status: "pending" },
      { id: "wc4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "wc5", title: "Share flow chart / message script / reference bot link", phase: "1", status: "pending" },
      // Stage 2
      { id: "wc6", title: "Build basic bot flow", phase: "2", status: "pending" },
      { id: "wc7", title: "Test conversation logic", phase: "2", status: "pending" },
      // Stage 3
      { id: "wc8", title: "Implement full flow", phase: "3", status: "pending" },
      { id: "wc9", title: "Fix responses", phase: "3", status: "pending" },
      { id: "wc10", title: "Final testing", phase: "3", status: "pending" },
      // Stage 4
      { id: "wc11", title: "Deploy bot", phase: "4", status: "pending" },
      { id: "wc12", title: "Share access and instructions", phase: "4", status: "pending" },
      { id: "wc13", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  AI_VOICE_AGENT: {
    phases: [
      { id: "1", name: "Discovery & Conversation Planning", status: "in-progress", progress: 0 },
      { id: "2", name: "Agent Configuration & Integration", status: "pending", progress: 0 },
      { id: "3", name: "Testing & Optimization", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Phase 1 - Discovery & Conversation Planning
      { id: "va1", title: "Understand business goals, use cases, and target audience", phase: "1", status: "pending" },
      { id: "va2", title: "Define call workflows, scenarios, and conversation objectives", phase: "1", status: "pending" },
      { id: "va3", title: "Prepare conversation flows, scripts, and escalation paths", phase: "1", status: "pending" },
      { id: "va4", title: "Identify integrations, APIs, CRM systems, and data sources", phase: "1", status: "pending" },
      { id: "va5", title: "Finalize project scope, deliverables, and implementation timeline", phase: "1", status: "pending" },
      // Phase 2 - Agent Configuration & Integration
      { id: "va6", title: "Configure AI voice agent platform and infrastructure", phase: "2", status: "pending" },
      { id: "va7", title: "Set up voice models, prompts, and conversation logic", phase: "2", status: "pending" },
      { id: "va8", title: "Integrate CRM, calendars, databases, and third-party systems", phase: "2", status: "pending" },
      { id: "va9", title: "Configure call routing, notifications, and fallback workflows", phase: "2", status: "pending" },
      { id: "va10", title: "Implement lead capture, appointment booking, or support workflows", phase: "2", status: "pending" },
      // Phase 3 - Testing & Optimization
      { id: "va11", title: "Perform end-to-end call flow testing", phase: "3", status: "pending" },
      { id: "va12", title: "Test voice quality, latency, and conversation accuracy", phase: "3", status: "pending" },
      { id: "va13", title: "Validate integrations, workflows, and data synchronization", phase: "3", status: "pending" },
      { id: "va14", title: "Optimize prompts, responses, and conversation handling", phase: "3", status: "pending" },
      { id: "va15", title: "Share testing environment and conduct client review", phase: "3", status: "pending" },
      // Phase 4 - Deployment & Handover
      { id: "va16", title: "Deploy the AI voice agent to the production environment", phase: "4", status: "pending" },
      { id: "va17", title: "Configure monitoring, analytics, and call reporting", phase: "4", status: "pending" },
      { id: "va18", title: "Prepare documentation, conversation flows, and usage guidelines", phase: "4", status: "pending" },
      { id: "va19", title: "Provide access credentials, training, and support documentation", phase: "4", status: "pending" },
      { id: "va20", title: "Obtain final approval and complete project handover", phase: "4", status: "pending" }
    ]
  }
};

export const getSopFromTitle = (title) => {
  if (!title) return SOP_TEMPLATES.WEBSITE;
  const t = title.toLowerCase();

  // Mapping logic
  if (t.includes("app development") || t.includes("mobile app")) return SOP_TEMPLATES.APP;
  if (t.includes("software") || t.includes("platform") || t.includes("saas")) return SOP_TEMPLATES.SOFTWARE;
  if (
    t.includes("seo") ||
    t.includes("search engine") ||
    t.includes("gmb") ||
    t.includes("google business")
  ) {
    return SOP_TEMPLATES.SEO;
  }
  if (
    t.includes("paid advertising") ||
    t.includes("paid_advertising") ||
    t.includes("paid ads") ||
    t.includes("media buying") ||
    t.includes("performance marketing") ||
    t.includes("ppc") ||
    t.includes("google ads") ||
    t.includes("meta ads")
  ) {
    return SOP_TEMPLATES.PERFORMANCE_MARKETING;
  }
  if (t.includes("lead generation") || t.includes("lead gen")) return SOP_TEMPLATES.LEAD_GENERATION;
  if (
    t.includes("social media marketing") ||
    t.includes("social_media_marketing") ||
    t.includes("social media management") ||
    t.includes("social media marketing organic") ||
    t.includes("social media") ||
    t.includes("smo") ||
    t.includes("instagram") ||
    t.includes("facebook") ||
    t.includes("linkedin")
  ) {
    return SOP_TEMPLATES.SOCIAL_MEDIA_MANAGEMENT;
  }
  if (
    t.includes("branding kit") ||
    t.includes("brand kit") ||
    t.includes("branding_kit") ||
    t.includes("brand_kit") ||
    t.includes("brand identity") ||
    t.includes("brand_identity") ||
    t.includes("branding")
  ) {
    return SOP_TEMPLATES.BRANDING_KIT;
  }
  if (
    t.includes("ai video") ||
    t.includes("ai_video") ||
    t.includes("video generation") ||
    t.includes("video_generation") ||
    t.includes("ai_video_generation") ||
    t.includes("ai-generated video") ||
    t.includes("avatar video") ||
    t.includes("synthesia") ||
    t.includes("runway")
  ) {
    return SOP_TEMPLATES.AI_VIDEO_GENERATION;
  }
  if (t.includes("creative") || t.includes("design") || t.includes("logo")) return SOP_TEMPLATES.CREATIVE_DESIGN;
  if (t.includes("3d") || t.includes("cgi") || t.includes("vfx")) return SOP_TEMPLATES.CGI_3D_VFX;
  if (
    t.includes("video services") ||
    t.includes("video_services") ||
    t.includes("video service") ||
    t.includes("video editing") ||
    t.includes("video production") ||
    t.includes("video") ||
    t.includes("reel") ||
    t.includes("editing")
  ) {
    return SOP_TEMPLATES.VIDEO_SERVICE;
  }
  if (
    t.includes("writing content") ||
    t.includes("content writing") ||
    t.includes("copywriting") ||
    t.includes("content") ||
    t.includes("writing") ||
    t.includes("blog")
  ) {
    return SOP_TEMPLATES.WRITING_CONTENT;
  }
  if (t.includes("support") || t.includes("customer service")) return SOP_TEMPLATES.CUSTOMER_SUPPORT;
  if (t.includes("influencer")) return SOP_TEMPLATES.INFLUENCER_MARKETING;
  if (t.includes("ugc")) return SOP_TEMPLATES.UGC_MARKETING;
  if (
    t.includes("voice agent") ||
    t.includes("voice_agent") ||
    t.includes("ai calling") ||
    t.includes("voice bot") ||
    t.includes("voice call")
  ) {
    return SOP_TEMPLATES.AI_VOICE_AGENT;
  }
  if (t.includes("crm") || t.includes("erp") || t.includes("system")) return SOP_TEMPLATES.CRM_ERP;
  if (
    (t.includes("agent") && !t.includes("voice")) ||
    (t.includes("automation") && !t.includes("voice"))
  ) {
    return SOP_TEMPLATES.AI_AUTOMATION;
  }
  if (t.includes("whatsapp") || t.includes("chatbot")) return SOP_TEMPLATES.WHATSAPP_CHATBOT;

  // Default
  return SOP_TEMPLATES.WEBSITE;
};
