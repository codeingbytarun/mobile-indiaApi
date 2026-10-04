# 📱 MobiMarket — UI Developer Integration Guide

> **Target:** Frontend / UI Developer  
> **Backend API URL:** `http://localhost:3000/api/v1`  
> **Key Update:** The backend now connects to **MongoDB Atlas** and supports **100% Free Email OTP delivery** (via Gmail SMTP) in addition to phone authentication.

---

## 📌 Summary of Changes Needed in the UI

1. **Authentication Form Update**:
   - Allow users to enter an **Email address** (or phone number) to receive a 6-digit verification code.
   - Users receive real emails from **MobiMarket** with a branded HTML template and their 6-digit code.
2. **Two-Step Modal Flow**:
   - **Step 1 (Input)**: User enters their email (or phone) and clicks *"Get Verification Code"*.
   - **Step 2 (Verify)**: User enters the 6-digit OTP + optional name, then clicks *"Verify & Continue"*.
3. **Session & Token Storage**:
   - On successful verification, the API returns a JWT `token`, `refreshToken`, and the `user` object.
   - Store these in `localStorage` and set the authenticated state.

---

## 🚀 Step 1: Update TypeScript Models

File to update: **`src/app/models/user.model.ts`**

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
  expiresInSeconds: number;
  delivered?: boolean;
  devOtp?: string;
}

export interface AuthVerifyResponse {
  token: string;
  refreshToken: string;
  user: UserSession;
}
```

---

## 🚀 Step 2: Update AuthService

File to update: **`src/app/services/auth.service.ts`**

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { UserSession, AuthVerifyResponse, SendOtpResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<UserSession | null>(this.loadStoredUser());
  readonly isAuthenticated = signal<boolean>(!!localStorage.getItem('mobimarket_token'));

  /**
   * 1. Send OTP to Email or Phone
   * Example: authService.sendOtp({ email: 'user@gmail.com' })
   */
  sendOtp(target: { email?: string; phone?: string; channel?: 'email' | 'sms' }): Observable<ApiResponse<SendOtpResponse>> {
    return this.http.post<ApiResponse<SendOtpResponse>>(`${this.baseUrl}/send-otp`, target);
  }

  /**
   * 2. Verify OTP & Auto-Register/Login
   * Example: authService.verifyOtp({ email: 'user@gmail.com', otp: '123456', sessionId: '...' })
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
   * 3. Resend OTP Code
   */
  resendOtp(payload: { sessionId?: string; email?: string; phone?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/resend-otp`, payload);
  }

  /**
   * 4. Logout
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

## 🚀 Step 3: Auth Modal Component Implementation

### 3.1 Component Logic (`src/app/components/auth-modal/auth-modal.component.ts`)

```typescript
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  }

  sendOtp() {
    this.errorMessage.set('');
    
    if (this.authMode() === 'email') {
      if (!this.email || !this.email.includes('@')) {
        this.errorMessage.set('Please enter a valid email address');
        return;
      }
    } else {
      if (!this.phone || this.phone.length < 10) {
        this.errorMessage.set('Please enter a valid 10-digit phone number');
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
          this.successMessage.set(
            this.authMode() === 'email'
              ? `Verification code sent to ${this.email}`
              : `Verification code sent to +91 ${this.phone}`
          );
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
    if (!this.otp || this.otp.length < 6) {
      this.errorMessage.set('Please enter the 6-digit code');
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
          this.close.emit(); // Success: close the modal
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
      ...(this.authMode() === 'email' ? { email: this.email } : { phone: this.phone })
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data?.sessionId) {
          this.sessionId = res.data.sessionId;
        }
        this.successMessage.set('A new OTP has been sent!');
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

---

### 3.2 Component Template (`src/app/components/auth-modal/auth-modal.component.html`)

```html
<div class="modal-backdrop" (click)="close.emit()">
  <div class="modal-card" (click)="$event.stopPropagation()">
    
    <!-- Close Button -->
    <button class="close-btn" (click)="close.emit()">&times;</button>

    <!-- Header -->
    <div class="modal-header">
      <h2 class="title">Welcome to Mobi<span>Market</span></h2>
      <p class="subtitle">
        {{ step() === 'input' ? 'Sign in or create your account in seconds' : 'Enter the 6-digit code' }}
      </p>
    </div>

    <!-- Mode Selector Tabs (Step 1 only) -->
    <div class="tabs" *ngIf="step() === 'input'">
      <button 
        type="button" 
        [class.active]="authMode() === 'email'" 
        (click)="switchMode('email')">
        ✉️ Email (Free OTP)
      </button>
      <button 
        type="button" 
        [class.active]="authMode() === 'phone'" 
        (click)="switchMode('phone')">
        📱 Mobile Phone
      </button>
    </div>

    <!-- Alerts -->
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
          placeholder="e.g. name@gmail.com" 
          required 
          autofocus />
      </div>

      <div class="form-group" *ngIf="authMode() === 'phone'">
        <label>Mobile Number</label>
        <div class="phone-input">
          <span class="prefix">+91</span>
          <input 
            type="tel" 
            [(ngModel)]="phone" 
            name="phone" 
            placeholder="10-digit number" 
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
        <label>Your Name (Optional)</label>
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
          Resend code <span *ngIf="resendCountdown() > 0">in ({{ resendCountdown() }}s)</span>
        </button>
        <button type="button" class="link-btn change-btn" (click)="step.set('input')">
          Change {{ authMode() }}
        </button>
      </div>
    </form>

  </div>
</div>
```

---

### 3.3 Component Styles (`src/app/components/auth-modal/auth-modal.component.css`)

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
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
  padding: 32px 28px;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
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

/* Tabs */
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
  transition: all 0.2s ease;
}

.tabs button.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Alerts */
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

/* Form */
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
  transition: border-color 0.2s;
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

/* Submit Button */
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
  transition: background 0.2s;
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

## 🧪 Testing Notes for the Developer

1. **Email OTP**:
   - Provide any real email (e.g., your own Gmail).
   - Check your inbox (or Spam/Updates).
   - Enter the 6-digit code received in the email.
2. **Fast Development Bypass**:
   - If testing locally without wanting to check email every time, you can always enter master test code **`482910`** or **`123456`**.
3. **Database Confirmation**:
   - Every registered user is permanently saved to the **MongoDB Atlas** database cluster.
