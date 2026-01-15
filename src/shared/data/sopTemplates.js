export const SOP_TEMPLATES = {
  WEBSITE: {
    phases: [
      { id: "1", name: "Website Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Website Design Direction", status: "pending", progress: 0 },
      { id: "3", name: "Website Build & Completion", status: "pending", progress: 0 },
      { id: "4", name: "Website Go‑Live & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "1", title: "Understand business and website goal", phase: "1", status: "pending" },
      { id: "2", title: "Decide website type", phase: "1", status: "pending" },
      { id: "3", title: "Finalise pages and features", phase: "1", status: "pending" },
      { id: "4", title: "Decide content responsibility", phase: "1", status: "pending" },
      { id: "5", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "6", title: "Create and share reference (Google Sheet / wireframe / temp site link)", phase: "1", status: "pending" },
      // Stage 2
      { id: "7", title: "Decide visual style", phase: "2", status: "pending" },
      { id: "8", title: "Design homepage", phase: "2", status: "pending" },
      { id: "9", title: "Design inner pages", phase: "2", status: "pending" },
      { id: "10", title: "Ensure mobile layout", phase: "2", status: "pending" },
      { id: "11", title: "Align design direction", phase: "2", status: "pending" },
      // Stage 3
      { id: "12", title: "Develop frontend", phase: "3", status: "pending" },
      { id: "13", title: "Setup backend / CMS", phase: "3", status: "pending" },
      { id: "14", title: "Add content", phase: "3", status: "pending" },
      { id: "15", title: "Setup forms & integrations", phase: "3", status: "pending" },
      { id: "16", title: "Fix approved design changes", phase: "3", status: "pending" },
      // Stage 4
      { id: "17", title: "Test on devices & browsers", phase: "4", status: "pending" },
      { id: "18", title: "Fix bugs", phase: "4", status: "pending" },
      { id: "19", title: "Make website live", phase: "4", status: "pending" },
      { id: "20", title: "Share access and close task", phase: "4", status: "pending" }
    ]
  },
  APP: {
    phases: [
      { id: "1", name: "App Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "App UI Direction", status: "pending", progress: 0 },
      { id: "3", name: "App Development & Completion", status: "pending", progress: 0 },
      { id: "4", name: "App Launch & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "a1", title: "App Launch & Handover", phase: "1", status: "pending" },
      { id: "a2", title: "Finalise MVP features", phase: "1", status: "pending" },
      { id: "a3", title: "Decide platform (Android / iOS)", phase: "1", status: "pending" },
      { id: "a4", title: "Decide backend & admin needs", phase: "1", status: "pending" },
      { id: "a5", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "a6", title: "Share feature list + user flow / wireframe link", phase: "1", status: "pending" },
      // Stage 2
      { id: "a7", title: "Create wireframes", phase: "2", status: "pending" },
      { id: "a8", title: "Design app screens", phase: "2", status: "pending" },
      { id: "a9", title: "Create clickable prototype", phase: "2", status: "pending" },
      { id: "a10", title: "Lock UI/UX direction", phase: "2", status: "pending" },
      // Stage 3
      { id: "a11", title: "Develop app frontend", phase: "3", status: "pending" },
      { id: "a12", title: "Setup backend & APIs", phase: "3", status: "pending" },
      { id: "a13", title: "Setup admin panel", phase: "3", status: "pending" },
      { id: "a14", title: "Fix bugs and flow issues", phase: "3", status: "pending" },
      // Stage 4
      { id: "a15", title: "Prepare store assets", phase: "4", status: "pending" },
      { id: "a16", title: "Upload app to store", phase: "4", status: "pending" },
      { id: "a17", title: "Publish app", phase: "4", status: "pending" },
      { id: "a18", title: "Share links and credentials", phase: "4", status: "pending" }
    ]
  },
  SOFTWARE: {
    phases: [
      { id: "1", name: "Requirement & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "System Direction Setup", status: "pending", progress: 0 },
      { id: "3", name: "Full Development & Completion", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Handover", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "s1", title: "Understand business workflow", phase: "1", status: "pending" },
      { id: "s2", title: "Finalise modules and features", phase: "1", status: "pending" },
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
      { id: "s12", title: "Setup role‑based access", phase: "3", status: "pending" },
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
      { id: "1", name: "SEO Planning & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "On‑Page SEO Execution", status: "pending", progress: 0 },
      { id: "3", name: "Off‑Page SEO Execution", status: "pending", progress: 0 },
      { id: "4", name: "SEO Reporting & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "seo1", title: "Understand SEO goal", phase: "1", status: "pending" },
      { id: "seo2", title: "Audit website", phase: "1", status: "pending" },
      { id: "seo3", title: "Research keywords", phase: "1", status: "pending" },
      { id: "seo4", title: "Finalise SEO plan", phase: "1", status: "pending" },
      { id: "seo5", title: "Share audit + keyword mapping sheet", phase: "1", status: "pending" },
      // Stage 2
      { id: "seo6", title: "Fix technical issues", phase: "2", status: "pending" },
      { id: "seo7", title: "Optimise pages", phase: "2", status: "pending" },
      { id: "seo8", title: "Optimise content", phase: "2", status: "pending" },
      { id: "seo9", title: "Improve internal linking", phase: "2", status: "pending" },
      // Stage 3
      { id: "seo10", title: "Plan backlinks", phase: "3", status: "pending" },
      { id: "seo11", title: "Do outreach", phase: "3", status: "pending" },
      { id: "seo12", title: "Build links", phase: "3", status: "pending" },
      { id: "seo13", title: "Monitor link quality", phase: "3", status: "pending" },
      // Stage 4
      { id: "seo14", title: "Track rankings", phase: "4", status: "pending" },
      { id: "seo15", title: "Track traffic", phase: "4", status: "pending" },
      { id: "seo16", title: "Prepare report", phase: "4", status: "pending" },
      { id: "seo17", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  PERFORMANCE_MARKETING: {
    phases: [
      { id: "1", name: "Campaign Planning & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Ad Setup Direction", status: "pending", progress: 0 },
      { id: "3", name: "Campaign Execution & Optimisation", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Wrap‑Up", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "pm1", title: "Define campaign goal", phase: "1", status: "pending" },
      { id: "pm2", title: "Define target audience", phase: "1", status: "pending" },
      { id: "pm3", title: "Decide funnel", phase: "1", status: "pending" },
      { id: "pm4", title: "Lock budget", phase: "1", status: "pending" },
      { id: "pm5", title: "Share campaign plan sheet / funnel reference", phase: "1", status: "pending" },
      // Stage 2
      { id: "pm6", title: "Create ad copies", phase: "2", status: "pending" },
      { id: "pm7", title: "Create creatives", phase: "2", status: "pending" },
      { id: "pm8", title: "Setup tracking", phase: "2", status: "pending" },
      { id: "pm9", title: "Prepare campaigns", phase: "2", status: "pending" },
      // Stage 3
      { id: "pm10", title: "Launch ads", phase: "3", status: "pending" },
      { id: "pm11", title: "Test audiences", phase: "3", status: "pending" },
      { id: "pm12", title: "Optimise creatives", phase: "3", status: "pending" },
      { id: "pm13", title: "Control spend", phase: "3", status: "pending" },
      // Stage 4
      { id: "pm14", title: "Analyse performance", phase: "4", status: "pending" },
      { id: "pm15", title: "Prepare insights", phase: "4", status: "pending" },
      { id: "pm16", title: "Share final report", phase: "4", status: "pending" },
      { id: "pm17", title: "Close campaign", phase: "4", status: "pending" }
    ]
  },
  LEAD_GENERATION: {
    phases: [
      { id: "1", name: "Lead Strategy & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Funnel Setup", status: "pending", progress: 0 },
      { id: "3", name: "Lead Execution", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure", status: "pending", progress: 0 }
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
      { id: "lg12", title: "Optimise flow", phase: "3", status: "pending" },
      { id: "lg13", title: "Maintain data", phase: "3", status: "pending" },
      // Stage 4
      { id: "lg14", title: "Analyse leads", phase: "4", status: "pending" },
      { id: "lg15", title: "Prepare report", phase: "4", status: "pending" },
      { id: "lg16", title: "Share insights", phase: "4", status: "pending" },
      { id: "lg17", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  SOCIAL_MEDIA_MANAGEMENT: {
    phases: [
      { id: "1", name: "Content Strategy & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Content Direction", status: "pending", progress: 0 },
      { id: "3", name: "Publishing & Management", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "sm1", title: "Understand brand goal", phase: "1", status: "pending" },
      { id: "sm2", title: "Decide platforms", phase: "1", status: "pending" },
      { id: "sm3", title: "Decide posting frequency", phase: "1", status: "pending" },
      { id: "sm4", title: "Plan content themes", phase: "1", status: "pending" },
      { id: "sm5", title: "Share content calendar / drive folder link", phase: "1", status: "pending" },
      // Stage 2
      { id: "sm6", title: "Create post & reel previews", phase: "2", status: "pending" },
      { id: "sm7", title: "Write captions", phase: "2", status: "pending" },
      { id: "sm8", title: "Finalise hashtags", phase: "2", status: "pending" },
      { id: "sm9", title: "Lock content direction", phase: "2", status: "pending" },
      // Stage 3
      { id: "sm10", title: "Schedule posts", phase: "3", status: "pending" },
      { id: "sm11", title: "Publish content", phase: "3", status: "pending" },
      { id: "sm12", title: "Handle basic engagement", phase: "3", status: "pending" },
      { id: "sm13", title: "Monitor performance", phase: "3", status: "pending" },
      // Stage 4
      { id: "sm14", title: "Analyse reach and engagement", phase: "4", status: "pending" },
      { id: "sm15", title: "Prepare report", phase: "4", status: "pending" },
      { id: "sm16", title: "Share insights", phase: "4", status: "pending" },
      { id: "sm17", title: "Close cycle", phase: "4", status: "pending" }
    ]
  },
  CREATIVE_DESIGN: {
    phases: [
      { id: "1", name: "Design Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Design Direction", status: "pending", progress: 0 },
      { id: "3", name: "Design Completion", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "cd1", title: "Understand design purpose (brand, ads, social, UI assets)", phase: "1", status: "pending" },
      { id: "cd2", title: "Finalise design types and quantity", phase: "1", status: "pending" },
      { id: "cd3", title: "Decide brand guidelines or references", phase: "1", status: "pending" },
      { id: "cd4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "cd5", title: "Share reference link (brand kit / moodboard / sample links / Google Doc)", phase: "1", status: "pending" },
      // Stage 2
      { id: "cd6", title: "Create initial design concepts", phase: "2", status: "pending" },
      { id: "cd7", title: "Align on layout, colors, style", phase: "2", status: "pending" },
      { id: "cd8", title: "Finalise visual direction", phase: "2", status: "pending" },
      // Stage 3
      { id: "cd9", title: "Create all final designs", phase: "3", status: "pending" },
      { id: "cd10", title: "Apply approved changes", phase: "3", status: "pending" },
      { id: "cd11", title: "Do quality check", phase: "3", status: "pending" },
      // Stage 4
      { id: "cd12", title: "Export final files", phase: "4", status: "pending" },
      { id: "cd13", title: "Share all assets", phase: "4", status: "pending" },
      { id: "cd14", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  VIDEO_SERVICE: {
    phases: [
      { id: "1", name: "Video Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Video Direction", status: "pending", progress: 0 },
      { id: "3", name: "Final Video Creation", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "vs1", title: "Understand video goal (ad, brand, reel, explainer)", phase: "1", status: "pending" },
      { id: "vs2", title: "Decide format, duration, platform", phase: "1", status: "pending" },
      { id: "vs3", title: "Finalise style and references", phase: "1", status: "pending" },
      { id: "vs4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "vs5", title: "Share concept doc / script / reference video / storyboard link", phase: "1", status: "pending" },
      // Stage 2
      { id: "vs6", title: "Create rough cut / sample frames", phase: "2", status: "pending" },
      { id: "vs7", title: "Align on pacing, style, transitions", phase: "2", status: "pending" },
      // Stage 3
      { id: "vs8", title: "Create final video", phase: "3", status: "pending" },
      { id: "vs9", title: "Apply changes", phase: "3", status: "pending" },
      { id: "vs10", title: "Final render & quality check", phase: "3", status: "pending" },
      // Stage 4
      { id: "vs11", title: "Export platform‑specific formats", phase: "4", status: "pending" },
      { id: "vs12", title: "Share files", phase: "4", status: "pending" },
      { id: "vs13", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  WRITING_CONTENT: {
    phases: [
      { id: "1", name: "Content Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Content Direction", status: "pending", progress: 0 },
      { id: "3", name: "Content Completion", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "wc1", title: "Understand content goal (SEO, sales, branding)", phase: "1", status: "pending" },
      { id: "wc2", title: "Finalise content type and quantity", phase: "1", status: "pending" },
      { id: "wc3", title: "Decide tone and audience", phase: "1", status: "pending" },
      { id: "wc4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "wc5", title: "Share content outline / keyword doc / sample references", phase: "1", status: "pending" },
      // Stage 2
      { id: "wc6", title: "Write initial drafts", phase: "2", status: "pending" },
      { id: "wc7", title: "Align on tone, structure, messaging", phase: "2", status: "pending" },
      // Stage 3
      { id: "wc8", title: "Finalise all content", phase: "3", status: "pending" },
      { id: "wc9", title: "Apply edits", phase: "3", status: "pending" },
      { id: "wc10", title: "Proofread", phase: "3", status: "pending" },
      // Stage 4
      { id: "wc11", title: "Share final content files", phase: "4", status: "pending" },
      { id: "wc12", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  CUSTOMER_SUPPORT: {
    phases: [
      { id: "1", name: "Support Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Support Setup", status: "pending", progress: 0 },
      { id: "3", name: "Live Support Execution", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure", status: "pending", progress: 0 }
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
      { id: "1", name: "Campaign Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Influencer Direction", status: "pending", progress: 0 },
      { id: "3", name: "Campaign Execution", status: "pending", progress: 0 },
      { id: "4", name: "Reporting & Closure", status: "pending", progress: 0 }
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
      { id: "im12", title: "Analyse reach and engagement", phase: "4", status: "pending" },
      { id: "im13", title: "Share campaign report", phase: "4", status: "pending" },
      { id: "im14", title: "Close campaign", phase: "4", status: "pending" }
    ]
  },
  UGC_MARKETING: {
    phases: [
      { id: "1", name: "UGC Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Content Direction", status: "pending", progress: 0 },
      { id: "3", name: "Content Creation", status: "pending", progress: 0 },
      { id: "4", name: "Delivery & Closure", status: "pending", progress: 0 }
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
      { id: "1", name: "System Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "System Direction", status: "pending", progress: 0 },
      { id: "3", name: "System Implementation", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "erp1", title: "Understand business process", phase: "1", status: "pending" },
      { id: "erp2", title: "Define modules and users", phase: "1", status: "pending" },
      { id: "erp3", title: "Decide integrations", phase: "1", status: "pending" },
      { id: "erp4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "erp5", title: "Share workflow doc / module list / sample system reference", phase: "1", status: "pending" },
      // Stage 2
      { id: "erp6", title: "Setup basic system structure", phase: "2", status: "pending" },
      { id: "erp7", title: "Configure sample module", phase: "2", status: "pending" },
      { id: "erp8", title: "Align on workflow", phase: "2", status: "pending" },
      // Stage 3
      { id: "erp9", title: "Configure all modules", phase: "3", status: "pending" },
      { id: "erp10", title: "Setup users and permissions", phase: "3", status: "pending" },
      { id: "erp11", title: "Test workflows", phase: "3", status: "pending" },
      // Stage 4
      { id: "erp12", title: "Deploy system", phase: "4", status: "pending" },
      { id: "erp13", title: "Share access and basic documentation", phase: "4", status: "pending" },
      { id: "erp14", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  AI_AUTOMATION: {
    phases: [
      { id: "1", name: "Automation Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Automation Direction", status: "pending", progress: 0 },
      { id: "3", name: "Automation Completion", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "ai1", title: "Understand automation goal", phase: "1", status: "pending" },
      { id: "ai2", title: "Define triggers and actions", phase: "1", status: "pending" },
      { id: "ai3", title: "Decide tools and integrations", phase: "1", status: "pending" },
      { id: "ai4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "ai5", title: "Share automation flow diagram / logic doc", phase: "1", status: "pending" },
      // Stage 2
      { id: "ai6", title: "Build basic automation flow", phase: "2", status: "pending" },
      { id: "ai7", title: "Test logic", phase: "2", status: "pending" },
      // Stage 3
      { id: "ai8", title: "Implement full automation", phase: "3", status: "pending" },
      { id: "ai9", title: "Fix errors", phase: "3", status: "pending" },
      { id: "ai10", title: "Stress test", phase: "3", status: "pending" },
      // Stage 4
      { id: "ai11", title: "Deploy automation", phase: "4", status: "pending" },
      { id: "ai12", title: "Share access / usage notes", phase: "4", status: "pending" },
      { id: "ai13", title: "Close task", phase: "4", status: "pending" }
    ]
  },
  WHATSAPP_CHATBOT: {
    phases: [
      { id: "1", name: "Bot Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Bot Direction", status: "pending", progress: 0 },
      { id: "3", name: "Bot Completion", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Closure", status: "pending", progress: 0 }
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
      { id: "1", name: "Voice Agent Scope & Reference Lock", status: "in-progress", progress: 0 },
      { id: "2", name: "Voice Direction", status: "pending", progress: 0 },
      { id: "3", name: "Voice Agent Completion", status: "pending", progress: 0 },
      { id: "4", name: "Deployment & Closure", status: "pending", progress: 0 }
    ],
    tasks: [
      // Stage 1
      { id: "va1", title: "Understand call purpose", phase: "1", status: "pending" },
      { id: "va2", title: "Decide scripts and intent", phase: "1", status: "pending" },
      { id: "va3", title: "Decide integrations", phase: "1", status: "pending" },
      { id: "va4", title: "Lock timeline", phase: "1", status: "pending" },
      { id: "va5", title: "Share call flow / script / voice reference link", phase: "1", status: "pending" },
      // Stage 2
      { id: "va6", title: "Build sample voice flow", phase: "2", status: "pending" },
      { id: "va7", title: "Test call responses", phase: "2", status: "pending" },
      // Stage 3
      { id: "va8", title: "Implement full logic", phase: "3", status: "pending" },
      { id: "va9", title: "Fix recognition and responses", phase: "3", status: "pending" },
      { id: "va10", title: "Final testing", phase: "3", status: "pending" },
      // Stage 4
      { id: "va11", title: "Deploy voice agent", phase: "4", status: "pending" },
      { id: "va12", title: "Share access and usage guide", phase: "4", status: "pending" },
      { id: "va13", title: "Close task", phase: "4", status: "pending" }
    ]
  }
};

export const getSopFromTitle = (title) => {
  if (!title) return SOP_TEMPLATES.WEBSITE;
  const t = title.toLowerCase();

  // Mapping logic
  if (t.includes("app development") || t.includes("mobile app")) return SOP_TEMPLATES.APP;
  if (t.includes("software") || t.includes("platform") || t.includes("saas")) return SOP_TEMPLATES.SOFTWARE;
  if (t.includes("seo") || t.includes("search engine")) return SOP_TEMPLATES.SEO;
  if (t.includes("performance marketing") || t.includes("ads") || t.includes("ppc")) return SOP_TEMPLATES.PERFORMANCE_MARKETING;
  if (t.includes("lead generation") || t.includes("lead gen")) return SOP_TEMPLATES.LEAD_GENERATION;
  if (t.includes("social media") || t.includes("smo") || t.includes("instagram") || t.includes("facebook") || t.includes("linkedin")) return SOP_TEMPLATES.SOCIAL_MEDIA_MANAGEMENT;
  if (t.includes("creative") || t.includes("design") || t.includes("logo") || t.includes("branding")) return SOP_TEMPLATES.CREATIVE_DESIGN;
  if (t.includes("video") || t.includes("reel") || t.includes("editing")) return SOP_TEMPLATES.VIDEO_SERVICE;
  if (t.includes("content") || t.includes("writing") || t.includes("blog")) return SOP_TEMPLATES.WRITING_CONTENT;
  if (t.includes("support") || t.includes("customer service")) return SOP_TEMPLATES.CUSTOMER_SUPPORT;
  if (t.includes("influencer")) return SOP_TEMPLATES.INFLUENCER_MARKETING;
  if (t.includes("ugc")) return SOP_TEMPLATES.UGC_MARKETING;
  if (t.includes("crm") || t.includes("erp") || t.includes("system")) return SOP_TEMPLATES.CRM_ERP;
  if (t.includes("agent") || (t.includes("automation") && !t.includes("voice"))) return SOP_TEMPLATES.AI_AUTOMATION;
  if (t.includes("whatsapp") || t.includes("chatbot")) return SOP_TEMPLATES.WHATSAPP_CHATBOT;
  if (t.includes("voice agent") || t.includes("voice call")) return SOP_TEMPLATES.AI_VOICE_AGENT;

  // Default
  return SOP_TEMPLATES.WEBSITE;
};
