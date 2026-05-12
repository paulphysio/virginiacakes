import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Script from "next/script";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Virginia's Cakes & Confectionery — Luxury Treats",
  description:
    "Virginia's Cakes & Confectionery: Luxury cakes, cupcakes, banana bread, small chops, waffles, food trays and more — handcrafted with elegance and delivered fresh.",
};

// Utility function for SHA-256 hashing
const hashWithSHA256 = async (data) => {
  if (!data) return null;
  const encoder = new TextEncoder();
  const dataUint8Array = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* TikTok Base Pixel Script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;
              var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?id="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('D81ERCRC77UEKU3Q50SG', window);
              ttq.page();
            }(window, document, 'ttq');
          `
        }} />
        
        {/* TikTok Tracking Utilities */}
        <Script id="tiktok-tracking-utils" strategy="afterInteractive">
          {`
            // Utility function for SHA-256 hashing
            window.hashWithSHA256 = async function(data) {
              if (!data) return null;
              try {
                const encoder = new TextEncoder();
                const dataUint8Array = encoder.encode(data.toLowerCase().trim());
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              } catch (error) {
                console.error('Error hashing data:', error);
                return null;
              }
            };
            
            // TikTok tracking functions matching TikTok's exact format
            window.tiktokTrack = {
              // Identify user with hashed data
              identify: async function(userData) {
                if (typeof ttq === 'undefined') return;
                
                const hashedData = {};
                if (userData.email) {
                  hashedData.email = await window.hashWithSHA256(userData.email);
                }
                if (userData.phone) {
                  hashedData.phone_number = await window.hashWithSHA256(userData.phone);
                }
                if (userData.external_id) {
                  hashedData.external_id = await window.hashWithSHA256(userData.external_id);
                }
                
                ttq.identify(hashedData);
              },
              
              // Track ViewContent
              trackViewContent: function(product) {
                if (typeof ttq === 'undefined') return;
                
                ttq.track('ViewContent', {
                  contents: [{
                    content_id: product.id || product.slug || '',
                    content_type: 'product',
                    content_name: product.name || product.title || ''
                  }],
                  value: product.price_naira || product.price || 0,
                  currency: 'NGN'
                });
              },
              
              // Track AddToCart
              trackAddToCart: function(product) {
                if (typeof ttq === 'undefined') return;
                
                ttq.track('AddToCart', {
                  contents: [{
                    content_id: product.id || product.slug || '',
                    content_type: 'product',
                    content_name: product.name || product.title || ''
                  }],
                  value: product.price_naira || product.price || 0,
                  currency: 'NGN'
                });
              },
              
              // Track AddToWishlist
              trackAddToWishlist: function(product) {
                if (typeof ttq === 'undefined') return;
                
                ttq.track('AddToWishlist', {
                  contents: [{
                    content_id: product.id || product.slug || '',
                    content_type: 'product',
                    content_name: product.name || product.title || ''
                  }],
                  value: product.price_naira || product.price || 0,
                  currency: 'NGN'
                });
              },
              
              // Track Search
              trackSearch: function(searchQuery) {
                if (typeof ttq === 'undefined') return;
                
                ttq.track('Search', {
                  contents: [],
                  value: 0,
                  currency: 'NGN',
                  search_string: searchQuery || ''
                });
              },
              
              // Track AddPaymentInfo
              trackAddPaymentInfo: function(items, totalValue) {
                if (typeof ttq === 'undefined') return;
                
                const contents = items.map(item => ({
                  content_id: item.id || item.slug || '',
                  content_type: 'product',
                  content_name: item.name || item.title || ''
                }));
                
                ttq.track('AddPaymentInfo', {
                  contents: contents,
                  value: totalValue || 0,
                  currency: 'NGN'
                });
              },
              
              // Track InitiateCheckout
              trackInitiateCheckout: function(items, totalValue) {
                if (typeof ttq === 'undefined') return;
                
                const contents = items.map(item => ({
                  content_id: item.id || item.slug || '',
                  content_type: 'product',
                  content_name: item.name || item.title || ''
                }));
                
                ttq.track('InitiateCheckout', {
                  contents: contents,
                  value: totalValue || 0,
                  currency: 'NGN'
                });
              },
              
              // Track PlaceAnOrder
              trackPlaceAnOrder: function(items, totalValue) {
                if (typeof ttq === 'undefined') return;
                
                const contents = items.map(item => ({
                  content_id: item.id || item.slug || '',
                  content_type: 'product',
                  content_name: item.name || item.title || ''
                }));
                
                ttq.track('PlaceAnOrder', {
                  contents: contents,
                  value: totalValue || 0,
                  currency: 'NGN'
                });
              },
              
              // Track CompleteRegistration
              trackCompleteRegistration: function() {
                if (typeof ttq === 'undefined') return;
                
                ttq.track('CompleteRegistration', {
                  contents: [],
                  value: 0,
                  currency: 'NGN'
                });
              },
              
              // Track Purchase
              trackPurchase: function(items, totalValue) {
                if (typeof ttq === 'undefined') return;
                
                const contents = items.map(item => ({
                  content_id: item.id || item.slug || '',
                  content_type: 'product',
                  content_name: item.name || item.title || ''
                }));
                
                ttq.track('Purchase', {
                  contents: contents,
                  value: totalValue || 0,
                  currency: 'NGN'
                });
              }
            };
          `}
        </Script>
      </head>
      <body className={`${poppins.variable} ${openSans.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
