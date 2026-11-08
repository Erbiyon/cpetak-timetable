# 📅 ระบบจัดตารางเรียน (Timetable System)

![Next.js](https://img.shields.io/badge/Next.js-16.4.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Zinc_Enterprise-18181B?style=for-the-badge&logo=shadcnui&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.16.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24.15-B845ED?style=for-the-badge&logo=auth0&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-157_Pass-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E_Pass-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

ระบบจัดตารางเรียนและบริหารงานวิชาการอัจฉริยะ (Academic Management Workspace) สำหรับสถาบันการศึกษา ออกแบบด้วย **shadcn/ui Zinc Enterprise Palette** ผสานฟอนต์ภาษาไทยมาตรฐาน **Sarabun** รองรับการบริหารจัดการครบวงจร ทั้งการจัดตารางเรียนรายชั้นปี 4 ระดับหลักสูตร (11 หน้า), การจัดสรรห้องเรียน, ภาระงานสอนคณาจารย์, โครงสร้างหลักสูตร, แผนการเรียน และปฏิทินการศึกษา พร้อมสถาปัตยกรรมระดับ Production-Ready ทั้งระบบ Concurrency Lock, scrypt KDF Security และ On-Demand Excel Export

> จัดทำโดย **DekCom** — สาขาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ตาก

---

## 📸 ภาพตัวอย่างระบบ (System Showcase)

### 1. ภาพรวมงานวิชาการ (Academic Dashboard Workspace)

| โหมดสว่าง (Light Mode) | โหมดมืด (Zinc Dark Mode) |
|:---:|:---:|
| ![Dashboard Overview Light](public/showcase/02-dashboard-overview-light.png) | ![Dashboard Overview Dark](public/showcase/04-dashboard-overview-dark.png) |

### 2. เมนูดำเนินงานและการกระจายคาบเรียน (Operations & Scheduling Telemetry)
![Dashboard Operations Light](public/showcase/03-dashboard-operations-light.png)
*เมนูดำเนินงานจัดระเบียบ 2 แถว: แถวบน 3 การ์ดฟังก์ชันย่อย (อาจารย์, ห้องเรียน, แผนการเรียน) และแถวล่าง 4 การ์ดทางลัด (โครงสร้างหลักสูตร, ตารางสอน, ตารางห้อง, ปฏิทิน)*

### 3. หน้าจัดตารางเรียนรายชั้นปี (Timetable Management with Pointer DnD)
![Timetable Management](public/showcase/05-timetable-management.png)
*หน้าจัดตารางเรียนลากและวาง (@dnd-kit) พร้อมระบบป้องกันการชนกัน (Conflict Detection) สีกรอบระบุหลักสูตรชัดเจน และปุ่มคำสั่งจัดอัตโนมัติ/ล้างตาราง/ดาวน์โหลด*

### 4. โมดูลโครงสร้างหลักสูตรและแผนการเรียน (Curriculum & Study Plans)

| โครงสร้างหลักสูตร (Curriculum Database) | แผนการเรียน 4 หลักสูตร (Study Plans) |
|:---:|:---:|
| ![Curriculum Structure](public/showcase/06-curriculum-structure.png) | ![Study Plan](public/showcase/11-study-plan.png) |

### 5. โมดูลข้อมูลอาจารย์และห้องเรียน (Teachers & Rooms Management)

| จัดการข้อมูลอาจารย์ (Teachers Management) | จัดการข้อมูลห้องเรียน (Rooms Management) |
|:---:|:---:|
| ![Teachers Management](public/showcase/07-teachers-management.png) | ![Rooms Management](public/showcase/08-rooms-management.png) |

### 6. ตารางสอนอาจารย์และตารางการใช้ห้องเรียน (Teacher & Room Utilization)

| ตารางสอนอาจารย์ (Teacher Schedule) | ตารางการใช้ห้องเรียน (Room Utilization) |
|:---:|:---:|
| ![Teacher Class Schedule](public/showcase/09-class-schedule.png) | ![Room Utilization Schedule](public/showcase/10-rooms-use-schedule.png) |

### 7. ปฏิทินการศึกษาและหน้าเข้าสู่ระบบ (Academic Calendar & Secure Auth)

| ปฏิทินการศึกษา (Academic Calendar) | เข้าสู่ระบบ 2 บทบาท (Dual-Role Auth) |
|:---:|:---:|
| ![Academic Calendar](public/showcase/12-academic-calendar.png) | ![Login Screen](public/showcase/01-login-screen.png) |

---

## 📋 สารบัญ

- [System Showcase](#-ภาพตัวอย่างระบบ-system-showcase)
- [Design System & UI/UX Standards](#-design-system--uiux-standards)
- [Technology Stack](#-technology-stack)
- [Architecture & Feature Highlights](#-architecture--feature-highlights)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Security & Concurrency Hardening](#-security--concurrency-hardening)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🎨 Design System & UI/UX Standards

ระบบได้รับการออกแบบใหม่ทั้งหมดภายใต้ทิศทาง **Modern Academic Workspace — shadcn/ui Zinc Enterprise**:

1. **Authentic shadcn/ui Zinc Theme:**
   - โทนสีมาตรฐาน Zinc Monochrome (`zinc-50` ถึง `zinc-950`) สะอาดตา น่าเชื่อถือ สไตล์ระบบบริหารการศึกษาสมัยใหม่
   - ไม่ใช้โทนสีน้ำเงิน/ฟ้าแบบเดิมเพื่อคงความเป็นกลางของข้อมูล
2. **Typography สองภาษาแบบสมบูรณ์:**
   - ภาษาไทย: ฟอนต์ **Sarabun** ทางการของหน่วยงานการศึกษา แสดงผลคมชัดในทุกอุปกรณ์
   - ตัวเลขและรหัสวิชา: ฟอนต์ **Mono** ป้องกันความสับสนของตัวเลขรหัสวิชาและห้องเรียน
3. **Semantic Colored Borders แยกตามหลักสูตร:**
   - 🔵 **หลักสูตรเทียบโอน (3 ปี):** Sky Theme (`border-sky-300`, `bg-sky-500/10`)
   - 🟣 **หลักสูตร 4 ปี:** Indigo Theme (`border-indigo-300`, `bg-indigo-500/10`)
   - 🟠 **หลักสูตร ปวส. (ปวช.):** Amber Theme (`border-amber-300`, `bg-amber-500/10`)
   - 🟢 **หลักสูตร ปวส. (ม.6):** Emerald Theme (`border-emerald-300`, `bg-emerald-500/10`)
4. **Adaptive Dark Mode:**
   - สลับระหว่าง Light Mode และ Dark Mode ได้อย่างไร้รอยต่อ สีคอนทราสต์ผ่านเกณฑ์การเข้าถึง (WCAG AA Compliant)

---

## 🛠 Technology Stack

| หมวดหมู่ | เทคโนโลยี / เครื่องมือ | เวอร์ชัน | หมายเหตุ |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.4.5 | Server Components, Turbopack Build |
| **Language** | TypeScript | ^5.8.3 | Strict Mode 100% Type-Safe |
| **UI Library** | React | 19.1.0 | Action Hooks, Optimized Memoization |
| **Styling** | Tailwind CSS | ^4.1.10 | CSS Variables, Oklch Colors |
| **Design System** | shadcn/ui (Zinc Theme) | Latest | Zinc Base Color, Radix UI Primitives |
| **Thai Typography** | Sarabun (Google Fonts) | Variable | `--font-sarabun`, Tailwind Font Sans |
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
| **E2E Browser Test** | Playwright (Chromium) | ^1.58.x | 37+ Passing Tests across All Timetable Pages |
| **Package Manager** | pnpm | 11.x | Lockfile v9 strictly enforced |

---

## 🏗 Architecture & Feature Highlights

```mermaid
graph TB
    subgraph Client["🖥 Client (React 19 / Next.js App Router)"]
        Dashboard["Academic Dashboard Workspace"]
        Pages["11 Timetable Pages + Study Plans"]
        DnD["Pointer Drag & Drop (@dnd-kit)"]
        LazyExport["Dynamic On-Demand ExcelJS"]
        Components["shadcn/ui Zinc Design System"]
    end

    subgraph Server["⚙️ Server Layer (Next.js 16.4.5)"]
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

    Dashboard --> ServiceLayer
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
│   ├── adjust-time-tables/       # หน้าจัดตารางสอนทั้ง 11 หน้า (4 ระดับหลักสูตร)
│   ├── study-plans/              # หน้าแสดงแผนการเรียน 4 หลักสูตร
│   ├── class-schedule/           # ตารางสอนอาจารย์ และส่งออก Excel
│   ├── rooms-use/                # ตารางการใช้ห้องเรียน และความหนาแน่น
│   ├── curriculum/               # โครงสร้างหลักสูตรและฐานข้อมูลรายวิชา
│   ├── teachers/                 # ข้อมูลอาจารย์ประจำสาขาและภายนอก
│   ├── rooms/                    # ข้อมูลห้องเรียนสาขาและตึกวิศวกรรมศาสตร์
│   ├── academic-calendar/        # กำหนดช่วงเวลาภาคเรียนและภาคเรียนปัจจุบัน
│   ├── dashboard/                # แดชบอร์ดภาพรวมงานวิชาการ
│   └── login/                    # หน้าเข้าสู่ระบบ (Admin & Teacher)
├── public/                       # Static Assets & Showcase Screenshots
│   └── showcase/                 #   ภาพหน้าจอแสดงฟังก์ชันหลักของระบบ
├── features/                     # Domain-Driven Architecture (Service Layer)
│   ├── timetable/                #   บริการจัดตาราง, Concurrency Lock, Retry Logic
│   ├── subjects/                 #   วิชาเรียน, การสอนร่วม (Co-Teaching), Split/Merge
│   ├── teachers/                 #   บริการข้อมูลผู้สอน และ Teacher Authentication
│   ├── rooms/                    #   บริการห้องเรียน และการตรวจสอบความจุ
│   ├── curriculum/               #   บริการหมวดหมู่และโครงสร้างหลักสูตร
│   └── dashboard/                #   คอมโพเนนต์และการดึงข้อมูลสถิติ
├── components/                   # UI Components ทั่วไปและ shadcn/ui
├── lib/                          # Core Utilities, NextAuth & Prisma Client
├── prisma/                       # Prisma Schema & Versioned Migrations
└── tests/                        # Automated Test Suites (Vitest & Playwright)
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
  - **หลักสูตรเทียบโอน (3 ปี):** ปี 1, ปี 2, ปี 3
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

ระบบได้รับการทดสอบครอบคลุมทุกระดับชั้น รวม **194+ Tests ผ่าน 100% (Green)**:

### 1. Vitest Full Regression Suite (157 / 157 Passing)
- **Unit Tests:** ทดสอบฟังก์ชันคำนวณคาบเรียน, ฟังก์ชันเข้ารหัส scrypt, การจัดการ Co-Teaching
- **Integration Tests:** ทดสอบการย้อนกลับธุรกรรม (Transaction Rollback) สำหรับการแยก/รวมวิชา
- **Concurrency Stress Tests:** ทดสอบจำลอง Race Condition แบบ 30 Iterations ต่อเนื่องเพื่อยืนยันว่าไม่มี Double Booking เกิดขึ้น

```bash
pnpm test
```

### 2. Playwright End-to-End Suite (Passing)
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

## 📄 License & Credits

- พัฒนาและดูแลระบบโดย: **ทีมงาน DekCom**
- สาขาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา ตาก
