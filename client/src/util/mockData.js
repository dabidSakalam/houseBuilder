// src/util/mockData.js

// ===== USERS =====
export const users = [
  { userId: 1, name: "Jane Smith", email: "jane@example.com", createdAt: "2025-11-01T10:00:00Z" },
  { userId: 2, name: "John Doe", email: "john@example.com", createdAt: "2025-11-02T11:00:00Z" },
  { userId: 3, name: "Alice Johnson", email: "alice@example.com", createdAt: "2025-11-03T12:00:00Z" },
  { userId: 4, name: "Bob Martinez", email: "bob@example.com", createdAt: "2025-11-04T13:00:00Z" }
];

// ===== HOUSE MODELS =====
export const models = [
  // Modern
  { modelId: 1, name: "Modern Villa 1F", category: "Modern / Contemporary", floors: 1, filePath: "/HouseBuilder/client/public/models/Modern/Modern(1F).glb", status: "Available" },
  { modelId: 2, name: "Modern Villa 2F", category: "Modern / Contemporary", floors: 2, filePath: "/HouseBuilder/client/public/models/Modern/Modern(2F).glb", status: "Available" },
  { modelId: 3, name: "Modern Villa 3F", category: "Modern / Contemporary", floors: 3, filePath: "/HouseBuilder/client/public/models/Modern/Modern(3F).glb", status: "Available" },
  { modelId: 4, name: "Modern Villa 4F", category: "Modern / Contemporary", floors: 4, filePath: "/HouseBuilder/client/public/models/Modern/Modern(4F).glb", status: "Available" },

  // Traditional
  { modelId: 5, name: "Traditional House 1F", category: "Traditional", floors: 1, filePath: "/HouseBuilder/client/public/models/Traditional/Traditional(1F).glb", status: "Available" },
  { modelId: 6, name: "Traditional House 2F", category: "Traditional", floors: 2, filePath: "/HouseBuilder/client/public/models/Traditional/Traditional(2F).glb", status: "Available" },
  { modelId: 7, name: "Traditional House 3F", category: "Traditional", floors: 3, filePath: "/HouseBuilder/client/public/models/Traditional/Traditional(3F).glb", status: "Available" },
  { modelId: 8, name: "Traditional House 4F", category: "Traditional", floors: 4, filePath: "/HouseBuilder/client/public/models/Traditional/Traditional(4F).glb", status: "Available" },

  // Mediterranean
  { modelId: 9, name: "Mediterranean House 1F", category: "Mediterranean", floors: 1, filePath: "/HouseBuilder/client/public/models/Mediterranean/Mediterranean(1F).glb", status: "Available" },
  { modelId: 10, name: "Mediterranean House 2F", category: "Mediterranean", floors: 2, filePath: "/HouseBuilder/client/public/models/Mediterranean/Mediterranean(2F).glb", status: "Available" },

  // Minimalist
  { modelId: 11, name: "Minimalist House 1F", category: "Minimalist", floors: 1, filePath: "/HouseBuilder/client/public/models/Minimalist/Minimalist(1F).glb", status: "Available" },
  { modelId: 12, name: "Minimalist House 2F", category: "Minimalist", floors: 2, filePath: "/HouseBuilder/client/public/models/Minimalist/Minimalist(2F).glb", status: "Available" }
];

// ===== PRICES =====
export const features = {
  floors: { 
    "Bungalow (1 Floor)": 100000, 
    "Two-Storey": 160000, 
    "Three-Storey": 200000, 
    "High-Rise (4+ Floors)": 300000 
  },
  bathrooms: { 
    1: 20000, 
    2: 30000, 
    3: 40000, 
    4: 80000 
  },
  bedrooms: { 
    1: 100000, 
    2: 150000, 
    3: 175000, 
    4: 250000 
  },
  features: { 
    Balcony: 90000, 
    Garage: 100000, 
    "Swimming Pool": 150000, 
    Backyard: 90000, 
    Basement: 200000 
  },
  styles: { 
    "Modern / Contemporary": 500000, 
    Traditional: 450000, 
    Mediterranean: 425000, 
    Minimalist: 550000 
  }
};

// ===== CITY RATES =====
export const cityRates = {
  Bacoor: 12000, "Dasmariñas": 10500, Imus: 11000, Tagaytay: 15000,
  "General Trias": 9500, "Trece Martires": 9000, Carmona: 10000, Silang: 11500,
  Kawit: 9000, Rosario: 8500, Noveleta: 8500, Tanza: 9000, Naic: 8000,
  Maragondon: 7500, Indang: 8500, Amadeo: 9000
};

// ===== FEATURES LIST =====

// ===== ESTIMATES =====
export const estimates = [
  {
    estimateId: 1,
    userId: 1,
    modelId: 2, // Modern Villa 2F
    bedrooms: 3,
    bathrooms: 2,
    style: "Modern / Contemporary",
    floors: "Two-Storey",
    unitSize: 120,
    features: ['Balcony', 'Garage'],
    city: 'Bacoor',
    total: 1250000,
    status: 'In Progress',
    createdAt: "2025-11-09T10:00:00Z"
  },
  {
    estimateId: 2,
    userId: 2,
    modelId: 5, // Traditional House 1F
    bedrooms: 2,
    bathrooms: 1,
    style: "Traditional",
    floors: "Bungalow (1 Floor)",
    unitSize: 90,
    features: ['Basement'],
    city: 'Dasmariñas',
    total: 780000,
    status: 'Completed',
    createdAt: "2025-11-08T15:00:00Z"
  }
];
