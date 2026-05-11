import Link from "next/link";

export default function ContactPage() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#ffffff", 
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ 
          textAlign: "center", 
          fontSize: "32px", 
          color: "#1d1d1f", 
          marginBottom: "40px",
          fontWeight: "bold"
        }}>
          Contact Virginia's Cakes & Confectionery
        </h1>

        {/* Contact Information */}
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "30px", 
          borderRadius: "12px", 
          marginBottom: "30px",
          border: "1px solid #e9ecef"
        }}>
          <h2 style={{ fontSize: "24px", color: "#1d1d1f", marginBottom: "20px" }}>
            Get in Touch
          </h2>
          
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#D4AF37" }}>
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <div>
                <strong style={{ fontSize: "18px", color: "#1d1d1f" }}>Phone:</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "16px", color: "#666" }}>
                  +234 708 345 3202
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#D4AF37" }}>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <div>
                <strong style={{ fontSize: "18px", color: "#1d1d1f" }}>Email:</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "16px", color: "#666" }}>
                  VirginiasCakes@gmail.com
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#D4AF37" }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <div>
                <strong style={{ fontSize: "18px", color: "#1d1d1f" }}>Location:</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "16px", color: "#666" }}>
                  Available for delivery across Lagos and surrounding areas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div style={{ 
          backgroundColor: "#fff5f8", 
          padding: "30px", 
          borderRadius: "12px", 
          marginBottom: "30px",
          border: "1px solid #F8C8DC"
        }}>
          <h2 style={{ fontSize: "24px", color: "#1d1d1f", marginBottom: "20px" }}>
            Payment Information
          </h2>
          
          <div style={{ 
            backgroundColor: "white", 
            padding: "20px", 
            borderRadius: "8px", 
            marginBottom: "20px",
            border: "1px solid #F8C8DC"
          }}>
            <h3 style={{ fontSize: "18px", color: "#1d1d1f", marginBottom: "15px" }}>
              Bank Transfer Details
            </h3>
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#666" }}>Bank:</strong>
                <span style={{ fontSize: "16px", fontWeight: "600", color: "#1d1d1f" }}>Opay</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#666" }}>Account Name:</strong>
                <span style={{ fontSize: "16px", fontWeight: "600", color: "#1d1d1f" }}>
                  VIRGINIA S CAKES & CONFECTIONERY
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#666" }}>Account Number:</strong>
                <span style={{ 
                  fontSize: "18px", 
                  fontWeight: "700", 
                  color: "#1d1d1f",
                  letterSpacing: "1px"
                }}>
                  6423166659
                </span>
              </div>
            </div>
          </div>

          <p style={{ color: "#666", marginBottom: "15px", fontSize: "16px" }}>
            After payment, send proof of transfer via WhatsApp for order confirmation.
          </p>
          
          <a 
            href="https://wa.me/2347083453202?text=Hello%20Virginia%20Cakes,%20I%20would%20like%20to%20place%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              backgroundColor: "#D4AF37",
              color: "white",
              padding: "12px 24px",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              textAlign: "center"
            }}
          >
            Message on WhatsApp
          </a>
        </div>

        {/* Social Media */}
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "30px", 
          borderRadius: "12px", 
          marginBottom: "30px",
          border: "1px solid #e9ecef"
        }}>
          <h2 style={{ fontSize: "24px", color: "#1d1d1f", marginBottom: "20px" }}>
            Follow Us
          </h2>
          
          <p style={{ color: "#666", marginBottom: "20px", fontSize: "16px" }}>
            Stay updated with our latest creations and special offers!
          </p>
          
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <a 
              href="https://www.instagram.com/virginiascakesandconfectionery?igsh=YWRoY2hsMG1zcmZ1" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                backgroundColor: "#F8C8DC",
                borderRadius: "8px",
                textDecoration: "none"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
              </svg>
            </a>
            
            <a 
              href="https://www.instagram.com/cakegospel?igsh=MWtpZXBjMTVuaHJrZQ==" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                backgroundColor: "#F8C8DC",
                borderRadius: "8px",
                textDecoration: "none"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
              </svg>
            </a>
            
            <a 
              href="https://www.tiktok.com/@virginiascakescon?_t=ZS-8ziyyg9eYpV&_r=1" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                backgroundColor: "#F8C8DC",
                borderRadius: "8px",
                textDecoration: "none"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.5 3v3.2c0 2.9 2.4 5.3 5.3 5.3h.7v3.1c-1.9-.1-3.7-.8-5.2-1.9v4.9c0 3-2.4 5.4-5.4 5.4S4.5 20.6 4.5 17.6s2.4-5.4 5.4-5.4c.5 0 1 .1 1.5.2v3.2c-.4-.2-.9-.3-1.5-.3-1.7 0-3.1 1.4-3.1 3.1S8.2 21.5 9.9 21.5s3.1-1.4 3.1-3.1V3h1.5z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Business Hours */}
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "30px", 
          borderRadius: "12px", 
          marginBottom: "30px",
          border: "1px solid #e9ecef"
        }}>
          <h2 style={{ fontSize: "24px", color: "#1d1d1f", marginBottom: "20px" }}>
            Business Hours
          </h2>
          
          <div style={{ display: "grid", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e9ecef" }}>
              <span style={{ color: "#666", fontSize: "16px" }}>Monday - Friday</span>
              <span style={{ fontWeight: "600", fontSize: "16px", color: "#1d1d1f" }}>8:00 AM - 8:00 PM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e9ecef" }}>
              <span style={{ color: "#666", fontSize: "16px" }}>Saturday</span>
              <span style={{ fontWeight: "600", fontSize: "16px", color: "#1d1d1f" }}>9:00 AM - 6:00 PM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ color: "#666", fontSize: "16px" }}>Sunday</span>
              <span style={{ fontWeight: "600", fontSize: "16px", color: "#1d1d1f" }}>10:00 AM - 4:00 PM</span>
            </div>
          </div>
          
          <div style={{ 
            marginTop: "20px", 
            padding: "15px", 
            backgroundColor: "#fff3cd", 
            borderRadius: "8px",
            border: "1px solid #ffeaa7"
          }}>
            <p style={{ margin: 0, color: "#856404", fontSize: "15px", textAlign: "center" }}>
              <strong>Note:</strong> Orders for same-day delivery should be placed by 2:00 PM
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <h2 style={{ fontSize: "24px", color: "#1d1d1f", marginBottom: "15px" }}>
            Ready to Order?
          </h2>
          <p style={{ 
            color: "#666", 
            marginBottom: "25px", 
            fontSize: "16px",
            maxWidth: "600px", 
            marginLeft: "auto", 
            marginRight: "auto" 
          }}>
            Browse our collection of handcrafted cakes and confectionery, or get in touch for custom orders for your special occasions.
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link 
              href="/categories" 
              style={{
                display: "inline-block",
                backgroundColor: "#F8C8DC",
                color: "#1d1d1f",
                padding: "12px 24px",
                textDecoration: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                border: "2px solid #F8C8DC"
              }}
            >
              Browse Products
            </Link>
            <Link 
              href="/custom-order" 
              style={{
                display: "inline-block",
                backgroundColor: "transparent",
                color: "#1d1d1f",
                padding: "12px 24px",
                textDecoration: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                border: "2px solid #1d1d1f"
              }}
            >
              Custom Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
