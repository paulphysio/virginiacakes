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
  title: "Virginia's Cakes & Confectionery — Luxury Treats",
  description:
    "Virginia's Cakes & Confectionery: Luxury cakes, cupcakes, banana bread, small chops, waffles, food trays and more — handcrafted with elegance and delivered fresh.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${poppins.variable} ${openSans.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
