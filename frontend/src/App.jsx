import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import AuthPage from './pages/AuthPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  useEffect(() => {
    if (isAdminRoute) {
      document.body.classList.add('admin-light-mode');
    } else {
      document.body.classList.remove('admin-light-mode');
    }
    return () => {
      document.body.classList.remove('admin-light-mode');
    };
  }, [isAdminRoute]);

  return (
    <div className={isAdminRoute ? "app-container admin-layout" : "app-container"}>
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? "main-content admin-main" : "main-content"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/products" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
          <Route path="/forgot-password" element={<AuthPage initialMode="forgot" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminRoute && !isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
