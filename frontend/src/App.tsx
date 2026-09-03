import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Receipts, ReceiptDetails } from "./pages/Receipts";
import { Scan } from "./pages/Scan";
import { Purchases, ItemDetails } from "./pages/Purchases";
import { Analytics } from "./pages/Analytics";
import { Download } from "./pages/Download";
import { Settings } from "./pages/Settings";
import { Convo } from "./pages/Convo";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/:id" element={<ReceiptDetails />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/:name" element={<ItemDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/download" element={<Download />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/convo" element={<Convo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
