import { CartProvider } from '@/components/CartContext';
import StoreNavbar from '@/components/StoreNavbar';
import CartSidebar from '@/components/CartSidebar';
import FittingRoomPanel from '@/components/FittingRoomPanel';

export const metadata = {
  title: 'Zara — FashionMall',
  description: 'Moda contemporánea Zara en FashionMall',
};

export default function ZaraLayout({ children }) {
  return (
    <CartProvider>
      <StoreNavbar />
      <CartSidebar />
      <FittingRoomPanel />
      {children}
    </CartProvider>
  );
}
