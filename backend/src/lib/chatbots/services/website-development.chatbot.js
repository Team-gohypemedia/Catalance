export const service = "Website Development";
export const openingMessage = "Hi! I see you're interested in Website Development. What's your name? Let's get started.";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you",
      "who are you"
    ],
    "templates": [
      "Hi! I see you're interested in Website Development. What's your name? Let's get started."
    ],
    "suggestions": null,
    "required": true
  },
  {
    "key": "website_requirement",
    "patterns": [
      "requirement",
      "new website",
      "revamp",
      "revamping",
      "existing website"
    ],
    "templates": [
      "What best describes your website requirement?"
    ],
    "suggestions": [
      "New website",
      "Revamping existing website"
    ],
    "required": true
  },
  {
    "key": "primary_objective",
    "patterns": [
      "objective",
      "goal",
      "purpose"
    ],
    "templates": [
      "What is the primary objective of your website?"
    ],
    "suggestions": [
      "Generating leads",
      "Selling products or services online",
      "Building brand credibility",
      "Showcasing work or portfolio"
    ],
    "required": true
  },
  {
    "key": "design_experience",
    "patterns": [
      "design",
      "style",
      "ui",
      "experience"
    ],
    "templates": [
      "What type of design experience are you looking for?"
    ],
    "suggestions": [
      "Clean and simple design",
      "Premium and modern UI",
      "Interactive or 3D-based design"
    ],
    "required": true
  },
  {
    "key": "website_type",
    "patterns": [
      "website type",
      "platform",
      "coded",
      "custom",
      "cms",
      "no-code"
    ],
    "templates": [
      "What type of website do you need?"
    ],
    "suggestions": [
      "Platform-based website (No-code / CMS)",
      "Coded website (Custom development)"
    ],
    "required": true
  },
  {
    "key": "platform_preference",
    "patterns": [
      "platform",
      "cms",
      "builder",
      "wordpress",
      "webflow",
      "wix",
      "shopify",
      "squarespace",
      "framer",
      "bubble",
      "zoho",
      "google sites",
      "magento"
    ],
    "templates": [
      "If Platform-based website is selected, choose preferred platform(s):"
    ],
    "suggestions": [
      "WordPress",
      "Webflow",
      "Wix",
      "Shopify",
      "Squarespace",
      "Framer",
      "Bubble",
      "Zoho Sites",
      "Google Sites",
      "Magento (Adobe Commerce)",
      "Other: ________"
    ],
    "multiSelect": true,
    "required": true
  },
  {
    "key": "tech_stack",
    "patterns": [
      "tech",
      "stack",
      "framework",
      "react",
      "next",
      "vue",
      "angular",
      "html"
    ],
    "templates": [
      "If Coded website is selected, choose preferred tech stack/technology:"
    ],
    "suggestions": [
      "HTML, CSS, JavaScript (Static)",
      "React.js",
      "Next.js",
      "Vue.js / Nuxt.js",
      "Angular"
    ],
    "multiSelect": true,
    "required": true
  },
  {
    "key": "backend",
    "patterns": [
      "backend",
      "server",
      "api"
    ],
    "templates": [
      "Backend (if needed):"
    ],
    "suggestions": [
      "Node.js (Express)",
      "Python (Django / Flask / FastAPI)",
      "PHP (Laravel)",
      "Java (Spring Boot)",
      ".NET"
    ],
    "multiSelect": true,
    "required": true
  },
  {
    "key": "database",
    "patterns": [
      "database",
      "db"
    ],
    "templates": [
      "Database (if needed):"
    ],
    "suggestions": [
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Firebase",
      "Supabase"
    ],
    "multiSelect": true,
    "required": true
  },
  {
    "key": "ecommerce",
    "patterns": [
      "ecommerce",
      "e-commerce",
      "shop",
      "store",
      "checkout",
      "payment",
      "woocommerce"
    ],
    "templates": [
      "E-commerce (if needed):"
    ],
    "suggestions": [
      "Custom eCommerce",
      "Stripe / Razorpay integration",
      "WooCommerce (if hybrid)"
    ],
    "multiSelect": true,
    "required": true
  },
  {
    "key": "additional_pages",
    "patterns": [
      "pages",
      "sections",
      "features"
    ],
    "templates": [
      "Every website includes: Home, About, Contact, Privacy Policy & Terms. What additional pages do you need? (Select all that apply)"
    ],
    "suggestions": [
      "Services",
      "Products",
      "Portfolio/Gallery",
      "Testimonials",
      "Blog",
      "FAQ",
      "Pricing",
      "Shop/Store",
      "Cart/Checkout",
      "Wishlist",
      "Order Tracking",
      "Reviews/Ratings",
      "Search",
      "Book Now",
      "Account/Login",
      "Admin Dashboard",
      "User Dashboard",
      "Analytics Dashboard",
      "Notifications",
      "Chat/Support Widget",
      "Help/Support",
      "Resources",
      "Events",
      "3D Animations",
      "3D Model Viewer",
      "None"
    ],
    "multiSelect": true,
    "required": true
  },
  {
    "key": "content_status",
    "patterns": [
      "content",
      "copy",
      "assets"
    ],
    "templates": [
      "What is the status of your website content?"
    ],
    "suggestions": [
      "All content is ready",
      "Content needs to be created"
    ],
    "required": true
  },
  {
    "key": "references",
    "patterns": [
      "references",
      "examples",
      "inspirations"
    ],
    "templates": [
      "Do you have any reference websites you like?"
    ],
    "suggestions": [
      "Yes - ________",
      "No"
    ],
    "required": true
  },
  {
    "key": "launch_timeline",
    "patterns": [
      "timeline",
      "launch",
      "deadline",
      "when"
    ],
    "templates": [
      "When would you like to launch the website?"
    ],
    "suggestions": [
      "Within 2-4 weeks",
      "Within 1-2 months",
      "The timeline is flexible"
    ],
    "expectedType": "timeline_text",
    "required": true
  },
  {
    "key": "budget_range",
    "patterns": [
      "budget",
      "cost",
      "price",
      "range"
    ],
    "templates": [
      "What budget range are you comfortable with for this project?"
    ],
    "suggestions": [
      "Under INR 25,000 (Basic website)",
      "INR 25,000 - 50,000 (Standard website)",
      "INR 50,000 - 1,00,000 (Advanced website)",
      "INR 1,00,000 - 2,50,000 (Custom / dynamic website)",
      "INR 2,50,000 and above (High-end, scalable platform)"
    ],
    "expectedType": "budget_text",
    "required": true
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;


