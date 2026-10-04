/**
 * Master Seed Data for MobiMarket
 */

const seedUsers = [
  {
    name: 'MobiMarket Admin',
    phone: '9999999999',
    role: 'admin',
    isPhoneVerified: true
  },
  {
    name: 'Rajesh Sharma',
    phone: '9829012345',
    role: 'shopkeeper',
    shopId: 'shop_01',
    isPhoneVerified: true
  },
  {
    name: 'Vikram Singh',
    phone: '9829022211',
    role: 'shopkeeper',
    shopId: 'shop_02',
    isPhoneVerified: true
  },
  {
    name: 'Sunil Jain',
    phone: '9829033321',
    role: 'shopkeeper',
    shopId: 'shop_03',
    isPhoneVerified: true
  },
  {
    name: 'Karan Verma',
    phone: '9829044455',
    role: 'shopkeeper',
    shopId: 'shop_04',
    isPhoneVerified: true
  },
  {
    name: 'Tarun Baliyan',
    phone: '9829099887',
    role: 'buyer',
    isPhoneVerified: true
  }
];

const seedShops = [
  {
    customId: 'shop_01',
    name: 'Sharma Telecom',
    slug: 'sharma-telecom',
    ownerName: 'Rajesh Sharma',
    phone: '9829012345',
    whatsapp: '919829012345',
    address: 'Shop 14, Main Market, Malviya Nagar',
    locality: 'Malviya Nagar',
    city: 'Jaipur',
    openHours: '10:00 AM - 9:30 PM',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
    googleMapsUrl: 'https://maps.google.com/?q=Sharma+Telecom+Malviya+Nagar+Jaipur',
    verified: true,
    rating: 4.9,
    reviewsCount: 142,
    lat: 26.853,
    lng: 75.805,
    activeListingsCount: 4
  },
  {
    customId: 'shop_02',
    name: 'Apex Mobile Hub',
    slug: 'apex-mobile-hub',
    ownerName: 'Vikram Singh',
    phone: '9829022211',
    whatsapp: '919829022211',
    address: 'Shop 22, Lane 3, Raja Park',
    locality: 'Raja Park',
    city: 'Jaipur',
    openHours: '10:30 AM - 9:00 PM',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    googleMapsUrl: 'https://maps.google.com/?q=Apex+Mobile+Hub+Raja+Park+Jaipur',
    verified: true,
    rating: 4.8,
    reviewsCount: 89,
    lat: 26.892,
    lng: 75.827,
    activeListingsCount: 2
  },
  {
    customId: 'shop_03',
    name: 'Royal Phone Care',
    slug: 'royal-phone-care',
    ownerName: 'Sunil Jain',
    phone: '9829033321',
    whatsapp: '919829033321',
    address: 'Shop 5, VT Road, Mansarovar',
    locality: 'Mansarovar',
    city: 'Jaipur',
    openHours: '10:00 AM - 9:00 PM',
    image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600',
    googleMapsUrl: 'https://maps.google.com/?q=Royal+Phone+Care+Mansarovar+Jaipur',
    verified: true,
    rating: 4.7,
    reviewsCount: 64,
    lat: 26.858,
    lng: 75.768,
    activeListingsCount: 2
  },
  {
    customId: 'shop_04',
    name: 'City Cellular',
    slug: 'city-cellular',
    ownerName: 'Karan Verma',
    phone: '9829044455',
    whatsapp: '919829044455',
    address: 'Shop 8, Calgiri Marg, Malviya Nagar',
    locality: 'Malviya Nagar',
    city: 'Jaipur',
    openHours: '11:00 AM - 9:30 PM',
    image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600',
    googleMapsUrl: 'https://maps.google.com/?q=City+Cellular+Malviya+Nagar+Jaipur',
    verified: true,
    rating: 4.6,
    reviewsCount: 52,
    lat: 26.854,
    lng: 75.812,
    activeListingsCount: 2
  },
  {
    customId: 'shop_05',
    name: 'Metro Mobile Zone',
    slug: 'metro-mobile-zone',
    ownerName: 'Anil Gupta',
    phone: '9811223344',
    whatsapp: '919811223344',
    address: 'Shop 102, Shakarpur, Nehru Place',
    locality: 'Nehru Place',
    city: 'Delhi NCR',
    openHours: '10:30 AM - 8:30 PM',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
    googleMapsUrl: 'https://maps.google.com/?q=Nehru+Place+Delhi',
    verified: false,
    rating: 5.0,
    reviewsCount: 0,
    lat: 28.549,
    lng: 77.252,
    activeListingsCount: 0
  }
];

