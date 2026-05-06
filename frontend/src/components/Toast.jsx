import React from 'react';
import { useCart } from '../context/CartContext';

export default function ToastContainer() {
  const { toasts } = useCart();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </div>
  );
}
