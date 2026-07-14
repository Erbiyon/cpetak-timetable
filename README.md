# 📅 ระบบจัดตารางเรียน (Timetable System)

ระบบจัดตารางเรียนอัตโนมัติ สำหรับสถาบันการศึกษา พัฒนาด้วย Next.js 15 และ Prisma ORM รองรับการจัดตารางเรียนหลายหลักสูตร (หลักสูตร 4 ปี, เทียบโอน, อาชีวศึกษา) พร้อมระบบจัดการห้องเรียน อาจารย์ผู้สอน และปฏิทินการศึกษา พร้อมรองรับ **การสอนร่วม (Co-Teaching)** และ **การ Export ตารางเป็น Excel**

> จัดทำโดย **DekCom**

---

## 📋 สารบัญ

- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🛠 Technology Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 15.5.9 |
| **Language** | TypeScript | ^5.8.3 |
| **UI Library** | React | ^19.1.0 |
| **Styling** | Tailwind CSS | ^4.1.10 |
| **UI Components** | shadcn/ui (New York style) + Radix UI | — |
| **Icons** | Lucide React | ^0.515.0 |
| **ORM** | Prisma Client | 6 |
| **Database** | MySQL | — |
| **Authentication** | NextAuth.js (Credentials) | ^4.24.11 |
| **Drag & Drop** | @dnd-kit | ^6.3.1 |
| **Data Table** | TanStack React Table | ^8.21.3 |
| **Date Utilities** | date-fns | ^4.1.0 |
| **Excel Export** | ExcelJS | ^4.4.0 |
| **HTTP Client** | Axios | ^1.10.0 |
| **Toast Notifications** | Sonner | ^2.0.7 |
| **Theme** | next-themes | ^0.4.6 |
| **Package Manager** | pnpm | — |
| **Font** | Sarabun (Thai + Latin) | Google Fonts |

---

## 🏗 Project Architecture

```mermaid
graph TB
    subgraph Client["🖥 Client (React 19)"]
        Pages["Pages (App Router)"]
        Components["Components (shadcn/ui)"]
        DnD["Drag & Drop (@dnd-kit)"]
    end

    subgraph Server["⚙️ Server (Next.js 15)"]
        API["API Routes"]
        Middleware["Auth Middleware"]
        Auth["NextAuth.js (JWT)"]
    end

    subgraph Database["🗄 Database"]
        MySQL["MySQL"]
        Prisma["Prisma ORM"]
    end

    Pages --> Components
    Pages --> DnD
    Pages --> API
    API --> Prisma
    Prisma --> MySQL
    Middleware --> Auth
    Auth --> Prisma
```

### สถาปัตยกรรมหลัก