const seedPhones = [
  {
    customId: 'ph_01',
    brand: 'Apple',
    model: 'iPhone 13',
    ram: '4GB',
    storage: '128GB',
    color: 'Midnight Blue',
    price: 34999,
    mrp: 59900,
    condition: 'Like New',
    batteryHealth: 89,
    billBoxAvailable: true,
    warranty: '30-Day Testing Warranty',
    shopId: 'shop_01',
    shopName: 'Sharma Telecom',
    shopLocality: 'Malviya Nagar',
    shopCity: 'Jaipur',
    shopPhone: '9829012345',
    shopWhatsapp: '919829012345',
    shopDistanceKm: 1.2,
    images: [
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800',
      'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800'
    ],
    isSold: false,
    isFeatured: true,
    viewsCount: 184,
    leadsCount: 19
  },
  {
    customId: 'ph_02',
    brand: 'Apple',
    model: 'iPhone 13',
    ram: '4GB',
    storage: '128GB',
    color: 'Starlight White',
    price: 33500,
    mrp: 59900,
    condition: 'Good',
    batteryHealth: 84,
    billBoxAvailable: false,
    warranty: '15-Day Shop Warranty',
    shopId: 'shop_02',
    shopName: 'Apex Mobile Hub',
    shopLocality: 'Raja Park',
    shopCity: 'Jaipur',
    shopPhone: '9829022211',
    shopWhatsapp: '919829022211',
    shopDistanceKm: 3.2,
    images: [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800'
    ],
    isSold: false,
    isFeatured: false,
    viewsCount: 110,
    leadsCount: 12
  },
  {
    customId: 'ph_03',
    brand: 'OnePlus',
    model: '11R 5G',
    ram: '16GB',
    storage: '256GB',
    color: 'Galactic Silver',
    price: 26500,
    mrp: 44999,
    condition: 'Pristine',
    batteryHealth: 96,
    billBoxAvailable: true,
    warranty: '45-Day Shop Warranty',
    shopId: 'shop_01',
    shopName: 'Sharma Telecom',
    shopLocality: 'Malviya Nagar',
    shopCity: 'Jaipur',
    shopPhone: '9829012345',
    shopWhatsapp: '919829012345',
    shopDistanceKm: 1.2,
    images: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800'
    ],
    isSold: false,
    isFeatured: true,
    viewsCount: 142,
    leadsCount: 16
  },
  {
    customId: 'ph_04',
    brand: 'Samsung',
    model: 'Galaxy S21 FE 5G',
    ram: '8GB',
    storage: '128GB',
    color: 'Lavender',
    price: 22999,
    mrp: 49999,
    condition: 'Like New',
    batteryHealth: 91,
    billBoxAvailable: true,
    warranty: '30-Day Testing Warranty',
    shopId: 'shop_03',
    shopName: 'Royal Phone Care',
    shopLocality: 'Mansarovar',
    shopCity: 'Jaipur',
    shopPhone: '9829033321',
    shopWhatsapp: '919829033321',
    shopDistanceKm: 4.5,
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'
    ],
    isSold: false,
    isFeatured: false,
    viewsCount: 95,
    leadsCount: 8
  },
  {
    customId: 'ph_05',
    brand: 'Google',
    model: 'Pixel 7',
    ram: '8GB',
    storage: '128GB',
    color: 'Snow White',
    price: 27999,
    mrp: 59999,
    condition: 'Pristine',
    batteryHealth: 95,
    billBoxAvailable: true,
    warranty: '30-Day Testing Warranty',
    shopId: 'shop_04',
    shopName: 'City Cellular',
    shopLocality: 'Malviya Nagar',
    shopCity: 'Jaipur',
    shopPhone: '9829044455',
    shopWhatsapp: '919829044455',
    shopDistanceKm: 0.8,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'
    ],
    isSold: false,
    isFeatured: true,
    viewsCount: 160,
    leadsCount: 14
  },
  {
    customId: 'ph_06',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    ram: '6GB',
    storage: '128GB',
    color: 'Deep Purple',
    price: 64999,
    mrp: 129900,
    condition: 'Pristine',
    batteryHealth: 93,
    billBoxAvailable: true,
    warranty: '60-Day Testing Warranty',
    shopId: 'shop_01',
    shopName: 'Sharma Telecom',
    shopLocality: 'Malviya Nagar',
    shopCity: 'Jaipur',
    shopPhone: '9829012345',
    shopWhatsapp: '919829012345',
    shopDistanceKm: 1.2,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'
    ],
    isSold: false,
    isFeatured: true,
    viewsCount: 310,
    leadsCount: 38
  },
  {
    customId: 'ph_07',
    brand: 'Samsung',
    model: 'Galaxy S23 5G',
    ram: '8GB',
    storage: '256GB',
    color: 'Phantom Black',
    price: 44999,
    mrp: 79999,
    condition: 'Like New',
    batteryHealth: 94,
    billBoxAvailable: true,
    warranty: '45-Day Shop Warranty',
    shopId: 'shop_02',
    shopName: 'Apex Mobile Hub',
    shopLocality: 'Raja Park',
    shopCity: 'Jaipur',
    shopPhone: '9829022211',
    shopWhatsapp: '919829022211',
    shopDistanceKm: 3.2,
    images: [
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'
    ],
    isSold: false,
    isFeatured: false,
    viewsCount: 125,
    leadsCount: 15
  },
  {
    customId: 'ph_08',
    brand: 'Xiaomi',
    model: '13 Pro',
    ram: '12GB',
    storage: '256GB',
    color: 'Ceramic Black',
    price: 38999,
    mrp: 79999,
    condition: 'Good',
    batteryHealth: 88,
    billBoxAvailable: true,
    warranty: '30-Day Testing Warranty',
    shopId: 'shop_03',
    shopName: 'Royal Phone Care',
    shopLocality: 'Mansarovar',
    shopCity: 'Jaipur',
    shopPhone: '9829033321',
    shopWhatsapp: '919829033321',
    shopDistanceKm: 4.5,
    images: [
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800'
    ],
    isSold: false,
    isFeatured: false,
    viewsCount: 78,
    leadsCount: 6
  },
  {
    customId: 'ph_09',
    brand: 'Vivo',
    model: 'X90 5G',
    ram: '12GB',
    storage: '256GB',
    color: 'Breeze Blue',
    price: 31999,
    mrp: 63999,
    condition: 'Like New',
    batteryHealth: 92,
    billBoxAvailable: false,
    warranty: '15-Day Shop Warranty',
    shopId: 'shop_04',
    shopName: 'City Cellular',
    shopLocality: 'Malviya Nagar',
    shopCity: 'Jaipur',
    shopPhone: '9829044455',
    shopWhatsapp: '919829044455',
    shopDistanceKm: 0.8,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'
    ],
    isSold: false,
    isFeatured: false,
    viewsCount: 62,
    leadsCount: 5
  },
  {
    customId: 'ph_10',
    brand: 'Realme',
    model: 'GT 2 Pro',
    ram: '8GB',
    storage: '128GB',
    color: 'Paper White',
    price: 19999,
    mrp: 49999,
    condition: 'Good',
    batteryHealth: 87,
    billBoxAvailable: true,
    warranty: '15-Day Shop Warranty',
    shopId: 'shop_01',
    shopName: 'Sharma Telecom',
    shopLocality: 'Malviya Nagar',
    shopCity: 'Jaipur',
    shopPhone: '9829012345',
    shopWhatsapp: '919829012345',
    shopDistanceKm: 1.2,
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
    ],
    isSold: false,
    isFeatured: false,
    viewsCount: 54,
    leadsCount: 4
  }
];

