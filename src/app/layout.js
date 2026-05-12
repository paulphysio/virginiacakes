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
        
        {/* TikTok Base Pixel Script - Using Next.js Script Component */}
        <Script 
          id="tiktok-pixel-base"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?id="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('D81ERCRC77UEKU3Q50SG', window);
                ttq.page();
              }(window, document, 'ttq');
            `
          }}
        />
        
        {/* TikTok Tracking Utilities */}
        <Script id="tiktok-tracking-utils" strategy="afterInteractive">
          {`
            // Wait for TikTok pixel to be fully loaded
            var checkPixelLoaded = setInterval(function() {
              if (typeof ttq !== 'undefined' && ttq.instance && ttq.load) {
                clearInterval(checkPixelLoaded);
                
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
                  pixelId: 'D81ERCRC77UEKU3Q50SG',
                  
                  // Get pixel instance
                  getPixel: function() {
                    return ttq.instance(this.pixelId);
                  },
                  
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
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      pixel.track('ViewContent', {
                        contents: [{
                          content_id: product.id || product.slug || '',
                          content_type: 'product',
                          content_name: product.name || product.title || ''
                        }],
                        value: product.price_naira || product.price || 0,
                        currency: 'NGN'
                      }, { event_id: 'view_content_' + (product.id || product.slug || '') + '_' + Date.now() });
                    }
                  },
                  
                  // Track AddToCart
                  trackAddToCart: function(product) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      pixel.track('AddToCart', {
                        contents: [{
                          content_id: product.id || product.slug || '',
                          content_type: 'product',
                          content_name: product.name || product.title || ''
                        }],
                        value: product.price_naira || product.price || 0,
                        currency: 'NGN'
                      }, { event_id: 'add_to_cart_' + (product.id || product.slug || '') + '_' + Date.now() });
                    }
                  },
                  
                  // Track AddToWishlist
                  trackAddToWishlist: function(product) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      pixel.track('AddToWishlist', {
                        contents: [{
                          content_id: product.id || product.slug || '',
                          content_type: 'product',
                          content_name: product.name || product.title || ''
                        }],
                        value: product.price_naira || product.price || 0,
                        currency: 'NGN'
                      }, { event_id: 'add_to_wishlist_' + (product.id || product.slug || '') + '_' + Date.now() });
                    }
                  },
                  
                  // Track Search
                  trackSearch: function(searchQuery) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      pixel.track('Search', {
                        contents: [],
                        value: 0,
                        currency: 'NGN',
                        search_string: searchQuery || ''
                      }, { event_id: 'search_' + Date.now() });
                    }
                  },
                  
                  // Track AddPaymentInfo
                  trackAddPaymentInfo: function(items, totalValue) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      const contents = items.map(item => ({
                        content_id: item.id || item.slug || '',
                        content_type: 'product',
                        content_name: item.name || item.title || ''
                      }));
                      
                      pixel.track('AddPaymentInfo', {
                        contents: contents,
                        value: totalValue || 0,
                        currency: 'NGN'
                      }, { event_id: 'add_payment_info_' + Date.now() });
                    }
                  },
                  
                  // Track InitiateCheckout
                  trackInitiateCheckout: function(items, totalValue) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      const contents = items.map(item => ({
                        content_id: item.id || item.slug || '',
                        content_type: 'product',
                        content_name: item.name || item.title || ''
                      }));
                      
                      pixel.track('InitiateCheckout', {
                        contents: contents,
                        value: totalValue || 0,
                        currency: 'NGN'
                      }, { event_id: 'initiate_checkout_' + Date.now() });
                    }
                  },
                  
                  // Track PlaceAnOrder
                  trackPlaceAnOrder: function(items, totalValue) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      const contents = items.map(item => ({
                        content_id: item.id || item.slug || '',
                        content_type: 'product',
                        content_name: item.name || item.title || ''
                      }));
                      
                      pixel.track('PlaceAnOrder', {
                        contents: contents,
                        value: totalValue || 0,
                        currency: 'NGN'
                      }, { event_id: 'place_order_' + Date.now() });
                    }
                  },
                  
                  // Track CompleteRegistration
                  trackCompleteRegistration: function() {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      pixel.track('CompleteRegistration', {
                        contents: [],
                        value: 0,
                        currency: 'NGN'
                      }, { event_id: 'complete_registration_' + Date.now() });
                    }
                  },
                  
                  // Track Purchase
                  trackPurchase: function(items, totalValue) {
                    if (typeof ttq === 'undefined') return;
                    
                    const pixel = this.getPixel();
                    if (pixel) {
                      const contents = items.map(item => ({
                        content_id: item.id || item.slug || '',
                        content_type: 'product',
                        content_name: item.name || item.title || ''
                      }));
                      
                      pixel.track('Purchase', {
                        contents: contents,
                        value: totalValue || 0,
                        currency: 'NGN'
                      }, { event_id: 'purchase_' + Date.now() });
                    }
                  }
                };
                
                console.log('TikTok tracking utilities initialized with pixel ID:', window.tiktokTrack.pixelId);
              }
            }, 100);
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