- **App Router (Next.js 15)** — ใช้ระบบ routing แบบ file-based ของ Next.js App Router
- **Server Components + Client Components** — ใช้ RSC สำหรับ data fetching และ client components สำหรับ interactivity
- **JWT-based Authentication** — ใช้ NextAuth.js กับ Credentials Provider พร้อม JWT session strategy
- **Role-based Access Control** — แบ่งสิทธิ์เป็น `admin` และ `teacher` ผ่าน middleware

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** (recommended package manager)
- **MySQL** database server

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Erbiyon/cpetak-timetable.git
   cd cpetak-timetable
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   สร้างไฟล์ `.env` ที่ root ของโปรเจค:

   ```env
   # Database
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run database migrations**

   ```bash
   pnpm prisma migrate dev
   ```

5. **Seed initial data**

   ```bash
   pnpm prisma db seed
   ```

   > สร้างข้อมูลเริ่มต้นของชั้นปี (ปี 1 – ปี 4)

6. **Generate Prisma Client**

   ```bash
   pnpm prisma generate
   ```

7. **Start development server**

   ```bash
   pnpm dev
   ```

   เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
cpetak-timetable/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 #   NextAuth.js endpoints
│   │   ├── curriculum/           #   Curriculum CRUD
│   │   ├── dashboard/            #   Dashboard data
│   │   ├── department-subjects/  #   Department subjects
│   │   ├── room/                 #   Room management
│   │   ├── room-request-deadline/#   Room request deadline
│   │   ├── subject/              #   Subject management
│   │   ├── teacher/              #   Teacher management
│   │   ├── term/                 #   Academic term
│   │   ├── term-year/            #   Term/year config
│   │   ├── timetable/            #   Timetable CRUD & auto-generate
│   │   └── year-level/           #   Year level management
│   ├── academic-calendar/        # Academic calendar page
│   ├── adjust-time-tables/       # Timetable adjustment pages
│   │   ├── adjust-plan-dve/      #   DVE plan adjustment
│   │   ├── adjust-plan-four-year/#   4-year plan adjustment
│   │   └── adjust-plan-transfer/ #   Transfer plan adjustment
│   ├── class-schedule/           # Class schedule view
│   ├── curriculum/               # Curriculum management
│   ├── dashboard/                # Admin dashboard
│   ├── login/                    # Login page
│   ├── rooms/                    # Room management
│   ├── rooms-use/                # Room utilization view
│   ├── study-plans/              # Study plans (by curriculum type)
│   │   ├── dve-lvc-plan/         #   DVE-LVC plan
│   │   ├── dve-msix-plan/        #   DVE-MSIX plan
│   │   ├── four-year-plan/       #   4-year plan
│   │   └── transfer-plan/        #   Transfer plan
│   ├── teacher-use/              # Teacher portal
│   │   ├── request-room/         #   Room request
│   │   └── time-table/           #   Teacher's timetable view
│   └── teachers/                 # Teacher management
│       ├── in-teacher/           #   Internal teachers
│       └── out-teacher/          #   External teachers
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui base components
│   ├── auto-timetable-button/    # Auto-generate timetable
│   ├── conflict-details/         # Scheduling conflict display
│   ├── co-teaching-Info/         # Co-teaching information
│   ├── dashboard/                # Dashboard widgets
│   ├── download-button/          # Excel export
│   ├── navbar/                   # Navigation bar
│   ├── table/                    # Data table components
│   ├── time-table/               # Timetable grid components
│   └── ...                       # Other feature components
├── lib/                          # Utilities
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Helper functions (cn, etc.)
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Seed data
│   └── migrations/               # Database migrations
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth type augmentation
├── utils/                        # Business logic utilities
│   └── co-teaching-helper.ts     # Co-teaching helper functions
└── middleware.ts                  # Auth middleware (route protection)
```

---

## ✨ Key Features

### 🔐 ระบบ Authentication & Authorization

- เข้าสู่ระบบแบบ **Credentials** (รหัสอาจารย์ / รหัสผู้ดูแล)
- **Role-based Access Control** — Admin และ Teacher มีสิทธิ์การเข้าถึงที่แตกต่างกัน
- **JWT Session** พร้อม middleware ป้องกัน route

### 📊 จัดตารางเรียนอัตโนมัติ

- รองรับหลายหลักสูตร: **หลักสูตร 4 ปี**, **เทียบโอน**, **DVE-LVC**, **DVE-MSIX**
- **Auto-generate** ตารางเรียนจากหลักสูตรอัตโนมัติ
- **Drag & Drop** จัดวางรายวิชาลงตาราง (@dnd-kit)
- ตรวจจับ **ความขัดแย้งของตาราง** (Conflict Detection)
- ปรับแต่งตารางเรียนด้วยมือ

### 👥 การสอนร่วม (Co-Teaching)

- จัดกลุ่มวิชาสอนร่วมข้ามหลักสูตร
- **Split / Merge** กลุ่มสอนร่วม
- ซิงค์ตารางเรียนของกลุ่มสอนร่วมอัตโนมัติ

### 🏫 จัดการข้อมูลพื้นฐาน

- **อาจารย์** — เพิ่ม/แก้ไข/ลบ แบ่งเป็นอาจารย์ภายในและภายนอก
- **ห้องเรียน** — จัดการห้องเรียน แบ่งประเภท, ดูการใช้งานห้อง
- **รายวิชา** — จัดการรายวิชา, เครดิต, ชั่วโมงบรรยาย/ปฏิบัติ
- **หลักสูตร** — จัดการหลักสูตรการศึกษา

### 📅 ปฏิทินการศึกษา

