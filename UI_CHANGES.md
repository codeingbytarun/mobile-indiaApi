# 📱 MobiMarket — Master UI & API Integration Guide (Angular)

> **Backend API Base URL:** `http://localhost:3000/api/v1`  
> **Target Angular App:** `Mobile-india`  
> **MongoDB Database:** Connected via MongoDB Atlas  
> **OTP System:** 100% Free Email OTP (Nodemailer via Gmail SMTP)

---

## 📑 Table of Contents
1. [Backend Overview & Smart Login Flow](#1-backend-overview--smart-login-flow)
2. [TypeScript Models (`src/app/models/`)](#2-typescript-models)
3. [Authentication Service (`src/app/services/auth.service.ts`)](#3-authentication-service)
4. [Auth Modal Component (`src/app/components/auth-modal/`)](#4-auth-modal-component)
5. [Role Guard & Routing Configuration](#5-role-guard--routing-configuration)
6. [Seller Dashboard (`src/app/pages/seller-dashboard/`)](#6-seller-dashboard)
7. [Navbar Navigation by Role](#7-navbar-navigation-by-role)
8. [Complete API Reference & Endpoints](#8-complete-api-reference--endpoints)

---

## 1. Backend Overview & Smart Login Flow

1. **Free Email OTP Delivery**: Real 6-digit verification codes sent directly to Gmail / email inboxes at ₹0 cost.
2. **Smart Shopkeeper Login (Phone ➡️ Email OTP)**:
   - When a shopkeeper enters their mobile number, the API automatically finds their registered shop email and routes the OTP there.
   - The response includes `sentToEmail: "ra*****m@gmail.com"` so the UI can notify the user which inbox to check.
3. **Role Separation**:
   - **Buyer / Guest**: Browses the public phone marketplace at `/`.
   - **Shopkeeper**: Lands directly on the Seller Dashboard at `/seller/dashboard`.
4. **Listing Management**:
   - Shopkeepers can add, edit price, toggle sold/active, and permanently delete their devices.

---

## 2. TypeScript Models

### File: `src/app/models/api-response.model.ts`
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  error?: string;
  timestamp?: string;
  path?: string;
}
```

### File: `src/app/models/user.model.ts`
```typescript
export interface UserSession {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: 'buyer' | 'shopkeeper' | 'admin';
  shopId?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface SendOtpResponse {
  sessionId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  email?: string;
  phone?: string;
  sentToEmail?: string; // Present when phone was resolved to a shopkeeper's email
  expiresInSeconds: number;
  delivered?: boolean;
  devOtp?: string;
}

export interface AuthVerifyResponse {
  token: string;
  refreshToken: string;
  user: UserSession;
}

export interface ShopRegistrationData {
  ownerName: string;
  email: string; // Unique business email
  phone: string; // Unique shop phone
  whatsapp?: string;
  shopName: string;
  address: string;
  locality: string;
  city: string;
  openHours?: string;
  image?: string;
  googleMapsUrl?: string;
}

export interface PhoneListing {
  id: string;
  customId?: string;
  brand: string;
  model: string;
  ram?: string;
  storage: string;
  color?: string;
  price: number;
  mrp: number;
  condition: 'Like New' | 'Excellent' | 'Good' | 'Fair';
  batteryHealth?: number;
  billBoxAvailable: boolean;
  warranty?: string;
  shopId: string;
  shopName: string;
  shopLocality: string;
  shopCity: string;
  shopPhone: string;
  shopWhatsapp?: string;
  images: string[];
  isSold: boolean;
  isFeatured?: boolean;
  viewsCount?: number;
  leadsCount?: number;
  createdAt?: string;
}

export interface CustomerLead {
  id: string;
  customId?: string;
  shopId: string;
  phoneId?: string;
  phoneModel: string;
  buyerName: string;
  buyerPhone: string;
  channel: 'whatsapp' | 'call';
  status: 'new' | 'contacted' | 'sold' | 'lost';
  createdAt: string;
}
```

---

## 3. Authentication Service

### File: `src/app/services/auth.service.ts`
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { 
  UserSession, 
  AuthVerifyResponse, 
  SendOtpResponse, 
  ShopRegistrationData 
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<UserSession | null>(this.loadStoredUser());
  readonly isAuthenticated = signal<boolean>(!!localStorage.getItem('mobimarket_token'));

  /**
   * 1. Send OTP
   * POST http://localhost:3000/api/v1/auth/send-otp
   */
  sendOtp(target: { email?: string; phone?: string; channel?: 'email' | 'sms' }): Observable<ApiResponse<SendOtpResponse>> {
    return this.http.post<ApiResponse<SendOtpResponse>>(`${this.baseUrl}/send-otp`, target);
  }

  /**
   * 2. Verify OTP & Auto-Register/Login
   * POST http://localhost:3000/api/v1/auth/verify-otp
   */
  verifyOtp(payload: {
    email?: string;
    phone?: string;
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

  /**
   * 3. Resend OTP
   * POST http://localhost:3000/api/v1/auth/resend-otp
   */
  resendOtp(payload: { sessionId?: string; email?: string; phone?: string }): Observable<ApiResponse<SendOtpResponse>> {
    return this.http.post<ApiResponse<SendOtpResponse>>(`${this.baseUrl}/resend-otp`, payload);
  }

  /**
   * 4. Register Shopkeeper (Business Email & Phone must be unique)
   * POST http://localhost:3000/api/v1/auth/register-shopkeeper
   */
  registerShopkeeper(shopData: ShopRegistrationData): Observable<ApiResponse<{ token: string; shop: any }>> {
    return this.http.post<ApiResponse<{ token: string; shop: any }>>(`${this.baseUrl}/register-shopkeeper`, shopData).pipe(
      tap(res => {
        if (res.success && res.data?.token) {
          localStorage.setItem('mobimarket_token', res.data.token);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  /**
   * 5. Logout
   */
  logout(): void {
    localStorage.removeItem('mobimarket_token');
    localStorage.removeItem('mobimarket_refresh_token');
    localStorage.removeItem('mobimarket_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private loadStoredUser(): UserSession | null {
    try {
      const stored = localStorage.getItem('mobimarket_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
```

---

## 4. Auth Modal Component

### File: `src/app/components/auth-modal/auth-modal.component.ts`
```typescript
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() close = new EventEmitter<void>();

  authMode = signal<'email' | 'phone'>('email');
  step = signal<'input' | 'otp'>('input');
  
  email = '';
  phone = '';
  name = '';
  otp = '';
  sessionId = '';

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  resendCountdown = signal<number>(0);
  private timer: any;

  switchMode(mode: 'email' | 'phone') {
    this.authMode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  sendOtp() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.authMode() === 'email') {
      if (!this.email || !this.email.includes('@')) {
        this.errorMessage.set('Please enter a valid email address');
        return;
      }
    } else {
      if (!this.phone || this.phone.replace(/\D/g, '').length < 10) {
        this.errorMessage.set('Please enter a valid 10-digit mobile number');
        return;
      }
    }

    this.isLoading.set(true);
    const payload = this.authMode() === 'email' 
      ? { email: this.email.trim() } 
      : { phone: this.phone.trim() };

    this.authService.sendOtp(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.sessionId = res.data.sessionId;
          this.step.set('otp');

          // Smart messaging: If phone was resolved to a shopkeeper email, notify the user!
          if (res.data.sentToEmail) {
            this.successMessage.set(`OTP sent to your registered email (${res.data.sentToEmail})`);
          } else if (this.authMode() === 'email') {
            this.successMessage.set(`Verification code sent to ${this.email}`);
          } else {
            this.successMessage.set(`Verification code sent to +91 ${this.phone}`);
          }

          this.startCountdown();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send OTP code');
      }
    });
  }

  verifyOtp() {
    if (!this.otp || this.otp.trim().length < 6) {
      this.errorMessage.set('Please enter the 6-digit verification code');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = {
      ...(this.authMode() === 'email' ? { email: this.email.trim() } : { phone: this.phone.trim() }),
      otp: this.otp.trim(),
      sessionId: this.sessionId,
      name: this.name ? this.name.trim() : undefined,
      roleHint: 'buyer' as const
    };

    this.authService.verifyOtp(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.close.emit();

          // Role-based redirect
          if (res.data.user.role === 'shopkeeper') {
            this.router.navigate(['/seller/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid or expired OTP');
      }
    });
  }

  resendOtp() {
    if (this.resendCountdown() > 0) return;

    this.isLoading.set(true);
    this.authService.resendOtp({
      sessionId: this.sessionId,
      ...(this.authMode() === 'email' ? { email: this.email.trim() } : { phone: this.phone.trim() })
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data?.sessionId) {
          this.sessionId = res.data.sessionId;
        }
        this.successMessage.set(
          res.data?.sentToEmail
            ? `New code sent to ${res.data.sentToEmail}`
            : 'A new verification code has been sent!'
        );
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to resend code');
      }
    });
  }

  startCountdown() {
    this.resendCountdown.set(30);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        clearInterval(this.timer);
        this.resendCountdown.set(0);
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }
}
```

### File: `src/app/components/auth-modal/auth-modal.component.html`
```html
<div class="modal-backdrop" (click)="close.emit()">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <button class="close-btn" (click)="close.emit()">&times;</button>

    <div class="modal-header">
      <h2 class="title">Welcome to Mobi<span>Market</span></h2>
      <p class="subtitle">
        {{ step() === 'input' ? 'Sign in or create your account' : 'Enter the 6-digit code' }}
      </p>
    </div>

    <!-- Mode Selector Tabs (Step 1 only) -->
    <div class="tabs" *ngIf="step() === 'input'">
      <button 
        type="button" 
        [class.active]="authMode() === 'email'" 
        (click)="switchMode('email')">
        ✉️ Email (Instant Code)
      </button>
      <button 
        type="button" 
        [class.active]="authMode() === 'phone'" 
        (click)="switchMode('phone')">
        📱 Mobile Phone
      </button>
    </div>

    <!-- Alert Messages -->
    <div class="alert error" *ngIf="errorMessage()">{{ errorMessage() }}</div>
    <div class="alert success" *ngIf="successMessage() && !errorMessage()">{{ successMessage() }}</div>

    <!-- STEP 1: Enter Email / Phone -->
    <form *ngIf="step() === 'input'" (ngSubmit)="sendOtp()">
      <div class="form-group" *ngIf="authMode() === 'email'">
        <label>Email Address</label>
        <input 
          type="email" 
          [(ngModel)]="email" 
          name="email" 
          placeholder="e.g. yourname@gmail.com" 
          required 
          autofocus />
      </div>

      <div class="form-group" *ngIf="authMode() === 'phone'">
        <label>Mobile / Business Phone</label>
        <div class="phone-input">
          <span class="prefix">+91</span>
          <input 
            type="tel" 
            [(ngModel)]="phone" 
            name="phone" 
            placeholder="10-digit mobile number" 
            maxlength="10" 
            required />
        </div>
      </div>

      <button type="submit" class="submit-btn" [disabled]="isLoading()">
        <span *ngIf="!isLoading()">Get Verification Code &rarr;</span>
        <span *ngIf="isLoading()">Sending code...</span>
      </button>
    </form>

    <!-- STEP 2: Enter OTP -->
    <form *ngIf="step() === 'otp'" (ngSubmit)="verifyOtp()">
      <div class="form-group">
        <label>6-Digit Verification Code</label>
        <input 
          type="text" 
          class="otp-input" 
          [(ngModel)]="otp" 
          name="otp" 
          maxlength="6" 
          placeholder="••••••" 
          required 
          autofocus />
      </div>

      <div class="form-group">
        <label>Your Name (Optional for new users)</label>
        <input 
          type="text" 
          [(ngModel)]="name" 
          name="name" 
          placeholder="e.g. Tarun Baliyan" />
      </div>

      <button type="submit" class="submit-btn" [disabled]="isLoading()">
        <span *ngIf="!isLoading()">Verify & Continue</span>
        <span *ngIf="isLoading()">Verifying...</span>
      </button>

      <div class="resend-row">
        <button 
          type="button" 
          class="link-btn" 
          (click)="resendOtp()" 
          [disabled]="resendCountdown() > 0 || isLoading()">
          Resend code <span *ngIf="resendCountdown() > 0">({{ resendCountdown() }}s)</span>
        </button>
        <button type="button" class="link-btn change-btn" (click)="step.set('input')">
          Change {{ authMode() }}
        </button>
      </div>
    </form>
  </div>
</div>
```

### File: `src/app/components/auth-modal/auth-modal.component.css`
```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 20px;
  padding: 34px 30px;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  animation: modalFadeIn 0.25s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 18px;
  background: none;
  border: none;
  font-size: 28px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.title span {
  color: #4f46e5;
}

.subtitle {
  margin: 6px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.tabs {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
}

.tabs button.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.alert.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert.success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
  outline: none;
}

input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.phone-input {
  display: flex;
  align-items: center;
}

.phone-input .prefix {
  padding: 12px 14px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-right: none;
  border-radius: 10px 0 0 10px;
  font-size: 14px;
  color: #64748b;
}

.phone-input input {
  border-radius: 0 10px 10px 0;
}

.otp-input {
  font-family: monospace;
  font-size: 26px;
  letter-spacing: 12px;
  text-align: center;
  font-weight: 700;
  color: #4f46e5;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: #4338ca;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.resend-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.link-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
}

.link-btn:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.change-btn {
  color: #64748b;
}
```

---

## 5. Role Guard & Routing Configuration

### File: `src/app/guards/seller.guard.ts`
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const sellerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (authService.isAuthenticated() && user?.role === 'shopkeeper') {
    return true;
  }

  router.navigate(['/']);
  return false;
};
```

### File: `src/app/app.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { sellerGuard } from './guards/seller.guard';

export const routes: Routes = [
  // 1. Public Marketplace for Guests & Buyers
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  // 2. Separate Seller Dashboard for Shopkeepers
  {
    path: 'seller/dashboard',
    canActivate: [sellerGuard],
    loadComponent: () => import('./pages/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

---

## 6. Seller Dashboard

### File: `src/app/pages/seller-dashboard/seller-dashboard.component.ts`
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { PhoneListing, CustomerLead } from '../../models/user.model';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.css']
})
export class SellerDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  authService = inject(AuthService);

  shopId = signal<string>('');
  stats = signal<any>({
    activeInventoryCount: 0,
    soldCount: 0,
    leadsToday: 0,
    leadsTotal: 0,
    viewsToday: 0,
    viewsTotal: 0,
    totalInventoryValue: 0
  });

  myPhones = signal<PhoneListing[]>([]);
  leads = signal<CustomerLead[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user && user.shopId) {
      this.shopId.set(user.shopId);
      this.loadDashboardData(user.shopId);
    }
  }

  loadDashboardData(shopId: string) {
    this.isLoading.set(true);

    // 1. Fetch Metrics: GET /analytics/dashboard/:shopId
    this.http.get<any>(`${environment.apiUrl}/analytics/dashboard/${shopId}`).subscribe({
      next: (res) => {
        if (res.success && res.data) this.stats.set(res.data);
      }
    });

    // 2. Fetch Shop Phones (Active + Sold): GET /phones?shopId=:id&includeSold=true
    this.http.get<any>(`${environment.apiUrl}/phones?shopId=${shopId}&includeSold=true`).subscribe({
      next: (res) => {
        if (res.success && res.data) this.myPhones.set(res.data);
      }
    });

    // 3. Fetch Customer Leads: GET /leads/shop/:shopId
    this.http.get<any>(`${environment.apiUrl}/leads/shop/${shopId}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) this.leads.set(res.data);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // 🏷️ Toggle Sold Status: PATCH /phones/:id/sold
  toggleSoldStatus(phoneId: string, currentStatus: boolean) {
    const nextSold = !currentStatus;
    this.http.patch<any>(`${environment.apiUrl}/phones/${phoneId}/sold`, { isSold: nextSold }).subscribe({
      next: (res) => {
        if (res.success) {
          this.myPhones.update(list => list.map(p => p.id === phoneId ? { ...p, isSold: nextSold } : p));
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to update status')
    });
  }

  // 🗑️ Delete Listing Permanently: DELETE /phones/:id
  deletePhone(phoneId: string) {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return;
    this.http.delete<any>(`${environment.apiUrl}/phones/${phoneId}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.myPhones.update(list => list.filter(p => p.id !== phoneId));
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to delete listing')
    });
  }
}
```

### File: `src/app/pages/seller-dashboard/seller-dashboard.component.html`
```html
<div class="seller-dashboard">
  <!-- Top Welcome Bar -->
  <div class="welcome-bar">
    <div>
      <h1 class="shop-title">🏬 Shopkeeper Dashboard</h1>
      <p class="shop-subtitle">Logged in as: <strong>{{ authService.currentUser()?.name }}</strong> (Shop ID: {{ shopId() }})</p>
    </div>
    <div class="quick-actions">
      <button class="btn btn-primary" routerLink="/seller/add-phone">➕ Add Phone Listing</button>
      <button class="btn btn-secondary" routerLink="/shops/{{ shopId() }}">🏬 View Public Shop</button>
    </div>
  </div>

  <!-- Metric Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Active Listings</div>
      <div class="stat-value text-indigo">{{ stats().activeInventoryCount }}</div>
      <div class="stat-sub">Total Phones on Sale</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Inquiries / Leads Today</div>
      <div class="stat-value text-emerald">{{ stats().leadsToday }}</div>
      <div class="stat-sub">{{ stats().leadsTotal }} Total Inquiries</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Store Views Today</div>
      <div class="stat-value text-blue">{{ stats().viewsToday }}</div>
      <div class="stat-sub">{{ stats().viewsTotal }} Total Views</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Inventory Value</div>
      <div class="stat-value text-purple">₹{{ stats().totalInventoryValue | number }}</div>
      <div class="stat-sub">{{ stats().soldCount }} Devices Sold</div>
    </div>
  </div>

  <!-- Main Content Grid -->
  <div class="content-grid">
    <!-- Section 1: My Phone Inventory -->
    <div class="card inventory-card">
      <div class="card-header">
        <h2>📱 My Phone Inventory ({{ myPhones().length }})</h2>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>RAM/Storage</th>
              <th>Price</th>
              <th>Condition</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let phone of myPhones()">
              <td><strong>{{ phone.brand }} {{ phone.model }}</strong></td>
              <td>{{ phone.ram || 'N/A' }} / {{ phone.storage }}</td>
              <td class="price">₹{{ phone.price | number }}</td>
              <td><span class="badge">{{ phone.condition }}</span></td>
              <td>
                <span class="badge" [class.badge-sold]="phone.isSold" [class.badge-active]="!phone.isSold">
                  {{ phone.isSold ? 'Sold' : 'Active' }}
                </span>
              </td>
              <td class="action-buttons">
                <!-- Toggle Sold / Relist -->
                <button 
                  class="btn-sm" 
                  [ngClass]="phone.isSold ? 'btn-outline-success' : 'btn-outline-warning'" 
                  (click)="toggleSoldStatus(phone.id, phone.isSold)">
                  {{ phone.isSold ? '🔄 Relist' : '🏷️ Mark Sold' }}
                </button>
                <!-- Delete -->
                <button 
                  class="btn-sm btn-outline-danger" 
                  (click)="deletePhone(phone.id)" 
                  title="Permanently Delete Listing">
                  🗑️ Delete
                </button>
              </td>
            </tr>
            <tr *ngIf="myPhones().length === 0">
              <td colspan="6" class="text-center text-muted py-4">No phone listings yet. Click 'Add Phone Listing' to list your first device!</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 2: Recent Customer Leads -->
    <div class="card leads-card">
      <div class="card-header">
        <h2>💬 Customer Inquiries / Leads ({{ leads().length }})</h2>
      </div>
      <div class="leads-list">
        <div class="lead-item" *ngFor="let lead of leads()">
          <div class="lead-info">
            <h4 class="lead-name">{{ lead.buyerName }}</h4>
            <p class="lead-model">Interested in: <strong>{{ lead.phoneModel }}</strong></p>
            <p class="lead-phone">📞 {{ lead.buyerPhone }} &bull; Via {{ lead.channel | uppercase }}</p>
          </div>
          <span class="status-pill status-{{ lead.status | lowercase }}">{{ lead.status }}</span>
        </div>
        <div *ngIf="leads().length === 0" class="text-muted text-center py-4">
          No inquiries yet. When buyers contact via WhatsApp or Call, leads will appear here.
        </div>
      </div>
    </div>
  </div>
</div>
```

### File: `src/app/pages/seller-dashboard/seller-dashboard.component.css`
```css
.seller-dashboard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
}

.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.shop-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.shop-subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: #ffffff;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  margin: 8px 0 4px 0;
}

.text-indigo { color: #4f46e5; }
.text-emerald { color: #10b981; }
.text-blue { color: #0284c7; }
.text-purple { color: #8b5cf6; }

.stat-sub {
  font-size: 12px;
  color: #94a3b8;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 24px;
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th, .data-table td {
  padding: 14px 20px;
  font-size: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.data-table th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
}

.price {
  font-weight: 700;
  color: #0f172a;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
}

.badge-active {
  background: #ecfdf5;
  color: #059669;
}

.badge-sold {
  background: #fef2f2;
  color: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-sm {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline-warning {
  border: 1px solid #f59e0b;
  background: transparent;
  color: #d97706;
}

.btn-outline-warning:hover {
  background: #fef3c7;
}

.btn-outline-success {
  border: 1px solid #10b981;
  background: transparent;
  color: #059669;
}

.btn-outline-success:hover {
  background: #ecfdf5;
}

.btn-outline-danger {
  border: 1px solid #f87171;
  background: transparent;
  color: #dc2626;
}

.btn-outline-danger:hover {
  background: #fef2f2;
}

.leads-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lead-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.lead-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.lead-model {
  margin: 4px 0 2px 0;
  font-size: 13px;
  color: #475569;
}

.lead-phone {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.status-pill {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
}

.status-new { background: #dbeafe; color: #1d4ed8; }
.status-contacted { background: #fef3c7; color: #b45309; }
.status-sold { background: #dcfce7; color: #15803d; }
```

---

## 7. Navbar Navigation by Role

### File: `src/app/components/navbar/navbar.component.html`
```html
<!-- If Shopkeeper Logged In: Show Seller Tools -->
<ng-container *ngIf="authService.currentUser()?.role === 'shopkeeper'">
  <a routerLink="/seller/dashboard" class="nav-link font-bold text-indigo">📊 Seller Dashboard</a>
  <a routerLink="/seller/add-phone" class="nav-link">➕ Add Listing</a>
  <a routerLink="/shops/{{ authService.currentUser()?.shopId }}" class="nav-link">🏬 My Shop</a>
  <button (click)="authService.logout()" class="btn-logout">Logout</button>
</ng-container>

<!-- If Buyer Logged In: Show Cart & Inquiries -->
<ng-container *ngIf="authService.currentUser()?.role === 'buyer'">
  <a routerLink="/" class="nav-link">📱 Browse Phones</a>
  <a routerLink="/buyer/cart" class="nav-link">🛒 Cart</a>
  <a routerLink="/buyer/my-inquiries" class="nav-link">💬 My Inquiries</a>
  <button (click)="authService.logout()" class="btn-logout">Logout</button>
</ng-container>

<!-- If Not Logged In: Show Browse & Sign In -->
<ng-container *ngIf="!authService.isAuthenticated()">
  <a routerLink="/" class="nav-link">📱 Browse Phones</a>
  <a routerLink="/shops" class="nav-link">🏬 Verified Shops</a>
  <button (click)="openAuthModal()" class="btn-primary">Sign In / Register</button>
</ng-container>
```

---

## 8. Complete API Reference & Endpoints

Base URL: `http://localhost:3000/api/v1`

### 🔑 Authentication APIs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/send-otp` | Public | Send 6-digit OTP code to email or phone |
| `POST` | `/auth/verify-otp` | Public | Verify OTP & return JWT token + user session |
| `POST` | `/auth/resend-otp` | Public | Resend OTP code |
| `POST` | `/auth/register-shopkeeper` | Public | Register new shop with unique business email/phone |
| `GET` | `/auth/me` | Bearer | Get current user profile |

#### `POST /auth/send-otp`
- **Body**: `{ "email": "user@gmail.com" }` or `{ "phone": "9829011111" }`
- **Response**: `{ "success": true, "data": { "sessionId": "...", "expiresInSeconds": 600, "sentToEmail": "..." } }`

#### `POST /auth/verify-otp`
- **Body**: `{ "email": "user@gmail.com", "otp": "883473", "sessionId": "..." }`
- **Response**: `{ "success": true, "data": { "token": "...", "user": { "role": "shopkeeper", "shopId": "shop_01" } } }`

---

### 📱 Phone Listing APIs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/phones` | Public | Browse phones with filters (`city`, `brand`, `shopId`, `includeSold`, `minPrice`, `maxPrice`, `condition`, `storage`) |
| `GET` | `/phones/featured` | Public | Top 10 featured devices |
| `GET` | `/phones/:id` | Public | Single phone listing details (increments views count) |
| `GET` | `/phones/compare?model=iPhone+13` | Public | Compare listings across multiple shops |
| `POST` | `/phones` | Bearer (`shopkeeper`) | Create a new phone listing |
| `PUT` | `/phones/:id` | Bearer (`shopkeeper`) | Update phone listing |
| `PATCH` | `/phones/:id/sold` | Bearer (`shopkeeper`) | **Mark listing as Sold or Active** |
| `PATCH` | `/phones/:id/price` | Bearer (`shopkeeper`) | Quick price update |
| `DELETE` | `/phones/:id` | Bearer (`shopkeeper`) | **Delete phone listing permanently** |

#### `PATCH /phones/:id/sold`
- **Headers**: `Authorization: Bearer <token>`
- **Body** (optional): `{ "isSold": true }` or `{ "isSold": false }`
- **Response**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Listing marked as Sold",
    "data": { "isSold": true }
  }
  ```

#### `DELETE /phones/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Listing deleted successfully",
    "data": null
  }
  ```

#### `GET /phones?shopId=:id&includeSold=true`
- **Description**: Returns all phone listings belonging to that shop (both Active and Sold).

---

### 🏬 Shop APIs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/shops` | Public | List verified shops with filters |
| `GET` | `/shops/:idOrSlug` | Public | Shop profile + active inventory |
| `PUT` | `/shops/:id` | Bearer (`shopkeeper`) | Update shop details |
| `GET` | `/shops/check-slug/:slug` | Public | Check if custom shop URL slug is available |
| `GET` | `/shops/:id/qr` | Public | Generate shop QR code |
| `GET` | `/shops/:id/reviews` | Public | Shop reviews & ratings |
| `POST` | `/shops/:id/reviews` | Optional | Add review for shop |

---

### 📊 Analytics & Leads APIs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics/dashboard/:shopId` | Bearer (`shopkeeper`) | Get seller dashboard metrics (active count, leads today, views today, inventory value) |
| `GET` | `/leads/shop/:shopId` | Bearer (`shopkeeper`) | Fetch customer inquiries/leads for shop |
| `POST` | `/leads` | Public | Create new lead when buyer clicks WhatsApp or Call |

---

### 🛒 Buyer Cart APIs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/buyer/cart` | Bearer (`buyer`) | **Add phone to cart** |
| `GET` | `/buyer/cart` | Bearer (`buyer`) | **Get cart items, total price & savings** |
| `DELETE` | `/buyer/cart/:phoneId` | Bearer (`buyer`) | **Remove specific phone from cart** |
| `DELETE` | `/buyer/cart` | Bearer (`buyer`) | **Clear entire cart** |
| `POST` | `/buyer/cart/sync` | Bearer (`buyer`) | **Sync guest localStorage items on login** |

#### 1. Add to Cart (`POST /buyer/cart`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "phoneId": "ph_01"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Phone added to cart",
    "data": {
      "cartCount": 1
    }
  }
  ```

#### 2. Get Cart (`GET /buyer/cart`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cart fetched successfully",
    "data": {
      "itemsCount": 2,
      "totalPrice": 62999,
      "totalMrp": 89999,
      "totalSavings": 27000,
      "items": [
        {
          "id": "ph_01",
          "brand": "OnePlus",
          "model": "11R 5G",
          "storage": "128GB",
          "price": 34999,
          "mrp": 49999,
          "condition": "Like New",
          "images": ["https://images.unsplash.com/..."],
          "shopId": "shop_01",
          "shopName": "Sharma Mobile Hub",
          "shopLocality": "Malviya Nagar",
          "shopCity": "Jaipur",
          "shopPhone": "9829011111",
          "shopWhatsapp": "9829011111"
        }
      ]
    }
  }
  ```

#### 3. Remove Item (`DELETE /buyer/cart/:phoneId`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Item removed from cart",
    "data": null
  }
  ```

#### 4. Sync Guest Cart on Login (`POST /buyer/cart/sync`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "phoneIds": ["ph_01", "ph_02"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cart synchronized successfully",
    "data": {
      "itemsCount": 2
    }
  }
  ```

