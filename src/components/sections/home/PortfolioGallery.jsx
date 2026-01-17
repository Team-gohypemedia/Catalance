import React from "react";
import { useTheme } from "@/components/providers/theme-provider";

// Portfolio items with placeholder images (use real images in production)
const portfolioItems = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=250&fit=crop",
    category: "Logo Design",
    span: "col-span-1 row-span-1",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop",
    category: "Product Design",
    span: "col-span-1 row-span-2",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
    category: "Branding",
    span: "col-span-1 row-span-1",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop",
    category: "Interior Design",
    span: "col-span-1 row-span-1",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=600&fit=crop",
    category: "Architecture",
    span: "col-span-1 row-span-2",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=250&fit=crop",
    category: "3D Render",
    span: "col-span-1 row-span-1",
  },
  {
    id: 7,
    image:
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400&h=600&fit=crop",
    category: "Interior",
    span: "col-span-1 row-span-2",
  },
  {
    id: 8,
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    category: "Illustration",
    span: "col-span-1 row-span-1",
  },
  {
    id: 9,
    image:
      "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=400&h=250&fit=crop",
    category: "Digital Art",
    span: "col-span-1 row-span-1",
  },
  {
    id: 10,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=600&fit=crop",
    category: "Real Estate",
    span: "col-span-1 row-span-2",
  },
  {
    id: 11,
    image:
      "https://images.unsplash.com/photo-1629752187687-3d3c7ea3a21b?w=400&h=250&fit=crop",
    category: "Product Photography",
    span: "col-span-1 row-span-1",
  },
  {
    id: 12,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop",
    category: "Portrait Art",
    span: "col-span-1 row-span-1",
  },
  {
    id: 13,
    image:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop",
    category: "UI/UX Design",
    span: "col-span-1 row-span-1",
  },
  {
    id: 14,
    image:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=600&fit=crop",
    category: "App Design",
    span: "col-span-1 row-span-2",
  },
  {
    id: 15,
    image:
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=250&fit=crop",
    category: "Game Art",
    span: "col-span-1 row-span-1",
  },
  {
    id: 16,
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
    category: "Mobile App",
    span: "col-span-1 row-span-1",
  },
];

const PortfolioGallery = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="w-full py-16 px-4 md:px-8 lg:px-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2
            className={`text-3xl md:text-4xl lg:text-5xl font-medium mb-4 transition-colors duration-500 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Made on <span className="text-primary">Catalance</span>
          </h2>
          <p
            className={`text-base md:text-lg max-w-2xl mx-auto transition-colors duration-500 ${
              isDark ? "text-neutral-400" : "text-gray-600"
            }`}
          >
            Explore the incredible work created by our talented freelancers
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            >
              <img
                src={item.image}
                alt={item.category}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              {/* Overlay on hover */}
              <div
                className={`absolute inset-0 flex items-end justify-start p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDark
                    ? "bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                    : "bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                }`}
              >
                <span className="text-white text-sm font-medium bg-primary/90 px-3 py-1 rounded-full">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioGallery;
