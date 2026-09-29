# MobiMarket — Complete Frontend Web Integration Guide (Angular 19)

> **Backend Base URL:** `http://localhost:3000/api/v1` (Production: `https://api.mobimarket.in/api/v1`)  
> **Auth Scheme:** JWT Bearer Token (`Authorization: Bearer <token>`)  
> **Data Format:** Standard JSON REST Envelope  

This guide provides everything needed to replace the current mock data in your Angular 19 frontend (`Mobile-india`) with real HTTP calls to the **Mob-India-Api** backend.

---

## 📑 Table of Contents

1. [Global Setup & Angular Configuration](#1-global-setup--angular-configuration)
2. [TypeScript Models & DTO Interfaces](#2-typescript-models--dto-interfaces)
3. [JWT Auth HTTP Interceptor](#3-jwt-auth-http-interceptor)
4. [Master Angular Services](#4-master-angular-services)
   - [AuthService (Module 1)](#41-authservice-7-apis)
   - [ShopService (Module 2)](#42-shopservice-7-apis)
   - [PhoneService / MarketplaceService (Module 3)](#43-phoneservice--marketplaceservice-10-apis)
   - [CartService (Module 4)](#44-cartservice-5-apis)
   - [LeadService (Module 5)](#45-leadservice-4-apis)
   - [AnalyticsService (Module 6)](#46-analyticsservice-3-apis)
   - [MediaService (Module 7)](#47-mediaservice-2-apis)
   - [MetaService (Module 8)](#48-metaservice-3-apis)
   - [AdminService (Module 9)](#49-adminservice-4-apis)
5. [Component Wiring Examples](#5-component-wiring-examples)

---

## 1. Global Setup & Angular Configuration

### 1.1 Enable `HttpClient` in `src/app/app.config.ts`

Make sure `provideHttpClient` with `withInterceptors` is registered in `appConfig`:

```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )
  ]
};
```

### 1.2 Define Environment Config

Create or update `src/environments/environment.ts`:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  mediaBaseUrl: 'http://localhost:3000'
};
```

---

## 2. TypeScript Models & DTO Interfaces

Create `src/app/models/api-response.model.ts`:

```typescript
// src/app/models/api-response.model.ts

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiMeta;
  error?: string;
  timestamp?: string;
  path?: string;
}
```

Update `src/app/models/user.model.ts`:

```typescript
// src/app/models/user.model.ts
export interface UserSession {
  id: string;
  name: string;
  phone: string;
  role: 'buyer' | 'shopkeeper' | 'admin';
  shopId?: string | null;
}

export interface AuthVerifyResponse {
  token: string;
  refreshToken: string;
  user: UserSession;
}
```

---

## 3. JWT Auth HTTP Interceptor

Create `src/app/interceptors/auth.interceptor.ts`:

This automatically attaches `Authorization: Bearer <token>` to every request when the user is logged in.

```typescript
// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('mobimarket_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
```

---

## 4. Master Angular Services

### 4.1 AuthService (7 APIs)

Create `src/app/services/auth.service.ts`:

```typescript
// src/app/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { UserSession, AuthVerifyResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<UserSession | null>(this.loadStoredUser());
  readonly isAuthenticated = signal<boolean>(!!localStorage.getItem('mobimarket_token'));

  // 1.1 Send OTP
  sendOtp(phone: string, channel: 'sms' | 'whatsapp' = 'sms'): Observable<ApiResponse<{ sessionId: string }>> {
    return this.http.post<ApiResponse<{ sessionId: string }>>(`${this.baseUrl}/send-otp`, {
      phone,
      channel
    });
  }

  // 1.2 Verify OTP (Login / Auto-register)
  verifyOtp(payload: {
    phone: string;
    otp: string;
    sessionId?: string;
    roleHint?: 'buyer' | 'shopkeeper';
    name?: string;
  }): Observable<ApiResponse<AuthVerifyResponse>> {
    return this.http.post<ApiResponse<AuthVerifyResponse>>(`${this.baseUrl}/verify-otp`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('mobimarket_token', res.data.token);
          localStorage.setItem('mobimarket_refresh_token', res.data.refreshToken);
          localStorage.setItem('mobimarket_user', JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  // 1.3 Register Shopkeeper
  registerShopkeeper(shopData: {
    ownerName: string;
    phone: string;
    whatsapp: string;
    shopName: string;
    address: string;
    locality: string;
    city: string;
    openHours?: string;
    image?: string;
    googleMapsUrl?: string;
  }): Observable<ApiResponse<{ token: string; shop: any }>> {
    return this.http.post<ApiResponse<{ token: string; shop: any }>>(`${this.baseUrl}/register-shopkeeper`, shopData).pipe(
      tap(res => {
        if (res.success && res.data.token) {
          localStorage.setItem('mobimarket_token', res.data.token);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  // 1.4 Get Profile
  getMe(): Observable<ApiResponse<UserSession & { shop?: any }>> {
    return this.http.get<ApiResponse<UserSession & { shop?: any }>>(`${this.baseUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem('mobimarket_user', JSON.stringify(res.data));
        }
      })
    );
  }

  // 1.5 Refresh Token
  refreshToken(): Observable<ApiResponse<{ token: string }>> {
    const refreshToken = localStorage.getItem('mobimarket_refresh_token');
    return this.http.post<ApiResponse<{ token: string }>>(`${this.baseUrl}/refresh-token`, { refreshToken }).pipe(
      tap(res => {
        if (res.success && res.data.token) {
          localStorage.setItem('mobimarket_token', res.data.token);
        }
      })
    );
  }

  // 1.6 Logout
  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem('mobimarket_token');
    localStorage.removeItem('mobimarket_refresh_token');
    localStorage.removeItem('mobimarket_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  // 1.7 Resend OTP
  resendOtp(sessionId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/resend-otp`, { sessionId });
  }

  private loadStoredUser(): UserSession | null {
    try {
      const data = localStorage.getItem('mobimarket_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
```

---

### 4.2 ShopService (7 APIs)

Create `src/app/services/shop.service.ts`:

```typescript
// src/app/services/shop.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Shop } from '../models/shop.model';
import { PhoneListing } from '../models/phone.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/shops`;

  // 2.1 Get Shops with geo sorting & city filter
  getShops(params: {
    city?: string;
    locality?: string;
    verifiedOnly?: boolean;
    userLat?: number;
    userLng?: number;
    q?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<Shop[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return this.http.get<ApiResponse<Shop[]>>(this.baseUrl, { params: httpParams });
  }

  // 2.2 Get Shop Profile & Live Inventory
  getShopByIdOrSlug(idOrSlug: string): Observable<ApiResponse<{ shop: Shop; inventory: PhoneListing[] }>> {
    return this.http.get<ApiResponse<{ shop: Shop; inventory: PhoneListing[] }>>(`${this.baseUrl}/${idOrSlug}`);
  }

  // 2.3 Update Shop Profile
  updateShop(shopId: string, updates: Partial<Shop>): Observable<ApiResponse<Shop>> {
    return this.http.put<ApiResponse<Shop>>(`${this.baseUrl}/${shopId}`, updates);
  }

  // 2.4 Get QR Code Data URL
  getShopQrCode(shopId: string): Observable<ApiResponse<{ qrCodeDataUrl: string; catalogUrl: string }>> {
    return this.http.get<ApiResponse<{ qrCodeDataUrl: string; catalogUrl: string }>>(`${this.baseUrl}/${shopId}/qr`);
  }

  // 2.5 Get Shop Reviews
  getShopReviews(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/${shopId}/reviews`);
  }

  // 2.6 Submit Shop Review
  addShopReview(shopId: string, rating: number, comment: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${shopId}/reviews`, { rating, comment });
  }

  // 2.7 Check Slug Availability
  checkSlug(slug: string): Observable<ApiResponse<{ isAvailable: boolean }>> {
    return this.http.get<ApiResponse<{ isAvailable: boolean }>>(`${this.baseUrl}/check-slug/${slug}`);
  }
}
```

---

### 4.3 PhoneService / MarketplaceService (10 APIs)

Update `src/app/services/marketplace.service.ts`:

```typescript
// src/app/services/marketplace.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PhoneListing, PhoneFilterState } from '../models/phone.model';

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/phones`;

  readonly currentCity = signal<string>('Jaipur');
  readonly phones = signal<PhoneListing[]>([]);
  readonly featuredPhones = signal<PhoneListing[]>([]);
  readonly isLoading = signal<boolean>(false);

  // 3.1 Get Phones with Filtering
  loadPhones(filter: Partial<PhoneFilterState> = {}): Observable<ApiResponse<PhoneListing[]>> {
    this.isLoading.set(true);
    let params = new HttpParams().set('city', filter.city || this.currentCity());

    if (filter.searchQuery) params = params.set('q', filter.searchQuery);
    if (filter.brand) params = params.set('brand', filter.brand);
    if (filter.condition) params = params.set('condition', filter.condition);
    if (filter.storage) params = params.set('storage', filter.storage);
    if (filter.minPrice) params = params.set('minPrice', String(filter.minPrice));
    if (filter.maxPrice) params = params.set('maxPrice', String(filter.maxPrice));
    if (filter.onlyBillBox) params = params.set('onlyBillBox', 'true');
    if (filter.onlyWithWarranty) params = params.set('onlyWithWarranty', 'true');
    if (filter.maxDistanceKm) params = params.set('maxDistanceKm', String(filter.maxDistanceKm));

    return this.http.get<ApiResponse<PhoneListing[]>>(this.baseUrl, { params }).pipe(
      tap(res => {
        this.isLoading.set(false);
        if (res.success) {
          this.phones.set(res.data);
        }
      })
    );
  }

  // 3.2 Get Featured Phones
  loadFeatured(city: string = this.currentCity()): Observable<ApiResponse<PhoneListing[]>> {
    return this.http.get<ApiResponse<PhoneListing[]>>(`${this.baseUrl}/featured`, {
      params: { city }
    }).pipe(
      tap(res => {
        if (res.success) {
          this.featuredPhones.set(res.data);
        }
      })
    );
  }

  // 3.3 Get Phone Details & Increment View
  getPhoneById(id: string): Observable<ApiResponse<PhoneListing>> {
    return this.http.get<ApiResponse<PhoneListing>>(`${this.baseUrl}/${id}`);
  }

  // 3.4 Compare Phone Model across City Shops
  comparePhones(model: string, city: string = this.currentCity()): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/compare`, {
      params: { model, city }
    });
  }

  // 3.5 Create Phone Listing (Seller)
  createPhone(phoneData: Partial<PhoneListing>): Observable<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>(this.baseUrl, phoneData).pipe(
      tap(() => this.loadPhones())
    );
  }

  // 3.6 Update Full Listing
  updatePhone(id: string, updates: Partial<PhoneListing>): Observable<ApiResponse<PhoneListing>> {
    return this.http.put<ApiResponse<PhoneListing>>(`${this.baseUrl}/${id}`, updates);
  }

  // 3.7 1-Tap Quick Price Adjustment
  updatePrice(id: string, price: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.baseUrl}/${id}/price`, { price }).pipe(
      tap(() => {
        this.phones.update(list => list.map(p => p.id === id ? { ...p, price } : p));
      })
    );
  }

  // 3.8 1-Tap Status Toggle (Active <-> Sold)
  toggleSold(id: string, isSold: boolean): Observable<ApiResponse<{ isSold: boolean }>> {
    return this.http.patch<ApiResponse<{ isSold: boolean }>>(`${this.baseUrl}/${id}/sold`, { isSold }).pipe(
      tap(() => {
        this.phones.update(list => list.map(p => p.id === id ? { ...p, isSold } : p));
      })
    );
  }

  // 3.9 Update Images Gallery
  updateImages(id: string, images: string[]): Observable<ApiResponse<{ images: string[] }>> {
    return this.http.patch<ApiResponse<{ images: string[] }>>(`${this.baseUrl}/${id}/images`, { images });
  }

  // 3.10 Delete Listing
  deletePhone(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.phones.update(list => list.filter(p => p.id !== id));
      })
    );
  }
}
```

---

### 4.4 CartService (5 APIs)

Create `src/app/services/cart.service.ts`:

```typescript
// src/app/services/cart.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface CartData {
  itemsCount: number;
  totalPrice: number;
  totalMrp: number;
  totalSavings: number;
  items: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/buyer/cart`;

  readonly cart = signal<CartData | null>(null);
  readonly cartCount = signal<number>(0);

  // 4.1 Get Cart
  loadCart(): Observable<ApiResponse<CartData>> {
    return this.http.get<ApiResponse<CartData>>(this.baseUrl).pipe(
      tap(res => {
        if (res.success) {
          this.cart.set(res.data);
          this.cartCount.set(res.data.itemsCount);
        }
      })
    );
  }

  // 4.2 Add to Cart
  addToCart(phoneId: string): Observable<ApiResponse<{ cartCount: number }>> {
    return this.http.post<ApiResponse<{ cartCount: number }>>(this.baseUrl, { phoneId }).pipe(
      tap(res => {
        if (res.success) {
          this.cartCount.set(res.data.cartCount);
          this.loadCart().subscribe();
        }
      })
    );
  }

  // 4.3 Remove Item from Cart
  removeFromCart(phoneId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${phoneId}`).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }

  // 4.4 Clear Cart
  clearCart(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(this.baseUrl).pipe(
      tap(() => {
        this.cart.set(null);
        this.cartCount.set(0);
      })
    );
  }

  // 4.5 Sync Local Storage Cart
  syncCart(phoneIds: string[]): Observable<ApiResponse<{ itemsCount: number }>> {
    return this.http.post<ApiResponse<{ itemsCount: number }>>(`${this.baseUrl}/sync`, { phoneIds }).pipe(
      tap(res => {
        if (res.success) {
          this.cartCount.set(res.data.itemsCount);
        }
      })
    );
  }
}
```

---

### 4.5 LeadService (4 APIs)

Create `src/app/services/lead.service.ts`:

```typescript
// src/app/services/lead.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leads`;

  // 5.1 Initiate WhatsApp or Call Lead (redirects seamlessly)
  initiateInquiry(phoneId: string, channel: 'whatsapp' | 'call' = 'whatsapp'): Observable<ApiResponse<{ leadId: string; redirectUrl: string }>> {
    return this.http.post<ApiResponse<{ leadId: string; redirectUrl: string }>>(this.baseUrl, { phoneId, channel }).pipe(
      tap(res => {
        if (res.success && res.data.redirectUrl) {
          window.open(res.data.redirectUrl, '_blank');
        }
      })
    );
  }

  // 5.2 Get Shop CRM Inquiries
  getShopLeads(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/shop/${shopId}`);
  }

  // 5.3 Update Inquiry Status
  updateStatus(leadId: string, status: 'New' | 'Contacted' | 'Visited Store' | 'Sold' | 'Lost'): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/${leadId}/status`, { status });
  }

  // 5.4 Get My Inquiries (Buyer)
  getMyInquiries(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/buyer/my-inquiries`);
  }
}
```

---

### 4.6 AnalyticsService (3 APIs)

Create `src/app/services/analytics.service.ts`:

```typescript
// src/app/services/analytics.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface DashboardMetrics {
  viewsToday: number;
  viewsTotal: number;
  leadsToday: number;
  leadsTotal: number;
  activeInventoryCount: number;
  soldCount: number;
  totalInventoryValue: number;
  conversionRatePercent: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/analytics`;

  // 6.1 Real-Time KPIs
  getDashboard(shopId: string): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(`${this.baseUrl}/dashboard/${shopId}`);
  }

  // 6.2 Top Viewed & Inquired Models
  getTopModels(shopId: string): Observable<ApiResponse<{ model: string; views: number; leads: number }[]>> {
    return this.http.get<ApiResponse<{ model: string; views: number; leads: number }[]>>(`${this.baseUrl}/top-models/${shopId}`);
  }

  // 6.3 30-Day Trends
  getTrends(shopId: string, days: number = 30): Observable<ApiResponse<{ date: string; views: number; leads: number }[]>> {
    return this.http.get<ApiResponse<{ date: string; views: number; leads: number }[]>>(`${this.baseUrl}/trends/${shopId}`, {
      params: { days: String(days) }
    });
  }
}
```

---

### 4.7 MediaService (2 APIs)

Create `src/app/services/media.service.ts`:

```typescript
// src/app/services/media.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/media`;

  // 7.1 Upload Device Photos
  uploadImage(file: File): Observable<ApiResponse<{ url: string; thumbnailUrl: string; width: number; height: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string; thumbnailUrl: string; width: number; height: number }>>(
      `${this.baseUrl}/upload`,
      formData
    );
  }

  // 7.2 Delete Media Asset
  deleteImage(url: string): Observable<ApiResponse<null>> {
    return this.http.request<ApiResponse<null>>('DELETE', this.baseUrl, {
      body: { url }
    });
  }
}
```

---

### 4.8 MetaService (3 APIs)

Create `src/app/services/meta.service.ts`:

```typescript
// src/app/services/meta.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/meta`;

  // 8.1 Cities & Localities
  getCities(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/cities`);
  }

  // 8.2 Brands & Models Catalog
  getBrands(): Observable<ApiResponse<{ brand: string; models: string[] }[]>> {
    return this.http.get<ApiResponse<{ brand: string; models: string[] }[]>>(`${this.baseUrl}/brands`);
  }

  // 8.3 Fair-Market Valuation Estimator
  estimatePrice(params: {
    model: string;
    storage?: string;
    condition?: string;
    batteryHealth?: number;
  }): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/price-estimator`, { params });
  }
}
```

---

### 4.9 AdminService (4 APIs)

Create `src/app/services/admin.service.ts`:

```typescript
// src/app/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  // 9.1 Pending Storefronts
  getPendingShops(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/shops/pending`);
  }

  // 9.2 Physical Store Verification
  verifyShop(shopId: string, verified: boolean = true, notes?: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/shops/${shopId}/verify`, { verified, notes });
  }

  // 9.3 Platform-wide Statistics
  getPlatformStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/stats`);
  }

  // 9.4 Moderation Flag / Hide / Restore
  flagListing(phoneId: string, action: 'hide' | 'restore' | 'delete', reason?: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/listings/${phoneId}/flag`, { action, reason });
  }
}
```

---

## 5. Component Wiring Examples

### 5.1 Connecting `HomeComponent`
In `src/app/pages/home/home.component.ts`:
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { MarketplaceService } from '../../services/marketplace.service';
import { MetaService } from '../../services/meta.service';

@Component({ ... })
export class HomeComponent implements OnInit {
  marketplace = inject(MarketplaceService);
  meta = inject(MetaService);

  ngOnInit() {
    this.marketplace.loadPhones().subscribe();
    this.marketplace.loadFeatured().subscribe();
  }

  onCityChange(city: string) {
    this.marketplace.currentCity.set(city);
    this.marketplace.loadPhones({ city }).subscribe();
    this.marketplace.loadFeatured(city).subscribe();
  }
}
```

### 5.2 WhatsApp Click-to-Chat in `PhoneDetailComponent`
In `src/app/pages/phone-detail/phone-detail.component.ts`:
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarketplaceService } from '../../services/marketplace.service';
import { LeadService } from '../../services/lead.service';

@Component({ ... })
export class PhoneDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private marketplace = inject(MarketplaceService);
  private leadService = inject(LeadService);

  phone = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.marketplace.getPhoneById(id).subscribe(res => {
      if (res.success) this.phone.set(res.data);
    });
  }

  onChatWhatsApp() {
    this.leadService.initiateInquiry(this.phone().id, 'whatsapp').subscribe();
  }

  onCallShop() {
    this.leadService.initiateInquiry(this.phone().id, 'call').subscribe();
  }
}
```

### 5.3 Seller Dashboard Table Actions (`SellerDashboardComponent`)
In `src/app/pages/seller-dashboard/seller-dashboard.component.ts`:
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { MarketplaceService } from '../../services/marketplace.service';
import { AuthService } from '../../services/auth.service';

@Component({ ... })
export class SellerDashboardComponent implements OnInit {
  analytics = inject(AnalyticsService);
  marketplace = inject(MarketplaceService);
  auth = inject(AuthService);

  stats = signal<any>(null);

  ngOnInit() {
    const shopId = this.auth.currentUser()?.shopId || 'shop_01';
    this.analytics.getDashboard(shopId).subscribe(res => {
      if (res.success) this.stats.set(res.data);
    });
  }

  onPriceChange(phoneId: string, newPrice: number) {
    this.marketplace.updatePrice(phoneId, newPrice).subscribe();
  }

  onToggleSold(phoneId: string, currentStatus: boolean) {
    this.marketplace.toggleSold(phoneId, !currentStatus).subscribe();
  }
}
```
