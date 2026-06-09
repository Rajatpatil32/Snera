import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';

// Layout
import Navbar      from './components/Navbar';
import Footer      from './components/Footer';
import CartDrawer  from './components/CartDrawer';
import Toast       from './components/Toast';

// Public pages
import HomePage          from './pages/HomePage';
import ShopPage          from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage      from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import TrackOrderPage    from './pages/TrackOrderPage';

// Policy pages
import PrivacyPolicyPage  from './pages/PrivacyPolicyPage';
import RefundPolicyPage   from './pages/RefundPolicyPage';
import TermsPage          from './pages/TermsPage';
import ContactPage        from './pages/ContactPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';

// Admin pages
import AdminLoginPage        from './pages/admin/AdminLoginPage';
import AdminLayout           from './pages/admin/AdminLayout';
import AdminDashboard        from './pages/admin/AdminDashboard';
import AdminOrdersPage       from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage  from './pages/admin/AdminOrderDetailPage';
import AdminProductsPage     from './pages/admin/AdminProductsPage';
import AdminProductFormPage  from './pages/admin/AdminProductFormPage';
import AdminImagesPage       from './pages/admin/AdminImagesPage';
import NotFoundPage          from './pages/NotFoundPage';

// Storefront wrapper — includes Navbar, Footer, Cart
function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Public / Storefront ── */}
            <Route path="/" element={
              <StoreLayout><HomePage/></StoreLayout>
            }/>
            <Route path="/shop" element={
              <StoreLayout><ShopPage/></StoreLayout>
            }/>
            <Route path="/product/:slug" element={
              <StoreLayout><ProductDetailPage/></StoreLayout>
            }/>
            <Route path="/checkout" element={
              <StoreLayout><CheckoutPage/></StoreLayout>
            }/>
            <Route path="/order-success" element={
              <StoreLayout><OrderSuccessPage/></StoreLayout>
            }/>
            <Route path="/track-order" element={
              <StoreLayout><TrackOrderPage/></StoreLayout>
            }/>
            <Route path="/privacy-policy" element={
              <StoreLayout><PrivacyPolicyPage/></StoreLayout>
            }/>
            <Route path="/refund-policy" element={
              <StoreLayout><RefundPolicyPage/></StoreLayout>
            }/>
            <Route path="/terms" element={
              <StoreLayout><TermsPage/></StoreLayout>
            }/>
            <Route path="/contact" element={
              <StoreLayout><ContactPage/></StoreLayout>
            }/>
            <Route path="/shipping-policy" element={
              <StoreLayout><ShippingPolicyPage/></StoreLayout>
            }/>

            {/* ── Admin ── */}
            <Route path="/admin/login" element={<AdminLoginPage/>}/>

            {/* Admin layout with nested routes */}
            <Route path="/admin" element={<AdminLayout/>}>
              <Route index element={<Navigate to="dashboard" replace/>}/>
              <Route path="dashboard"              element={<AdminDashboard/>}/>
              <Route path="orders"                 element={<AdminOrdersPage/>}/>
              <Route path="orders/:id"             element={<AdminOrderDetailPage/>}/>
              <Route path="products"               element={<AdminProductsPage/>}/>
              <Route path="products/new"           element={<AdminProductFormPage/>}/>
              <Route path="products/:id/edit"      element={<AdminProductFormPage/>}/>
              <Route path="images"                 element={<AdminImagesPage/>}/>
            </Route>

            {/* Fallback — real 404, not a redirect. Better for SEO crawl budget. */}
            <Route path="*" element={
              <StoreLayout><NotFoundPage /></StoreLayout>
            }/>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </HelmetProvider>
  );
}