const seedReviews = [
  {
    customId: 'rev_01',
    shopId: 'shop_01',
    buyerId: 'usr_guest_01',
    buyerName: 'Amit Meena',
    rating: 5,
    comment: 'Genuine shop! Tested iPhone 13 before buying, got physical GST bill and 30-day warranty.'
  },
  {
    customId: 'rev_02',
    shopId: 'shop_01',
    buyerId: 'usr_guest_02',
    buyerName: 'Sanjay Kumar',
    rating: 5,
    comment: 'Best shop in Malviya Nagar. Rajesh ji explained all battery and condition details transparently.'
  },
  {
    customId: 'rev_03',
    shopId: 'shop_02',
    buyerId: 'usr_guest_03',
    buyerName: 'Priya Sharma',
    rating: 4,
    comment: 'Great collection of Samsung devices in Raja Park. Got a fair deal on S23.'
  }
];

const seedLeads = [
  {
    customId: 'lead_9182',
    phoneId: 'ph_01',
    shopId: 'shop_01',
    buyerName: 'Tarun Baliyan',
    buyerPhone: '9829099887',
    phoneModel: 'iPhone 13 128GB',
    price: 34999,
    channel: 'whatsapp',
    status: 'New'
  },
  {
    customId: 'lead_9183',
    phoneId: 'ph_03',
    shopId: 'shop_01',
    buyerName: 'Vikas Agarwal',
    buyerPhone: '9829011122',
    phoneModel: 'OnePlus 11R 5G 256GB',
    price: 26500,
    channel: 'whatsapp',
    status: 'Contacted'
  }
];

module.exports = {
  seedUsers,
  seedShops,
  seedPhones,
  seedReviews,
  seedLeads
};
