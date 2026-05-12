// Custom hook for TikTok tracking
import { useEffect } from 'react';

export const useTikTokTracking = () => {
  useEffect(() => {
    // Track page view
    try {
      if (typeof window !== 'undefined' && window.ttq) {
        window.ttq.page();
      }
    } catch (error) {
      console.error('TikTok page tracking error:', error);
    }
  }, []);

  const trackViewContent = async (product) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackViewContent(product);
      }
    } catch (error) {
      console.error('TikTok ViewContent tracking error:', error);
    }
  };

  const trackAddToCart = async (product) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackAddToCart(product);
      }
    } catch (error) {
      console.error('TikTok AddToCart tracking error:', error);
    }
  };

  const trackAddToWishlist = async (product) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackAddToWishlist(product);
      }
    } catch (error) {
      console.error('TikTok AddToWishlist tracking error:', error);
    }
  };

  const trackSearch = async (searchQuery) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackSearch(searchQuery);
      }
    } catch (error) {
      console.error('TikTok Search tracking error:', error);
    }
  };

  const trackAddPaymentInfo = async (items, totalValue) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackAddPaymentInfo(items, totalValue);
      }
    } catch (error) {
      console.error('TikTok AddPaymentInfo tracking error:', error);
    }
  };

  const trackInitiateCheckout = async (items, totalValue) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackInitiateCheckout(items, totalValue);
      }
    } catch (error) {
      console.error('TikTok InitiateCheckout tracking error:', error);
    }
  };

  const trackPlaceAnOrder = async (items, totalValue) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackPlaceAnOrder(items, totalValue);
      }
    } catch (error) {
      console.error('TikTok PlaceAnOrder tracking error:', error);
    }
  };

  const trackCompleteRegistration = async () => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackCompleteRegistration();
      }
    } catch (error) {
      console.error('TikTok CompleteRegistration tracking error:', error);
    }
  };

  const trackPurchase = async (items, totalValue) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.trackPurchase(items, totalValue);
      }
    } catch (error) {
      console.error('TikTok Purchase tracking error:', error);
    }
  };

  const identifyUser = async (userData) => {
    try {
      if (typeof window !== 'undefined' && window.tiktokTrack) {
        await window.tiktokTrack.identify(userData);
      }
    } catch (error) {
      console.error('TikTok user identification error:', error);
    }
  };

  return {
    trackViewContent,
    trackAddToCart,
    trackAddToWishlist,
    trackSearch,
    trackAddPaymentInfo,
    trackInitiateCheckout,
    trackPlaceAnOrder,
    trackCompleteRegistration,
    trackPurchase,
    identifyUser,
  };
};
