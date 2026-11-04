import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AccountLayout } from '@/components/layout/AccountLayout';
import { ToastProvider } from '@/components/ui/Toast';
import { AddressPage } from '@/pages/AddressPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ShipmentPage } from '@/pages/ShipmentPage';
import { ChatPage, FaqPage, LoggedOutPage, NotFoundPage } from '@/pages/SupportPages';

/**
 * Orders is the landing section. On every fresh load or browser refresh, the
 * top-level section pages (Profile, Address, Chat, FAQs, logged-out) open on
 * Orders instead. Order and tracking links (/account/orders/…) are already in
 * Orders, so they stay where they are. Moving between sections inside the app
 * isn't affected, because this runs once per page load, before the router starts.
 */
const LANDING = '/account/orders';
const SECTION_PAGES = /^\/account\/(profile|addresses|chat|faqs)\/?$|^\/logged-out\/?$/;
if (typeof window !== 'undefined' && SECTION_PAGES.test(window.location.pathname)) {
  // Keep only the QA ?state= helper; section-specific params don't apply to Orders.
  const qa = new URLSearchParams(window.location.search).get('state');
  window.history.replaceState(null, '', LANDING + (qa ? `?state=${qa}` : ''));
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/account/orders" replace /> },
  { path: '/logged-out', element: <LoggedOutPage /> },
  {
    path: '/account',
    element: <AccountLayout />,
    children: [
      { index: true, element: <Navigate to="orders" replace /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'addresses', element: <AddressPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'orders/:orderId/items/:itemId', element: <ShipmentPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'faqs', element: <FaqPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/account/orders" replace /> },
]);

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
