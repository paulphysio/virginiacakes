import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

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
  title: "Virginia's Cakes and Confectionery — Luxury Cakes",
  description:
    "Virginia's Cakes and Confectionery: Handcrafted luxury cakes with elegant designs, premium taste, and fast delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${openSans.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
