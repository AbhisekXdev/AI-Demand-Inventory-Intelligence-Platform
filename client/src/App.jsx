import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Categories from "./pages/Categories";
import Demands from "./pages/Demands";
import Replenishment from "./pages/Replenishment";
import InventoryAnalytics from "./pages/InventoryAnalytics";
import Intelligence from "./pages/Intelligence";
import Reports from "./pages/Reports";

import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected application routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />

              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="categories" element={<Categories />} />
              <Route path="demands" element={<Demands />} />
              <Route path="replenishment" element={<Replenishment />} />
              <Route path="analytics" element={<InventoryAnalytics />} />
              <Route path="intelligence" element={<Intelligence />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;