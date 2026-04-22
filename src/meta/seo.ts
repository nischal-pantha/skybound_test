// SEO Configuration for Production
export const seoConfig = {
  title: "SkyBound Pro - Professional Flight Operations Platform",
  description: "Advanced flight planning, weight & balance, weather briefing, and aviation tools for professional pilots. Real-time aviation data, sectional charts, and comprehensive flight management.",
  keywords: [
    "flight planning",
    "aviation software",
    "pilot tools",
    "weight balance calculator",
    "aviation weather",
    "flight operations",
    "sectional charts",
    "aviation navigation",
    "pilot logbook",
    "flight training"
  ],
  author: "SkyBound Pro",
  robots: "index, follow",
  canonical: "https://skybound-pro.com",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://skybound-pro.com",
    siteName: "SkyBound Pro",
    title: "SkyBound Pro - Professional Flight Operations Platform",
    description: "Advanced flight planning, weight & balance, weather briefing, and aviation tools for professional pilots.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SkyBound Pro - Professional Flight Operations Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyBound Pro - Professional Flight Operations Platform",
    description: "Advanced flight planning, weight & balance, weather briefing, and aviation tools for professional pilots.",
    images: ["/twitter-image.png"]
  }
};

// Schema.org structured data
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SkyBound Pro",
  "description": "Professional flight operations platform with advanced planning tools, real-time weather, and comprehensive aviation features for pilots.",
  "url": "https://skybound-pro.com",
  "applicationCategory": "Aviation Software",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Flight Planning",
    "Weight & Balance Calculator",
    "Real-time Weather Data",
    "Interactive Sectional Charts",
    "Digital Logbook",
    "Performance Calculations",
    "Aircraft Management"
  ],
  "creator": {
    "@type": "Organization",
    "name": "SkyBound Pro Team"
  }
};