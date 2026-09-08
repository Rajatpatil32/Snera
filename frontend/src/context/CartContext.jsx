import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';

const CartContext = createContext();
const initialState = { items: [], isOpen: false };

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, items: action.payload };

    case 'ADD': {
      const { product, size, qty = 1, colour, price } = action.payload;
      // Key includes colour so same product in different colours = separate line items
      const colourKey = colour?.name || '';
      const key = `${product._id}_${size}_${colourKey}`;
      const exists = state.items.find(i => i.key === key);

      // Use the explicit per-unit price if passed (accounts for size price add-ons),
      // otherwise fall back to the product's base price.
      const unitPrice = price != null ? price : product.price;

      if (exists) {
        return {
          ...state,
          items: state.items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i),
        };
      }
      return {
        ...state,
        items: [...state.items, {
          key,
          id:         product._id,
          name:       product.name,
          price:      unitPrice,
          size,
          qty,
          // Colour info (null for products without colour groups)
          colour:     colour?.name  || null,
          colourHex:  colour?.hex   || null,
          // Image: use the active colour's first image, fall back to product primary
          image:      colour?.image || product.images?.[0] || null,
          glyph:      product.glyph || '◈',
          // Measurements entered at checkout (filled later, stored here for order payload)
          measurements: null,
        }],
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
          .filter(i => i.qty > 0),
      };
    }

    case 'SET_MEASUREMENTS': {
      const { key, measurements } = action.payload;
      return {
        ...state,
        items: state.items.map(i => i.key === key ? { ...i, measurements } : i),
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
  const [state,  dispatch] = useReducer(cartReducer, initialState);
  const [toasts, setToasts] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('snera_cart');
      if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('snera_cart', JSON.stringify(state.items));
  }, [state.items]);

  const toast = useCallback((msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  const total = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = state.items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ ...state, total, count, dispatch, toast, toasts }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);