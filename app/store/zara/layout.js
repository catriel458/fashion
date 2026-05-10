import { CartProvider } from '@/components/CartContext';
import StoreNavbar from '@/components/StoreNavbar';
import CartSidebar from '@/components/CartSidebar';

export const metadata = {
  title: 'Zara — FashionMall',
  description: 'Moda contemporánea Zara en FashionMall',
};

export default function ZaraLayout({ children }) {
  return (
    <CartProvider>
      <StoreNavbar />
      <CartSidebar />
      {children}
    </CartProvider>
  );
}