- จัดการ **ภาคเรียน** (เทอม) พร้อมวันเริ่มต้น-สิ้นสุด
- กำหนด **ปีการศึกษา/ภาคเรียน** ปัจจุบัน
- ตั้งค่า **deadline** การขอใช้ห้อง

### 🧑‍🏫 พอร์ทัลอาจารย์ (Teacher Portal)

- ดูตารางสอนส่วนตัว
- ขอใช้ห้องเรียน

### 📥 Export ข้อมูล

- **Export ตารางเรียนเป็น Excel** (ExcelJS)
- Export ตารางห้องเรียน
- Export ตารางอาจารย์

### 🎨 UI/UX

- **Dark Mode / Light Mode** toggle
- **Responsive Design**
- UI Components จาก **shadcn/ui (New York style)**
- ฟอนต์ **Sarabun** รองรับภาษาไทย
- Toast notifications ด้วย **Sonner**

---

## 💻 Development Workflow

### Scripts ที่ใช้งานได้

```bash
# Development
pnpm dev              # Start development server

# Build
pnpm build            # Generate Prisma client + Next.js build
pnpm start            # Start production server

# Linting
pnpm lint             # Run ESLint

# Database
pnpm prisma migrate dev     # Run migrations (development)
pnpm prisma migrate deploy  # Run migrations (production)
pnpm prisma db seed         # Seed initial data
pnpm prisma studio          # Open Prisma Studio (DB GUI)
pnpm prisma generate        # Regenerate Prisma Client
```

### Database Management

- ใช้ **Prisma Studio** (`pnpm prisma studio`) เพื่อดูและจัดการข้อมูลผ่าน GUI
- Schema อยู่ที่ `prisma/schema.prisma`
- Migrations ถูกจัดเก็บที่ `prisma/migrations/`

---

## 📏 Coding Standards

### General

- **TypeScript Strict Mode** — เปิดใช้งาน `strict: true` ใน tsconfig
- **No Unused Variables** — เปิดใช้งาน `noUnusedLocals` และ `noUnusedParameters`
- ใช้ `_` prefix สำหรับ parameters ที่ตั้งใจไม่ใช้งาน (เช่น `_req`)

### Project Conventions

- **Path Aliases** — ใช้ `@/*` สำหรับ import จาก root (เช่น `@/components/...`, `@/lib/...`)
- **Components** — แต่ละ component อยู่ในโฟลเดอร์แยก พร้อมไฟล์หลัก
- **API Routes** — ใช้ Next.js Route Handlers (`route.ts`)
- **Prisma Client** — ใช้ singleton pattern ผ่าน `lib/prisma.ts` เพื่อป้องกัน connection leak ใน development (HMR)

### Styling

- ใช้ **Tailwind CSS v4** กับ `@import "tailwindcss"` syntax
- ใช้ **CSS Variables** สำหรับ theming (oklch color space)
- ใช้ `cn()` utility จาก `clsx` + `tailwind-merge` สำหรับ conditional class names
- shadcn/ui components ใช้ **New York** style variant

### Linting

- ESLint กับ `next` configuration
- ปิด `react/no-unescaped-entities` และ `@next/next/no-page-custom-font` rules

---

## 📝 Database Schema

### Entity Relationship

```mermaid
erDiagram
    Plans_tb ||--o{ Timetable_tb : has
    Plans_tb }o--|| Room_tb : uses
    Plans_tb }o--|| Teacher_tb : "taught by"
    Plans_tb }o--o{ CoTeaching_tb : "groups"
    Timetable_tb }o--|| Room_tb : "scheduled in"
    Timetable_tb }o--|| Teacher_tb : "assigned to"
    Term_tb {
        int id PK
        string name
        datetime start
        datetime end
    }
    Plans_tb {
        int id PK
        string subjectCode
        string subjectName
        int credit
        string planType
        string termYear
    }
    Room_tb {
        int id PK
        string roomCode
        string roomType
        string roomCate
    }
    Teacher_tb {
        int id PK
        string tId
        string tName
        string tLastName
        string teacherType
    }
    Timetable_tb {
        int id PK
        int day
        int startPeriod
        int endPeriod
    }
    Curriculum_tb {
        int id PK
        string id_sub
        string subject_name
        int credit
    }
```

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Made with ❤️ by <strong>DekCom</strong>
</p>
