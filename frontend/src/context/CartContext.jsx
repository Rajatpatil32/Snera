import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';

const CartContext = createContext();

const initialState = { items: [], isOpen: false };

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, items: action.payload };

    case 'ADD': {
      const { product, size, qty = 1 } = action.payload;
      const key = `${product._id}_${size}`;
      const exists = state.items.find(i => i.key === key);
      if (exists) {
        return {
          ...state,
          items: state.items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i)
        };
      }
      return {
        ...state,
        items: [...state.items, {
          key, id: product._id, name: product.name, price: product.price,
          size, image: product.images?.[0] || null, glyph: product.glyph || '◈', qty
        }]
      };
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.key !== action.payload) };

    case 'CHANGE_QTY': {
      const { key, delta } = action.payload;
      return {
        ...state,
        items: state.items
          .map(i => i.key === key ? { ...i, qty: i.qty + delta } : i)
          .filter(i => i.qty > 0)
      };
    }

    case 'CLEAR':
      return { ...state, items: [] };

    case 'OPEN':
      return { ...state, isOpen: true };

    case 'CLOSE':
      return { ...state, isOpen: false };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [toasts, setToasts] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('snera_cart');
      if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('snera_cart', JSON.stringify(state.items));
  }, [state.items]);

  const toast = useCallback((msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  const total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = state.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ ...state, total, count, dispatch, toast, toasts }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
