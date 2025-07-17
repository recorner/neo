import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface CartItem {
  id: number;
  quantity: number;
  name?: string;
  price?: number;
  stock?: string | number;
  type?: string;
  category?: {
    id: number;
    name: string;
  };
}

// Initialize cart from localStorage or empty array
function createCartStore() {
  const initialValue: CartItem[] = browser ? JSON.parse(localStorage.getItem('cart') || '[]') : [];
  const { subscribe, set, update } = writable<CartItem[]>(initialValue);

  return {
    subscribe,
    set,
    update,
    addItem: (productId: number, quantity: number = 1, productData?: Partial<CartItem>) => {
      update(cart => {
        const existingIndex = cart.findIndex(item => item.id === productId);
        if (existingIndex >= 0) {
          cart[existingIndex].quantity += quantity;
          // Update product data if provided
          if (productData) {
            cart[existingIndex] = { ...cart[existingIndex], ...productData };
          }
        } else {
          cart.push({ 
            id: productId, 
            quantity,
            ...productData
          });
        }
        // Sync to cookies for server-side access
        if (browser) {
          document.cookie = `cart=${JSON.stringify(cart)}; path=/; max-age=2592000`; // 30 days
        }
        return cart;
      });
    },
    removeItem: (productId: number) => {
      update(cart => {
        const newCart = cart.filter(item => item.id !== productId);
        // Sync to cookies
        if (browser) {
          document.cookie = `cart=${JSON.stringify(newCart)}; path=/; max-age=2592000`;
        }
        return newCart;
      });
    },
    updateQuantity: (productId: number, quantity: number) => {
      update(cart => {
        const existingIndex = cart.findIndex(item => item.id === productId);
        if (existingIndex >= 0) {
          if (quantity <= 0) {
            cart.splice(existingIndex, 1);
          } else {
            cart[existingIndex].quantity = quantity;
          }
        }
        // Sync to cookies
        if (browser) {
          document.cookie = `cart=${JSON.stringify(cart)}; path=/; max-age=2592000`;
        }
        return cart;
      });
    },
    clear: () => {
      set([]);
      if (browser) {
        document.cookie = `cart=[]; path=/; max-age=2592000`;
      }
    },
    // Sync cart with server data
    syncWithProducts: (products: any[]) => {
      update(cart => {
        return cart.map(cartItem => {
          const product = products.find(p => p.id === cartItem.id);
          if (product) {
            return {
              ...cartItem,
              name: product.name,
              price: product.price,
              stock: product.stock,
              type: product.type,
              category: product.category
            };
          }
          return cartItem;
        });
      });
    },
    // Initialize from server data (for SSR)
    initFromServer: (serverCart: { id: number; quantity: number }[]) => {
      if (browser) {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        // Merge server cart with local cart, preferring local cart
        const mergedCart = [...localCart];
        serverCart.forEach(serverItem => {
          const existingIndex = mergedCart.findIndex(item => item.id === serverItem.id);
          if (existingIndex === -1) {
            mergedCart.push(serverItem);
          }
        });
        set(mergedCart);
      } else {
        set(serverCart);
      }
    }
  };
}

export const cart = createCartStore();

// Persist cart to localStorage whenever it changes
if (browser) {
  cart.subscribe(value => {
    localStorage.setItem('cart', JSON.stringify(value));
  });
}

// Derived store for cart totals
export const cartTotals = derived(cart, $cart => ({
  items: $cart.length,
  quantity: $cart.reduce((total, item) => total + item.quantity, 0),
  total: $cart.reduce((total, item) => total + (item.price || 0) * item.quantity, 0)
}));

// Derived store to check if item is in cart
export const isInCart = derived(cart, $cart => (productId: number) => 
  $cart.some(item => item.id === productId)
);
