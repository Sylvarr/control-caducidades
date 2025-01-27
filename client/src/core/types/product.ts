export type ProductStatus = "permanente" | "promocional";

export interface Product {
  _id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  fechaFrente: string | null;
  fechaAlmacen: string | null;
  estado: ProductStatus;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductState extends Product {
  isSelected?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isMoving?: boolean;
}

export interface ProductFilters {
  searchTerm?: string;
  status?: ProductStatus;
  isActive?: boolean;
  sortBy?: "nombre" | "ubicacion" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductMutation {
  id: string;
  changes: Partial<Product>;
  optimisticUpdate?: boolean;
}

export interface ProductStore {
  // Estado
  products: ProductState[];
  selectedProduct: ProductState | null;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;

  // Getters
  getProduct: (id: string) => ProductState | null;
  getFilteredProducts: () => ProductState[];
  getSelectedProduct: () => ProductState | null;

  // Acciones
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: ProductState | null) => void;
  updateProduct: (mutation: ProductMutation) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  moveProduct: (id: string, newStatus: ProductStatus) => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
}
