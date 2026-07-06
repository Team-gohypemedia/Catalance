const defaultPhases = [
  { id: "1", name: "Onboarding & Requirements", status: "in-progress", progress: 0 },
  { id: "2", name: "Core Execution & 50% Delivery", status: "pending", progress: 0 },
  { id: "3", name: "Final Execution & 100% Delivery", status: "pending", progress: 0 },
  { id: "4", name: "QA, Handover & Closure", status: "pending", progress: 0 }
];

export const SOP_TEMPLATES = {
  WEBSITE: {
    phases: defaultPhases,
    tasks: [
      { id: "w1", title: "Collect credentials, hosting access, and brand guidelines", phase: "1", status: "pending" },
      { id: "w2", title: "Review client proposal and define website sitemap", phase: "1", status: "pending" },
      { id: "w3", title: "Gather required content, images, and media assets", phase: "1", status: "pending" },
      { id: "w4", title: "Finalize technical requirements and project timeline", phase: "1", status: "pending" },
      { id: "w5", title: "Setup development environment and configure CMS", phase: "2", status: "pending" },
      { id: "w6", title: "Develop homepage and core landing pages", phase: "2", status: "pending" },
      { id: "w7", title: "Implement initial branding, typography, and styling", phase: "2", status: "pending" },
      { id: "w8", title: "Present 50% completed website for client review", phase: "2", status: "pending" },
      { id: "w9", title: "Develop all remaining inner pages and features", phase: "3", status: "pending" },
      { id: "w10", title: "Integrate APIs, contact forms, and payment gateways", phase: "3", status: "pending" },
      { id: "w11", title: "Upload final content and implement on-page SEO", phase: "3", status: "pending" },
      { id: "w12", title: "Present fully completed website for final approval", phase: "3", status: "pending" },
      { id: "w13", title: "Perform cross-browser testing and mobile responsiveness checks", phase: "4", status: "pending" },
      { id: "w14", title: "Fix reported bugs and apply final revisions", phase: "4", status: "pending" },
      { id: "w15", title: "Deploy website to live production server", phase: "4", status: "pending" },
      { id: "w16", title: "Provide admin access and complete project handover", phase: "4", status: "pending" }
    ]
  },
  APP: {
    phases: defaultPhases,
    tasks: [
      { id: "a1", title: "Collect developer account access, design docs, and API keys", phase: "1", status: "pending" },
      { id: "a2", title: "Review client proposal and finalize app requirements", phase: "1", status: "pending" },
      { id: "a3", title: "Define target audience and core user journeys", phase: "1", status: "pending" },
      { id: "a4", title: "Setup project architecture and development environment", phase: "1", status: "pending" },
      { id: "a5", title: "Design UI/UX wireframes and core architecture", phase: "2", status: "pending" },
      { id: "a6", title: "Develop 50% of the core application screens", phase: "2", status: "pending" },
      { id: "a7", title: "Set up backend database and initial APIs", phase: "2", status: "pending" },
      { id: "a8", title: "Present 50% completed application for client review", phase: "2", status: "pending" },
      { id: "a9", title: "Develop remaining application screens and UI components", phase: "3", status: "pending" },
      { id: "a10", title: "Integrate authentication, payments, and push notifications", phase: "3", status: "pending" },
      { id: "a11", title: "Finalize backend business logic and complete 100% of features", phase: "3", status: "pending" },
      { id: "a12", title: "Present fully functional application for final approval", phase: "3", status: "pending" },
      { id: "a13", title: "Perform functional testing, security checks, and bug fixing", phase: "4", status: "pending" },
      { id: "a14", title: "Test compatibility across devices and operating systems", phase: "4", status: "pending" },
      { id: "a15", title: "Prepare app store assets and submit for review", phase: "4", status: "pending" },
      { id: "a16", title: "Deliver source code, credentials, and complete handover", phase: "4", status: "pending" }
    ]
  },
  SOFTWARE: {
    phases: defaultPhases,
    tasks: [
      { id: "s1", title: "Collect server access, business logic docs, and requirements", phase: "1", status: "pending" },
      { id: "s2", title: "Review client proposal and finalize software modules", phase: "1", status: "pending" },
      { id: "s3", title: "Define user roles, permissions, and workflow structure", phase: "1", status: "pending" },
      { id: "s4", title: "Setup basic architecture and development environment", phase: "1", status: "pending" },
      { id: "s5", title: "Design database structure and core system logic", phase: "2", status: "pending" },
      { id: "s6", title: "Build initial modules achieving 50% functionality", phase: "2", status: "pending" },
      { id: "s7", title: "Set up basic frontend UI and API connections", phase: "2", status: "pending" },
      { id: "s8", title: "Present 50% completed software for client review", phase: "2", status: "pending" },
      { id: "s9", title: "Develop all remaining modules and complex features", phase: "3", status: "pending" },
      { id: "s10", title: "Integrate third-party services and finalize role access", phase: "3", status: "pending" },
      { id: "s11", title: "Complete 100% of software functionality as per proposal", phase: "3", status: "pending" },
      { id: "s12", title: "Present fully completed system for final approval", phase: "3", status: "pending" },
      { id: "s13", title: "Perform UAT testing and fix functional issues", phase: "4", status: "pending" },
      { id: "s14", title: "Deploy software to production environment", phase: "4", status: "pending" },
      { id: "s15", title: "Provide basic documentation and user guides", phase: "4", status: "pending" },
      { id: "s16", title: "Share system access and close project", phase: "4", status: "pending" }
    ]
  },
  SEO: {
    phases: defaultPhases,
    tasks: [
      { id: "seo1", title: "Request website access, GMB access, and analytics logins", phase: "1", status: "pending" },
      { id: "seo2", title: "Review client proposal and analyze competitors", phase: "1", status: "pending" },
      { id: "seo3", title: "Perform keyword research and finalize target keywords", phase: "1", status: "pending" },
      { id: "seo4", title: "Conduct technical website audit and identify opportunities", phase: "1", status: "pending" },
      { id: "seo5", title: "Implement critical technical SEO fixes", phase: "2", status: "pending" },
      { id: "seo6", title: "Optimize 50% of target pages (Titles, Meta, Headings)", phase: "2", status: "pending" },
      { id: "seo7", title: "Set up analytics, search console, and tracking tools", phase: "2", status: "pending" },
      { id: "seo8", title: "Present 50% milestone progress for client review", phase: "2", status: "pending" },
      { id: "seo9", title: "Optimize remaining 50% of target pages", phase: "3", status: "pending" },
      { id: "seo10", title: "Create and publish planned SEO content and blogs", phase: "3", status: "pending" },
      { id: "seo11", title: "Execute backlink building and local citations", phase: "3", status: "pending" },
      { id: "seo12", title: "Complete 100% of monthly SEO deliverables", phase: "3", status: "pending" },
      { id: "seo13", title: "Track keyword rankings and analyze traffic performance", phase: "4", status: "pending" },
      { id: "seo14", title: "Fix any final indexing or crawling issues", phase: "4", status: "pending" },
      { id: "seo15", title: "Generate detailed SEO performance report", phase: "4", status: "pending" },
      { id: "seo16", title: "Present recommendations and complete handover", phase: "4", status: "pending" }
    ]
  },
  PERFORMANCE_MARKETING: {
    phases: defaultPhases,
    tasks: [
      { id: "pm1", title: "Request ad account access, pixel access, and brand assets", phase: "1", status: "pending" },
      { id: "pm2", title: "Review client proposal and understand campaign objectives", phase: "1", status: "pending" },
      { id: "pm3", title: "Define campaign strategy, funnel, and targeting approach", phase: "1", status: "pending" },
      { id: "pm4", title: "Finalize budget allocation and KPIs", phase: "1", status: "pending" },
      { id: "pm5", title: "Set up advertising accounts and conversion tracking", phase: "2", status: "pending" },
      { id: "pm6", title: "Create 50% of ad creatives and copywriting assets", phase: "2", status: "pending" },
      { id: "pm7", title: "Build initial campaign structure and audience segments", phase: "2", status: "pending" },
      { id: "pm8", title: "Present 50% milestone (campaign drafts) for review", phase: "2", status: "pending" },
      { id: "pm9", title: "Finalize remaining 50% of ad creatives and copy", phase: "3", status: "pending" },
      { id: "pm10", title: "Configure all bidding strategies and placements", phase: "3", status: "pending" },
      { id: "pm11", title: "Complete 100% of campaign setup and launch ads", phase: "3", status: "pending" },
      { id: "pm12", title: "Verify ads are active and tracking correctly", phase: "3", status: "pending" },
      { id: "pm13", title: "Monitor early performance and optimize delivery", phase: "4", status: "pending" },
      { id: "pm14", title: "Fix any rejected ads or tracking bugs", phase: "4", status: "pending" },
      { id: "pm15", title: "Prepare campaign performance report and insights", phase: "4", status: "pending" },
      { id: "pm16", title: "Deliver final report and complete handover", phase: "4", status: "pending" }
    ]
  },
  LEAD_GENERATION: {
    phases: defaultPhases,
    tasks: [
      { id: "lg1", title: "Request CRM access, ad accounts, and lead criteria", phase: "1", status: "pending" },
      { id: "lg2", title: "Review client proposal and define target audience", phase: "1", status: "pending" },
      { id: "lg3", title: "Decide funnel type and lock CPL goal", phase: "1", status: "pending" },
      { id: "lg4", title: "Draft lead generation strategy and roadmap", phase: "1", status: "pending" },
      { id: "lg5", title: "Create 50% of landing pages and lead forms", phase: "2", status: "pending" },
      { id: "lg6", title: "Draft initial ad copy and creative assets", phase: "2", status: "pending" },
      { id: "lg7", title: "Setup basic CRM integrations", phase: "2", status: "pending" },
      { id: "lg8", title: "Present 50% milestone (funnel drafts) for review", phase: "2", status: "pending" },
      { id: "lg9", title: "Complete remaining landing pages and ad creatives", phase: "3", status: "pending" },
      { id: "lg10", title: "Finalize all CRM automations and email sequences", phase: "3", status: "pending" },
      { id: "lg11", title: "Launch lead generation campaigns (100% completion)", phase: "3", status: "pending" },
      { id: "lg12", title: "Test lead flow end-to-end", phase: "3", status: "pending" },
      { id: "lg13", title: "Monitor incoming lead quality and optimize flow", phase: "4", status: "pending" },
      { id: "lg14", title: "Fix any automation bugs or tracking issues", phase: "4", status: "pending" },
      { id: "lg15", title: "Prepare lead analysis report", phase: "4", status: "pending" },
      { id: "lg16", title: "Deliver report and complete project handover", phase: "4", status: "pending" }
    ]
  },
  SOCIAL_MEDIA_MANAGEMENT: {
    phases: defaultPhases,
    tasks: [
      { id: "sm1", title: "Request social account access, brand kit, and past content", phase: "1", status: "pending" },
      { id: "sm2", title: "Review client proposal and define content pillars", phase: "1", status: "pending" },
      { id: "sm3", title: "Analyze competitors and industry trends", phase: "1", status: "pending" },
      { id: "sm4", title: "Prepare monthly content calendar strategy", phase: "1", status: "pending" },
      { id: "sm5", title: "Create 50% of social media graphics and videos", phase: "2", status: "pending" },
      { id: "sm6", title: "Write captions and hashtags for 50% of posts", phase: "2", status: "pending" },
      { id: "sm7", title: "Setup posting schedules for the first half of the month", phase: "2", status: "pending" },
      { id: "sm8", title: "Present 50% of deliverables for client review", phase: "2", status: "pending" },
      { id: "sm9", title: "Create remaining 50% of visual assets and graphics", phase: "3", status: "pending" },
      { id: "sm10", title: "Write captions and hashtags for remaining posts", phase: "3", status: "pending" },
      { id: "sm11", title: "Schedule 100% of the month's content", phase: "3", status: "pending" },
      { id: "sm12", title: "Obtain final approval on all scheduled content", phase: "3", status: "pending" },
      { id: "sm13", title: "Monitor community engagement and respond to comments", phase: "4", status: "pending" },
      { id: "sm14", title: "Fix any scheduling errors or formatting bugs", phase: "4", status: "pending" },
      { id: "sm15", title: "Prepare monthly performance analysis report", phase: "4", status: "pending" },
      { id: "sm16", title: "Deliver report and complete cycle handover", phase: "4", status: "pending" }
    ]
  },
  CREATIVE_DESIGN: {
    phases: defaultPhases,
    tasks: [
      { id: "cd1", title: "Request brand guidelines, reference materials, and copy", phase: "1", status: "pending" },
      { id: "cd2", title: "Review client proposal and define deliverables", phase: "1", status: "pending" },
      { id: "cd3", title: "Research visual inspiration and industry trends", phase: "1", status: "pending" },
      { id: "cd4", title: "Prepare creative brief and project roadmap", phase: "1", status: "pending" },
      { id: "cd5", title: "Develop initial creative concepts and design directions", phase: "2", status: "pending" },
      { id: "cd6", title: "Create moodboards and layout wireframes", phase: "2", status: "pending" },
      { id: "cd7", title: "Complete 50% of the required design deliverables", phase: "2", status: "pending" },
      { id: "cd8", title: "Present 50% milestone for client feedback", phase: "2", status: "pending" },
      { id: "cd9", title: "Incorporate feedback and refine design direction", phase: "3", status: "pending" },
      { id: "cd10", title: "Complete the remaining 50% of design deliverables", phase: "3", status: "pending" },
      { id: "cd11", title: "Apply variations and platform-specific adaptations", phase: "3", status: "pending" },
      { id: "cd12", title: "Present 100% completed designs for final approval", phase: "3", status: "pending" },
      { id: "cd13", title: "Perform quality checks on all design files", phase: "4", status: "pending" },
      { id: "cd14", title: "Fix alignment, typography, or visual bugs", phase: "4", status: "pending" },
      { id: "cd15", title: "Export source files in required formats", phase: "4", status: "pending" },
      { id: "cd16", title: "Deliver final assets and complete project handover", phase: "4", status: "pending" }
    ]
  },
  BRANDING_KIT: {
    phases: defaultPhases,
    tasks: [
      { id: "bk1", title: "Request vision docs, existing logos, and audience info", phase: "1", status: "pending" },
      { id: "bk2", title: "Review client proposal and finalize branding scope", phase: "1", status: "pending" },
      { id: "bk3", title: "Research competitors and market positioning", phase: "1", status: "pending" },
      { id: "bk4", title: "Define brand personality and tone strategy", phase: "1", status: "pending" },
      { id: "bk5", title: "Create initial logo concepts and identity directions", phase: "2", status: "pending" },
      { id: "bk6", title: "Define initial color palette and typography", phase: "2", status: "pending" },
      { id: "bk7", title: "Complete 50% of the required brand assets", phase: "2", status: "pending" },
      { id: "bk8", title: "Present 50% milestone for client feedback", phase: "2", status: "pending" },
      { id: "bk9", title: "Finalize logo design and visual variations", phase: "3", status: "pending" },
      { id: "bk10", title: "Complete remaining 50% of brand assets and stationery", phase: "3", status: "pending" },
      { id: "bk11", title: "Develop comprehensive brand guidelines document", phase: "3", status: "pending" },
      { id: "bk12", title: "Present 100% completed branding kit for final approval", phase: "3", status: "pending" },
      { id: "bk13", title: "Perform final review of all assets for consistency", phase: "4", status: "pending" },
      { id: "bk14", title: "Fix any visual errors or missing elements", phase: "4", status: "pending" },
      { id: "bk15", title: "Export all files in vector and raster formats", phase: "4", status: "pending" },
      { id: "bk16", title: "Deliver brand kit and complete project handover", phase: "4", status: "pending" }
    ]
  },
  VIDEO_SERVICE: {
    phases: defaultPhases,
    tasks: [
      { id: "vs1", title: "Request raw footage, scripts, and brand assets", phase: "1", status: "pending" },
      { id: "vs2", title: "Review client proposal and define video format", phase: "1", status: "pending" },
      { id: "vs3", title: "Research creative inspiration and reference videos", phase: "1", status: "pending" },
      { id: "vs4", title: "Prepare storyboard and finalize approval process", phase: "1", status: "pending" },
      { id: "vs5", title: "Organize media assets and set up editing project", phase: "2", status: "pending" },
      { id: "vs6", title: "Create rough cut establishing video structure", phase: "2", status: "pending" },
      { id: "vs7", title: "Complete 50% of the video edits (initial assembly)", phase: "2", status: "pending" },
      { id: "vs8", title: "Present 50% milestone (rough cut) for review", phase: "2", status: "pending" },
      { id: "vs9", title: "Implement feedback and complete remaining 50% of edits", phase: "3", status: "pending" },
      { id: "vs10", title: "Add transitions, motion graphics, and visual effects", phase: "3", status: "pending" },
      { id: "vs11", title: "Perform color grading and audio mixing (100% completion)", phase: "3", status: "pending" },
      { id: "vs12", title: "Present fully edited video for final approval", phase: "3", status: "pending" },
      { id: "vs13", title: "Perform final quality checks on resolution and audio", phase: "4", status: "pending" },
      { id: "vs14", title: "Fix any rendering bugs or subtitle errors", phase: "4", status: "pending" },
      { id: "vs15", title: "Export videos in required formats and aspect ratios", phase: "4", status: "pending" },
      { id: "vs16", title: "Deliver final video files and complete handover", phase: "4", status: "pending" }
    ]
  },
  AI_VIDEO_GENERATION: {
    phases: defaultPhases,
    tasks: [
      { id: "av1", title: "Request scripts, voice preferences, and brand assets", phase: "1", status: "pending" },
      { id: "av2", title: "Review client proposal and define video style", phase: "1", status: "pending" },
      { id: "av3", title: "Create storyboard, shot list, and production plan", phase: "1", status: "pending" },
      { id: "av4", title: "Finalize timeline and deliverables", phase: "1", status: "pending" },
      { id: "av5", title: "Generate AI avatars, characters, or base visuals", phase: "2", status: "pending" },
      { id: "av6", title: "Create AI voice-over and narration assets", phase: "2", status: "pending" },
      { id: "av7", title: "Complete 50% of the video scenes and sequences", phase: "2", status: "pending" },
      { id: "av8", title: "Present 50% milestone for client review", phase: "2", status: "pending" },
      { id: "av9", title: "Generate remaining 50% of AI video sequences", phase: "3", status: "pending" },
      { id: "av10", title: "Assemble full video with transitions and effects", phase: "3", status: "pending" },
      { id: "av11", title: "Add background music and subtitles (100% completion)", phase: "3", status: "pending" },
      { id: "av12", title: "Present fully completed AI video for final approval", phase: "3", status: "pending" },
      { id: "av13", title: "Perform final quality checks on AI lip-sync and visuals", phase: "4", status: "pending" },
      { id: "av14", title: "Fix any rendering bugs or audio glitches", phase: "4", status: "pending" },
      { id: "av15", title: "Export videos in required formats and resolutions", phase: "4", status: "pending" },
      { id: "av16", title: "Deliver final files and complete project handover", phase: "4", status: "pending" }
    ]
  },
  CGI_3D_VFX: {
    phases: defaultPhases,
    tasks: [
      { id: "cgi1", title: "Request reference models, storyboards, and product files", phase: "1", status: "pending" },
      { id: "cgi2", title: "Review client proposal and finalize creative requirements", phase: "1", status: "pending" },
      { id: "cgi3", title: "Research visual inspiration and style references", phase: "1", status: "pending" },
      { id: "cgi4", title: "Create moodboard and finalize animation concept", phase: "1", status: "pending" },
      { id: "cgi5", title: "Create or optimize base 3D models", phase: "2", status: "pending" },
      { id: "cgi6", title: "Apply basic materials, textures, and shaders", phase: "2", status: "pending" },
      { id: "cgi7", title: "Complete 50% of the scene setup and assets", phase: "2", status: "pending" },
      { id: "cgi8", title: "Present 50% milestone (clay renders/blocking) for review", phase: "2", status: "pending" },
      { id: "cgi9", title: "Create full animation sequences and camera movements", phase: "3", status: "pending" },
      { id: "cgi10", title: "Add VFX elements, simulations, and lighting", phase: "3", status: "pending" },
      { id: "cgi11", title: "Complete 100% of rendering for final sequences", phase: "3", status: "pending" },
      { id: "cgi12", title: "Present fully rendered project for final approval", phase: "3", status: "pending" },
      { id: "cgi13", title: "Perform color grading and post-production editing", phase: "4", status: "pending" },
      { id: "cgi14", title: "Fix visual bugs, artifacts, or simulation errors", phase: "4", status: "pending" },
      { id: "cgi15", title: "Export deliverables in required formats", phase: "4", status: "pending" },
      { id: "cgi16", title: "Deliver source files and complete handover", phase: "4", status: "pending" }
    ]
  },
  WRITING_CONTENT: {
    phases: defaultPhases,
    tasks: [
      { id: "wc1", title: "Request tone guidelines, target topics, and brand info", phase: "1", status: "pending" },
      { id: "wc2", title: "Review client proposal and define content strategy", phase: "1", status: "pending" },
      { id: "wc3", title: "Conduct keyword research and content opportunity analysis", phase: "1", status: "pending" },
      { id: "wc4", title: "Prepare content calendar and delivery timeline", phase: "1", status: "pending" },
      { id: "wc5", title: "Create content outlines and briefs", phase: "2", status: "pending" },
      { id: "wc6", title: "Draft 50% of the required articles or copy", phase: "2", status: "pending" },
      { id: "wc7", title: "Incorporate basic SEO keywords and messaging", phase: "2", status: "pending" },
      { id: "wc8", title: "Present 50% milestone for client review and feedback", phase: "2", status: "pending" },
      { id: "wc9", title: "Draft remaining 50% of articles or copy", phase: "3", status: "pending" },
      { id: "wc10", title: "Optimize 100% of content for SEO and engagement", phase: "3", status: "pending" },
      { id: "wc11", title: "Develop supporting elements (headlines, meta descriptions)", phase: "3", status: "pending" },
      { id: "wc12", title: "Present fully completed content for final approval", phase: "3", status: "pending" },
      { id: "wc13", title: "Perform plagiarism checks and quality assurance", phase: "4", status: "pending" },
      { id: "wc14", title: "Fix grammatical errors and apply final revisions", phase: "4", status: "pending" },
      { id: "wc15", title: "Format content according to publishing requirements", phase: "4", status: "pending" },
      { id: "wc16", title: "Deliver final content and complete handover", phase: "4", status: "pending" }
    ]
  },
  CUSTOMER_SUPPORT: {
    phases: defaultPhases,
    tasks: [
      { id: "cs1", title: "Request helpdesk access, FAQs, and macro templates", phase: "1", status: "pending" },
      { id: "cs2", title: "Review client proposal and define support SLAs", phase: "1", status: "pending" },
      { id: "cs3", title: "Define issue categories and escalation workflows", phase: "1", status: "pending" },
      { id: "cs4", title: "Lock tools and communication channels", phase: "1", status: "pending" },
      { id: "cs5", title: "Setup support tools and agent access", phase: "2", status: "pending" },
      { id: "cs6", title: "Prepare 50% of response templates and knowledge base", phase: "2", status: "pending" },
      { id: "cs7", title: "Test basic workflows and routing", phase: "2", status: "pending" },
      { id: "cs8", title: "Present 50% milestone (system setup) for review", phase: "2", status: "pending" },
      { id: "cs9", title: "Complete remaining 50% of templates and knowledge base", phase: "3", status: "pending" },
      { id: "cs10", title: "Handle live customer queries as per SLA", phase: "3", status: "pending" },
      { id: "cs11", title: "Achieve 100% live support integration and readiness", phase: "3", status: "pending" },
      { id: "cs12", title: "Maintain accurate support logs and escalation records", phase: "3", status: "pending" },
      { id: "cs13", title: "Conduct quality review on responses", phase: "4", status: "pending" },
      { id: "cs14", title: "Fix workflow bugs and adjust macro templates", phase: "4", status: "pending" },
      { id: "cs15", title: "Share comprehensive support summary report", phase: "4", status: "pending" },
      { id: "cs16", title: "Highlight recurring issues and complete cycle handover", phase: "4", status: "pending" }
    ]
  },
  INFLUENCER_MARKETING: {
    phases: defaultPhases,
    tasks: [
      { id: "im1", title: "Request brand guidelines, product samples, and goals", phase: "1", status: "pending" },
      { id: "im2", title: "Review client proposal and decide influencer type", phase: "1", status: "pending" },
      { id: "im3", title: "Define content format and campaign budget", phase: "1", status: "pending" },
      { id: "im4", title: "Share campaign brief and timeline", phase: "1", status: "pending" },
      { id: "im5", title: "Shortlist potential influencers for the campaign", phase: "2", status: "pending" },
      { id: "im6", title: "Perform initial outreach and negotiation", phase: "2", status: "pending" },
      { id: "im7", title: "Onboard 50% of the target creators", phase: "2", status: "pending" },
      { id: "im8", title: "Present 50% milestone (creator list) for review", phase: "2", status: "pending" },
      { id: "im9", title: "Onboard remaining 50% of creators (100% completion)", phase: "3", status: "pending" },
      { id: "im10", title: "Coordinate content creation with all influencers", phase: "3", status: "pending" },
      { id: "im11", title: "Ensure 100% of content is posted as planned", phase: "3", status: "pending" },
      { id: "im12", title: "Track links, promo codes, and initial performance", phase: "3", status: "pending" },
      { id: "im13", title: "Analyze reach, engagement, and ROI metrics", phase: "4", status: "pending" },
      { id: "im14", title: "Fix any tracking link errors or missing posts", phase: "4", status: "pending" },
      { id: "im15", title: "Prepare comprehensive campaign report", phase: "4", status: "pending" },
      { id: "im16", title: "Deliver report and close campaign cycle", phase: "4", status: "pending" }
    ]
  },
  UGC_MARKETING: {
    phases: defaultPhases,
    tasks: [
      { id: "ugc1", title: "Request product details, shipping info, and requirements", phase: "1", status: "pending" },
      { id: "ugc2", title: "Review client proposal and brand goals", phase: "1", status: "pending" },
      { id: "ugc3", title: "Decide number and format of UGC required", phase: "1", status: "pending" },
      { id: "ugc4", title: "Share UGC brief and content checklist", phase: "1", status: "pending" },
      { id: "ugc5", title: "Match brand with suitable creators", phase: "2", status: "pending" },
      { id: "ugc6", title: "Align creators on messaging and script", phase: "2", status: "pending" },
      { id: "ugc7", title: "Receive and approve 50% of the UGC content", phase: "2", status: "pending" },
      { id: "ugc8", title: "Present 50% milestone for client feedback", phase: "2", status: "pending" },
      { id: "ugc9", title: "Receive remaining 50% of the UGC content", phase: "3", status: "pending" },
      { id: "ugc10", title: "Ensure 100% of assets meet brand guidelines", phase: "3", status: "pending" },
      { id: "ugc11", title: "Organize raw and edited files securely", phase: "3", status: "pending" },
      { id: "ugc12", title: "Present 100% of UGC assets for final approval", phase: "3", status: "pending" },
      { id: "ugc13", title: "Review content for audio/video quality", phase: "4", status: "pending" },
      { id: "ugc14", title: "Apply minor edits or request fixes from creators", phase: "4", status: "pending" },
      { id: "ugc15", title: "Export deliverables in requested formats", phase: "4", status: "pending" },
      { id: "ugc16", title: "Deliver all UGC assets and complete handover", phase: "4", status: "pending" }
    ]
  },
  CRM_ERP: {
    phases: defaultPhases,
    tasks: [
      { id: "erp1", title: "Request server access, workflow docs, and data exports", phase: "1", status: "pending" },
      { id: "erp2", title: "Review client proposal and identify required modules", phase: "1", status: "pending" },
      { id: "erp3", title: "Document business processes and system requirements", phase: "1", status: "pending" },
      { id: "erp4", title: "Finalize project scope and delivery timeline", phase: "1", status: "pending" },
      { id: "erp5", title: "Design system architecture and database structure", phase: "2", status: "pending" },
      { id: "erp6", title: "Develop core user roles and authentication systems", phase: "2", status: "pending" },
      { id: "erp7", title: "Develop 50% of the required CRM/ERP modules", phase: "2", status: "pending" },
      { id: "erp8", title: "Present 50% milestone (initial modules) for review", phase: "2", status: "pending" },
      { id: "erp9", title: "Develop remaining 50% of CRM/ERP modules", phase: "3", status: "pending" },
      { id: "erp10", title: "Integrate third-party APIs and payment gateways", phase: "3", status: "pending" },
      { id: "erp11", title: "Implement dashboards and reports (100% completion)", phase: "3", status: "pending" },
      { id: "erp12", title: "Present fully functional system for final approval", phase: "3", status: "pending" },
      { id: "erp13", title: "Conduct user acceptance testing (UAT)", phase: "4", status: "pending" },
      { id: "erp14", title: "Fix functional bugs and optimize performance", phase: "4", status: "pending" },
      { id: "erp15", title: "Deploy solution and migrate existing data", phase: "4", status: "pending" },
      { id: "erp16", title: "Provide admin access, documentation, and handover", phase: "4", status: "pending" }
    ]
  },
  AI_AUTOMATION: {
    phases: defaultPhases,
    tasks: [
      { id: "ai1", title: "Request API keys, Zapier/Make access, and workflow docs", phase: "1", status: "pending" },
      { id: "ai2", title: "Review client proposal and automation requirements", phase: "1", status: "pending" },
      { id: "ai3", title: "Document workflow logic, triggers, and outcomes", phase: "1", status: "pending" },
      { id: "ai4", title: "Finalize project scope and integration list", phase: "1", status: "pending" },
      { id: "ai5", title: "Design automation architecture and workflow diagrams", phase: "2", status: "pending" },
      { id: "ai6", title: "Configure base automation platform (Make, Zapier, etc.)", phase: "2", status: "pending" },
      { id: "ai7", title: "Build 50% of the automation logic and workflows", phase: "2", status: "pending" },
      { id: "ai8", title: "Present 50% milestone (initial workflows) for review", phase: "2", status: "pending" },
      { id: "ai9", title: "Build remaining 50% of automation logic", phase: "3", status: "pending" },
      { id: "ai10", title: "Integrate complex third-party APIs and AI models", phase: "3", status: "pending" },
      { id: "ai11", title: "Complete 100% of the required automations", phase: "3", status: "pending" },
      { id: "ai12", title: "Perform end-to-end testing of data flow", phase: "3", status: "pending" },
      { id: "ai13", title: "Implement error handling and failure recovery", phase: "4", status: "pending" },
      { id: "ai14", title: "Fix any API bugs or mapping errors", phase: "4", status: "pending" },
      { id: "ai15", title: "Deploy automation workflows to production", phase: "4", status: "pending" },
      { id: "ai16", title: "Deliver documentation and complete handover", phase: "4", status: "pending" }
    ]
  },
  WHATSAPP_CHATBOT: {
    phases: defaultPhases,
    tasks: [
      { id: "wc1", title: "Request Meta Business access, API keys, and scripts", phase: "1", status: "pending" },
      { id: "wc2", title: "Review client proposal and bot purpose", phase: "1", status: "pending" },
      { id: "wc3", title: "Decide conversation flow and integrations", phase: "1", status: "pending" },
      { id: "wc4", title: "Share flow chart and script for approval", phase: "1", status: "pending" },
      { id: "wc5", title: "Set up bot architecture and platform connections", phase: "2", status: "pending" },
      { id: "wc6", title: "Build basic bot flow and welcome sequences", phase: "2", status: "pending" },
      { id: "wc7", title: "Complete 50% of the conversation workflows", phase: "2", status: "pending" },
      { id: "wc8", title: "Present 50% milestone (test bot) for review", phase: "2", status: "pending" },
      { id: "wc9", title: "Build remaining 50% of conversation flows", phase: "3", status: "pending" },
      { id: "wc10", title: "Implement complex backend integrations", phase: "3", status: "pending" },
      { id: "wc11", title: "Complete 100% of bot logic and features", phase: "3", status: "pending" },
      { id: "wc12", title: "Test conversation logic end-to-end", phase: "3", status: "pending" },
      { id: "wc13", title: "Review bot logs and edge cases", phase: "4", status: "pending" },
      { id: "wc14", title: "Fix response bugs and routing errors", phase: "4", status: "pending" },
      { id: "wc15", title: "Deploy bot to live WhatsApp number", phase: "4", status: "pending" },
      { id: "wc16", title: "Share access, instructions, and complete handover", phase: "4", status: "pending" }
    ]
  },
  AI_VOICE_AGENT: {
    phases: defaultPhases,
    tasks: [
      { id: "va1", title: "Request telephony access, scripts, and knowledge base", phase: "1", status: "pending" },
      { id: "va2", title: "Review client proposal and voice agent goals", phase: "1", status: "pending" },
      { id: "va3", title: "Design conversation architecture and call routing", phase: "1", status: "pending" },
      { id: "va4", title: "Finalize voice model and prompt logic", phase: "1", status: "pending" },
      { id: "va5", title: "Configure AI voice platform and infrastructure", phase: "2", status: "pending" },
      { id: "va6", title: "Set up base voice models and prompt logic", phase: "2", status: "pending" },
      { id: "va7", title: "Implement 50% of the required call flows", phase: "2", status: "pending" },
      { id: "va8", title: "Present 50% milestone (demo call) for review", phase: "2", status: "pending" },
      { id: "va9", title: "Implement remaining 50% of call flows", phase: "3", status: "pending" },
      { id: "va10", title: "Integrate CRM, calendars, and third-party systems", phase: "3", status: "pending" },
      { id: "va11", title: "Achieve 100% completion of agent logic", phase: "3", status: "pending" },
      { id: "va12", title: "Perform end-to-end call flow testing", phase: "3", status: "pending" },
      { id: "va13", title: "Review call recordings for quality and accuracy", phase: "4", status: "pending" },
      { id: "va14", title: "Fix latency issues, bugs, and prompt errors", phase: "4", status: "pending" },
      { id: "va15", title: "Deploy the AI voice agent to production", phase: "4", status: "pending" },
      { id: "va16", title: "Provide access credentials and complete handover", phase: "4", status: "pending" }
    ]
  }
};

export const getSopFromTitle = (title) => {
  if (!title) return SOP_TEMPLATES.WEBSITE;
  const t = title.toLowerCase().replace(/[_\-]/g, " ");

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
