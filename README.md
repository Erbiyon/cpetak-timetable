# CPETc Timetable System

A comprehensive, web-based timetable management system built for generating, visualizing, and managing academic schedules efficiently. The project is designed with specific roles in mind (Admin and Teacher) and includes an interactive drag-and-drop interface.

## 🚀 Technologies Used

- **Framework**: [Next.js 15](https://nextjs.org/) (App Directory)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: MySQL (configured in `schema.prisma`)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [shadcn/ui] (accessible React components)
- **Drag & Drop functionality**: [@dnd-kit](https://dndkit.com/)
- **Data Export/Handling**: [exceljs](https://github.com/exceljs/exceljs)

## ✨ Key Features

- **Role-Based Access Control**: Differentiates between `admin` and `teacher` access with respective dashboards upon login.
- **Interactive Timetabling**: Drag-and-drop support (`@dnd-kit`) for assigning schedules seamlessly.
- **Resource Management**: Manage Subjects (Plans), Teachers, Classrooms, and Curriculums.
- **Data Modeling**: Relational database structure handling complex constraints like term schedules, rooms, and co-teaching blocks.
- **Modern UI/UX**: Fully responsive, dark mode support (`next-themes`), accessible components, and toast notifications (`sonner`).

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- `pnpm` (Project uses `pnpm-lock.yaml`)
- A running instance of MySQL server

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cpetak-timetable
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your connection strings and auth secrets.
   ```env
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize Database:**
   Generate the Prisma client and push the schema to your database.
   ```bash
   npx prisma generate
   npx prisma db push
   # Alternatively use npx prisma migrate dev based on your workflow.
   ```

5. **Start Development Server:**
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗃️ Database Structure (Prisma)

The application centers around managing the academic schedules, containing tables like:
- `Plans_tb`: Represents the subjects or courses to be taught.
- `Timetable_tb`: Represents the actual plotted schedule blocks (linked to plan, room, and teacher).
- `Room_tb`: Represents the classrooms.
- `Teacher_tb`: Information about educators.
- `Curriculum_tb`: Core subjects inside curriculum plans.
- `Term_tb`, `TermYear_tb`, `YearLevel_tb`: Academic calendar tracking and year grouping.

## 🤝 Contribution

Feel free to open issues or submit pull requests for any improvements!
