# 📅 ระบบจัดตารางเรียน (Timetable System)

![Next.js](https://img.shields.io/badge/Next.js-15.5.29-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.16.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24.15-B845ED?style=for-the-badge&logo=auth0&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-157_Pass-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-37_Pass-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

ระบบจัดตารางเรียนอัตโนมัติ สำหรับสถาบันการศึกษา พัฒนาด้วย Next.js 15 และ Prisma ORM รองรับการจัดตารางเรียนหลายหลักสูตร (หลักสูตร 4 ปี, เทียบโอน, อาชีวศึกษา DVE-LVC และ DVE-MS) พร้อมระบบจัดการห้องเรียน อาจารย์ผู้สอน ปฏิทินการศึกษา ระบบป้องกันการชนกันของตารางแบบ Pessimistic Concurrency Locking, การยืนยันตัวตนผู้สอนความปลอดภัยสูงด้วย scrypt KDF และระบบ Export ไฟล์ Excel แบบ On-Demand โหลดเร็วระดับ Enterprise

> จัดทำโดย **DekCom** (พัฒนาและปรับปรุงสถาปัตยกรรมระดับ Production-Ready)

---

## 📋 สารบัญ

- [Technology Stack](#-technology-stack)
- [Architecture & Feature Highlights](#-architecture--feature-highlights)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Security & Concurrency Hardening](#-security--concurrency-hardening)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Production Deployment](#-production-deployment)
- [Database Schema](#-database-schema)
- [License](#-license)

---

## 🛠 Technology Stack

| หมวดหมู่ | เทคโนโลยี / เครื่องมือ | เวอร์ชัน | หมายเหตุ |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.5.29 | Server Components, Turbopack Build |
| **Language** | TypeScript | ^5.8.3 | Strict Mode 100% Type-Safe |
| **UI Library** | React | 19.1.0 | Action Hooks, Optimized Memoization |
| **Styling** | Tailwind CSS | ^4.1.10 | CSS Variables, Oklch Colors |
| **UI Components** | shadcn/ui + Radix UI | — | Accessible, Themeable Components |
| **Icons** | Lucide React | ^0.515.0 | Vector Icons |
| **ORM** | Prisma Client | 6.16.1 | Versioned Migrations, Connection Pooling |
| **Database** | MySQL | 8.0+ | InnoDB, ACID Transactions, UTF8MB4 |
| **Authentication** | NextAuth.js (Credentials) | ^4.24.15 | JWT Session, Revocation Support |
| **Password Hashing** | Node.js Crypto (scrypt) | Native | OWASP Option 4 ($N=16384, r=8, p=5$) |
| **Drag & Drop** | @dnd-kit | ^6.3.1 | Core, Modifiers, Multi-assignment Grid |
| **Data Table** | TanStack React Table | ^8.21.3 | Server & Client-side Sorting/Filtering |
| **Date Utilities** | date-fns | ^4.1.0 | Thai Buddhist Year Calculations |
| **Excel Export** | ExcelJS | ^4.4.0 | On-Demand Lazy Loaded (~193 kB bundle) |
| **Unit/Integration Test** | Vitest | ^3.x | 157 Passing Tests (Mock & Real DB) |
| **E2E Browser Test** | Playwright (Chromium) | ^1.58.x | 37 Passing Tests across 11 Timetable Pages |
| **Package Manager** | pnpm | 11.x | Lockfile v9 strictly enforced |

---

## 🏗 Architecture & Feature Highlights

```mermaid
graph TB
    subgraph Client["🖥 Client (React 19 / Next.js App Router)"]
        Pages["11 Timetable Pages + Study Plans"]
        DnD["Pointer Drag & Drop (@dnd-kit)"]
        LazyExport["Dynamic On-Demand ExcelJS"]
        Components["shadcn/ui Design System"]
    end

    subgraph Server["⚙️ Server Layer (Next.js 15.5.29)"]
        ServiceLayer["Domain Services (Timetable, Subject, Room, Teacher, Curriculum)"]
        LockService["TimetableLockService (Transactional FOR UPDATE)"]
        AuthSecurity["TeacherAuthService (scrypt KDF + Session Revocation)"]
        AuthGuard["Route & Object-Level Authorization Guards"]
    end

    subgraph Database["🗄 Storage Layer (MySQL 8.0)"]
        PrismaORM["Prisma Client 6.16.1"]
        LockTable["TimetableLock_tb (Concurrency Locks)"]
        AuthTable["TeacherToken_tb & Teacher_tb (Credentials)"]
        TimetableDB["Timetable_tb & Plans_tb (Schedules)"]
    end

    Pages --> ServiceLayer
    DnD --> ServiceLayer
    LazyExport -.-> Pages
    ServiceLayer --> LockService
    ServiceLayer --> AuthSecurity
    AuthSecurity --> AuthGuard
    ServiceLayer --> PrismaORM
    LockService --> LockTable
    AuthSecurity --> AuthTable
    PrismaORM --> TimetableDB
```

- **Domain-Driven Service Layer:** แยก Business Logic ชัดเจนภายใต้โฟลเดอร์ `features/*` (Service Layer, Types, Validations)
- **Zero Double Booking Concurrency Engine:** ใช้ Pessimistic Locking (`SELECT ... FOR UPDATE` บน `TimetableLock_tb`) ร่วมกับ Natural Key Sorting ป้องกันการชนกันและการเกิด Deadlock
- **Performance Optimized Bundles:** โหลดโมดูล ExcelJS ขนาดใหญ่แบบ On-Demand ทำให้ First Load JS ของหน้าจัดตารางลดลงจาก 447 kB เหลือเพียง **~193 kB**
- **Dashboard Clock Isolation:** แยกคอมโพเนนต์นาฬิกา `DashboardClock` ทำให้ Dashboard ไม่ต้อง Re-render ทั้งหน้าทุกวินาที

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x หรือ 24.x LTS (แนะนำ v24.18.1)
- **pnpm** >= 10.x / 11.x (แนะนำ pnpm 11.18.0)
- **MySQL** 8.0+

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Erbiyon/cpetak-timetable.git
   cd cpetak-timetable
   ```

2. **Install dependencies** (บังคับใช้ pnpm เท่านั้น)

   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Set up environment variables**

   คัดลอกไฟล์ `.env.production.example` ไปเป็น `.env`:

   ```bash
   cp .env.production.example .env
   ```

   กำหนดค่าตัวแปรใน `.env`:

   ```env
   # Database Connection
   DATABASE_URL="mysql://root:password@localhost:3306/timetable_db"

   # NextAuth Security
   NEXTAUTH_SECRET="your-generated-openssl-base64-secret-min-32-chars"
   NEXTAUTH_URL="http://localhost:3000"

   # Administrator Credentials
   ADMIN_USERNAME="cpetak_admin"
   ADMIN_PASSWORD="YourComplexPassword123!"
   ```

4. **Deploy database migrations**

   ```bash
   pnpm exec prisma migrate deploy
   ```

5. **Generate Prisma Client**

   ```bash
   pnpm exec prisma generate
   ```

6. **Start development server**

   ```bash
   pnpm dev
   ```

   เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

---

## 📁 Project Structure

```
cpetak-timetable/
├── app/                          # Next.js App Router (Pages & API Handlers)
│   ├── api/                      # RESTful Route Handlers (Role-Protected)
│   │   ├── auth/                 #   NextAuth Authentication API
│   │   ├── teacher/              #   Teacher Enrollment & Password Reset API
│   │   ├── timetable/            #   Timetable Mutations & Safe Clear API
│   │   └── ...                   #   Curriculum, Room, Subject APIs
│   ├── adjust-time-tables/       # หน้าจัดตารางสอนทั้ง 11 หน้า
│   │   ├── adjust-plan-four-year/#   หลักสูตร 4 ปี (ปี 1 – ปี 4)
│   │   ├── adjust-plan-transfer/ #   หลักสูตรเทียบโอน (ปี 1 – ปี 3)
│   │   └── adjust-plan-dve/      #   หลักสูตรอาชีวะ DVE-LVC & DVE-MS (ปี 1 – ปี 2)
│   ├── study-plans/              # หน้าแสดงแผนการเรียน 4 หมวดหมู่
│   ├── dashboard/                # แดชบอร์ดผู้ดูแลระบบ
│   └── login/                    # หน้าเข้าสู่ระบบ (Admin & Teacher)
├── deploy/                       # แฟ้มการติดตั้งสำหรับเซิร์ฟเวอร์จริง
│   └── nginx/                    #   Nginx Reverse Proxy, TLS & Rate Limiting Config
├── docs/                         # เอกสารประกอบการพัฒนาและการส่งมอบ
│   ├── release/                  #   Checklists, Runbooks, Rollback Procedures
│   └── security/                 #   Teacher Auth RFC, Security Specifications
├── features/                     # Domain-Driven Architecture (Service Layer)
│   ├── timetable/                #   บริการจัดตาราง, Concurrency Lock, Retry Logic
│   ├── subjects/                 #   วิชาเรียน, การสอนร่วม (Co-Teaching), Split/Merge
│   ├── teachers/                 #   บริการข้อมูลผู้สอน และ Teacher Authentication
│   ├── rooms/                    #   บริการห้องเรียน และการตรวจสอบความจุ
│   ├── curriculum/               #   บริการหมวดหมู่และโครงสร้างหลักสูตร
│   └── dashboard/                #   คอมโพเนนต์และการดึงข้อมูลสถิติ
├── components/                   # UI Components ทั่วไปและ shadcn/ui
├── lib/                          # Core Utilities & Singletons
│   ├── auth.ts                   #   NextAuth Options & Dual Credentials Providers
│   ├── password.ts               #   Node.js scrypt KDF Cryptography Helper
│   ├── api-auth.ts               #   Session Revocation & Role Guards
│   └── prisma.ts                 #   Prisma Client Singleton
├── prisma/                       # Prisma Schema & Migrations
│   ├── migrations/               #   6 Versioned Production Migrations
│   └── schema.prisma             #   Database Schema
└── tests/                        # Automated Test Suites
    ├── unit/                     #   Unit Tests (Services, Helpers, Math)
    ├── integration/              #   Integration Tests (Concurrency, Rollback, DB)
    └── e2e/                      #   Playwright Browser Tests (DnD, Export, Modals)
```

---

## ✨ Key Features

### 🔐 1. ความปลอดภัยและการยืนยันตัวตนระดับสูง
- **Dual Role Access Control:** แยกสิทธิ์ `Admin` และ `Teacher` ชัดเจนผ่าน Server-Side Guard
- **scrypt Option 4 KDF:** เข้ารหัสรหัสผ่านตามมาตรฐาน OWASP ($N=16384, r=8, p=5$, 16-byte salt, 64-byte key)
- **Elimination of Legacy Passwords:** ยกเลิกการใช้รหัสประจำตัวอาจารย์ (`tId`) เป็นรหัสผ่าน 100%
- **First-Time Enrollment Workflow:** อาจารย์ลงทะเบียนด้วย One-Time Token (SHA-256) ที่ออกโดยผู้ดูแลระบบ
- **Real-Time Session Revocation:** ตรวจสอบ `sessionVersion` แบบเรียลไทม์ เซสชันเก่าจะถูกตัดสิทธิ์ทันทีเมื่อมีการรีเซ็ตรหัสผ่าน

### 📅 2. การจัดตารางสอนครบ 11 หน้าและระบบป้องกันความขัดแย้ง
- **รองรับ 4 หลักสูตรการศึกษา:**
  - **หลักสูตร 4 ปี:** ปี 1, ปี 2, ปี 3, ปี 4
  - **หลักสูตรเทียบโอน:** ปี 1, ปี 2, ปี 3
  - **หลักสูตร DVE-LVC:** ปี 1, ปี 2
  - **หลักสูตร DVE-MS:** ปี 1, ปี 2
- **Pointer Drag & Drop:** ลากวางรายวิชาลงตารางได้อย่างลื่นไหลและแม่นยำ
- **Multi-Assignment:** รองรับการจัดวิชาแบบหลายหมู่เรียนพร้อมกัน
- **Co-Teaching (การสอนร่วม):** รวมกลุ่มรายวิชาและซิงค์ตารางเรียนข้ามหลักสูตรอัตโนมัติ
- **Wednesday Restrictions & Term 3 Rules:** บังคับใช้เงื่อนไขพิเศษของสถาบัน (เช่น บ่ายวันพุธ และภาคฤดูร้อน)

### 📊 3. การส่งออกข้อมูล Excel บนความเร็วสูง
- **On-Demand Dynamic Import:** โหลดโมดูล `exceljs` เฉพาะเมื่อคลิกปุ่มดาวน์โหลด
- **ดาวน์โหลดครบวงจร:** ตารางเรียนรวม, ตารางประจำตัวผู้สอน และตารางการใช้ห้องเรียน
- **รองรับภาษาไทย:** ฟอนต์และการจัดรูปแบบเซลล์ถูกต้อง ชัดเจน ไม่มีข้อมูลความลับหลุดรอด

---

## 🧪 Testing & Quality Assurance

ระบบได้รับการทดสอบครอบคลุมทุกระดับชั้น รวม **194 Tests ผ่าน 100% (Green)**:

### 1. Vitest Full Regression Suite (157 / 157 Passing)
- **Unit Tests:** ทดสอบฟังก์ชันคำนวณคาบเรียน, ฟังก์ชันเข้ารหัส scrypt, การจัดการ Co-Teaching
- **Integration Tests:** ทดสอบการย้อนกลับธุรกรรม (Transaction Rollback) สำหรับการแยก/รวมวิชา
- **Concurrency Stress Tests:** ทดสอบจำลอง Race Condition แบบ 30 Iterations ต่อเนื่องเพื่อยืนยันว่าไม่มี Double Booking เกิดขึ้น

```bash
pnpm test
```

### 2. Playwright End-to-End Suite (37 / 37 Passing)
- ทดสอบการล็อกอิน, การลงทะเบียนอาจารย์, และการรีเซ็ตรหัสผ่านผ่านเบราว์เซอร์จริง
- ทดสอบ Pointer Drag & Drop, การตรวจจับการทับซ้อน (Collision Detection)
- ทดสอบการดาวน์โหลดไฟล์ Excel ทั้ง 3 ประเภทบน Chromium

```bash
pnpm exec playwright test --project=chromium
```

---

## 🛡 Production Deployment

สำหรับการขึ้นระบบ Production บนเซิร์ฟเวอร์จริง ให้ปฏิบัติตามคู่มือในโฟลเดอร์ `docs/release/`:
- [`docs/release/PRODUCTION_GO_LIVE_CHECKLIST.md`](docs/release/PRODUCTION_GO_LIVE_CHECKLIST.md) — แผนและ Checklist ขั้นตอนการ Deploy แม่บท
- [`deploy/nginx/cpetak-timetable.conf`](deploy/nginx/cpetak-timetable.conf) — คอนฟิกูเรชัน Nginx Reverse Proxy พร้อม TLS 1.3 และ Rate Limiting (จำกัด 10 req/m บน Auth Endpoints)
- [`.env.production.example`](.env.production.example) — ตัวอย่างการตั้งค่า Environment Variables และคำสั่งแยกผู้ใช้งานฐานข้อมูล (Runtime vs Migration)

---

## 📝 Database Schema Overview

```mermaid
erDiagram
    Plans_tb ||--o{ Timetable_tb : "scheduled into"
    Plans_tb }o--|| Room_tb : "assigned room"
    Plans_tb }o--|| Teacher_tb : "taught by"
    Plans_tb }o--o{ CoTeaching_tb : "grouped in"
    Teacher_tb ||--o{ TeacherToken_tb : "auth tokens"
    Timetable_tb }o--|| Room_tb : "uses room"
    Timetable_tb }o--|| Teacher_tb : "instructed by"

    Teacher_tb {
        int id PK
        string tId UK
        string tName
        string tLastName
        string passwordHash
        boolean isEnrolled
        int sessionVersion
    }
    TeacherToken_tb {
        int id PK
        int teacherId FK
        string tokenHash UK
        string tokenType
        datetime expiresAt
        datetime consumedAt
    }
    TimetableLock_tb {
        string lockKey PK
        datetime createdAt
    }
    Timetable_tb {
        int id PK
        int planId FK
        string termYear
        int day
        int startPeriod
        int endPeriod
        int roomId FK
        int teacherId FK
        string section
    }
    Plans_tb {
        int id PK
        string subjectCode
        string subjectName
        int credit
        string planType
        string termYear
    }
```

---

## 📄 License & Credits

- พัฒนาและดูแลระบบโดย: **ทีมงาน DekCom**
- พัฒนาขึ้นเพื่อใช้ในการจัดตารางเรียนตารางสอนสำหรับสถาบันการศึกษา
