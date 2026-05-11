# TikTok Tracking Implementation Guide

This document explains how TikTok conversion tracking has been implemented on Virginia's Cakes & Confectionery website.

## Overview

The TikTok tracking system has been integrated to monitor user interactions and conversions on your website. This includes:

- Page view tracking
- Product view tracking (ViewContent)
- Add to cart tracking (AddToCart)
- Checkout initiation tracking (InitiateCheckout)
- Purchase tracking (Purchase)
- User identification (identify)
- Search tracking (Search)
- Registration tracking (CompleteRegistration)

## Implementation Details

### 1. Base Pixel Setup

The TikTok base pixel is loaded in `layout.js` with the placeholder `YOUR_PIXEL_ID_HERE`. You need to:

1. **Replace the placeholder** with your actual TikTok Pixel ID
2. **Test the pixel** using TikTok's Pixel Helper browser extension

### 2. Tracking Functions

The system includes these tracking functions available globally:

```javascript
// Track when a user views a product
window.tiktokTrack.trackViewContent(product);

// Track when a user adds a product to cart
window.tiktokTrack.trackAddToCart(product);

// Track when a user initiates checkout
window.tiktokTrack.trackInitiateCheckout(items, totalValue);

// Track when a user completes a purchase
window.tiktokTrack.trackPurchase(items, totalValue);

// Track user registration
window.tiktokTrack.trackCompleteRegistration();

// Track search queries
window.tiktokTrack.trackSearch(searchQuery);

// Identify user with hashed data
window.tiktokTrack.identify(userData);
```

### 3. Custom Hook

A React hook `useTikTokTracking` is available for components:

```javascript
import { useTikTokTracking } from '../hooks/useTikTokTracking';

const { trackViewContent, trackAddToCart, identifyUser } = useTikTokTracking();
```

### 4. Data Hashing

All personally identifiable information (PII) is automatically hashed using SHA-256 before being sent to TikTok, as required by their privacy policies:

- Email addresses
- Phone numbers
- External IDs (user IDs)

### 5. Current Implementations

#### Homepage (`page.js`)
- **ViewContent**: Automatically tracked when featured products load
- **AddToCart**: Tracked when users add products to cart
- **User Identification**: Tracked when logged-in users add items to cart

#### Required Actions for Other Pages

You should add tracking to these additional pages:

1. **Category Pages** (`/categories/[slug]`)
   - Track ViewContent for products displayed
   - Track AddToCart for product additions

2. **Product Detail Pages** (if you have them)
   - Track ViewContent when product page loads
   - Track AddToCart when product is added to cart

3. **Checkout Page** (`/checkout`)
   - Track InitiateCheckout when checkout process starts
   - Track Purchase when order is completed

4. **Login/Register Pages**
   - Track CompleteRegistration when users create accounts

5. **Search Results** (if you have search functionality)
   - Track Search when users perform searches

## Setup Instructions

### Step 1: Replace Pixel ID

In `src/app/layout.js`, find this line:
```javascript
ttq.load('YOUR_PIXEL_ID_HERE', window);
```

Replace `YOUR_PIXEL_ID_HERE` with your actual TikTok Pixel ID.

### Step 2: Test Implementation

1. Install TikTok Pixel Helper browser extension
2. Navigate to your website
3. Check that events are firing correctly
4. Test user interactions (viewing products, adding to cart, etc.)

### Step 3: Configure TikTok Events

In your TikTok Ads Manager:
1. Set up conversion events matching your website
2. Configure event parameters and values
3. Test with real user interactions

### Step 4: Monitor Performance

Regularly check:
- Event firing frequency
- Conversion rates
- Return on ad spend (ROAS)
- Attribution settings

## Privacy & Compliance

- All PII data is hashed client-side using SHA-256
- No raw email/phone data is sent to TikTok
- Tracking respects user privacy preferences
- GDPR and CCPA compliant implementation

## Troubleshooting

### Common Issues

1. **Events not firing**: Check that pixel ID is correct and script loads
2. **Missing data**: Verify product objects have required fields (id, name, price)
3. **Hashing errors**: Ensure crypto.subtle is available (HTTPS required)
4. **Timing issues**: Use async/await for tracking calls

### Debug Mode

Add this to test tracking in development:
```javascript
// In layout.js, add debug parameter
ttq.load('YOUR_PIXEL_ID_HERE', window);
ttq.instance('YOUR_PIXEL_ID_HERE').enableCookie();
ttq.instance('YOUR_PIXEL_ID_HERE').debug();
```

## Support

For TikTok Pixel specific issues:
- TikTok Ads Manager Help Center
- TikTok Pixel Helper documentation
- TikTok API documentation

For implementation issues:
- Check browser console for errors
- Verify network requests to TikTok endpoints
- Test with different user scenarios
