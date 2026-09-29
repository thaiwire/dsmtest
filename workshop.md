# Workshop: ระบบจัดเก็บเอกสารภายในองค์กร (DSM Test)

> **Next.js 16 (App Router) + Prisma 7 + SQL Server + NextAuth v5 + Tailwind CSS v4**
>
> คู่มือนี้พาสร้างโปรเจกต์ตั้งแต่โฟลเดอร์ว่างจนถึงระบบที่ login ได้และมีหน้า Dashboard
> โดยใช้โครงสร้างของโปรเจกต์ `dsmtest` เป็นต้นแบบ ทุกขั้นตอนบอกว่าต้องสร้างไฟล์อะไร
> วางไว้ที่ไหน เขียนโค้ดอะไร และโค้ดแต่ละส่วนทำงานอย่างไร

---

## สารบัญ

0. [ภาพรวมระบบและโครงสร้างโปรเจกต์](#step-0-ภาพรวมระบบและโครงสร้างโปรเจกต์)
1. [เตรียมเครื่องมือ](#step-1-เตรียมเครื่องมือ)
2. [สร้างโปรเจกต์ Next.js](#step-2-สร้างโปรเจกต์-nextjs)
3. [ติดตั้ง Package ที่ต้องใช้](#step-3-ติดตั้ง-package-ที่ต้องใช้)
4. [ไฟล์ตั้งค่าโปรเจกต์ (config)](#step-4-ไฟล์ตั้งค่าโปรเจกต์-config)
5. [ไฟล์ Environment (.env)](#step-5-ไฟล์-environment-env)
6. [ฐานข้อมูลด้วย Prisma](#step-6-ฐานข้อมูลด้วย-prisma)
7. [Prisma Client สำหรับแอป](#step-7-prisma-client-สำหรับแอป)
8. [ระบบยืนยันตัวตน (NextAuth)](#step-8-ระบบยืนยันตัวตน-nextauth)
9. [Layout, CSS และหน้า Login](#step-9-layout-css-และหน้า-login)
10. [AppShell, Sidebar และหน้า Dashboard](#step-10-appshell-sidebar-และหน้า-dashboard)
11. [รันและทดสอบ](#step-11-รันและทดสอบ)
12. [แก้ปัญหาที่พบบ่อย](#step-12-แก้ปัญหาที่พบบ่อย)
13. [ขั้นตอนต่อไป](#step-13-ขั้นตอนต่อไป)

---

## Step 0: ภาพรวมระบบและโครงสร้างโปรเจกต์

### ระบบนี้ทำอะไร

ระบบจัดเก็บเอกสารภายในองค์กร ผู้ใช้แต่ละคนสังกัด **หน่วยงาน (Department)**
เอกสาร (Document) แต่ละฉบับมี **ประเภท (DocumentType)** มีไฟล์แนบได้หลายไฟล์
และทุกการกระทำกับเอกสารจะถูกบันทึกลง **Audit Log**

บทบาทผู้ใช้ (role):

| role      | ความหมาย       |
| --------- | -------------- |
| `ADMIN`   | ผู้ดูแลระบบ     |
| `MANAGER` | ผู้จัดการ       |
| `STAFF`   | พนักงาน (ค่าเริ่มต้น) |
| `VIEWER`  | ผู้เข้าชม (สร้างเอกสารไม่ได้) |

### Tech stack

| ส่วน | เทคโนโลยี | หน้าที่ |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | ทำทั้งหน้าเว็บ (React Server Components) และ API |
| UI | **React 19** + **Tailwind CSS v4** | ส่วนแสดงผลและการจัดสไตล์ |
| Database | **Microsoft SQL Server** | เก็บข้อมูล |
| ORM | **Prisma 7** + `@prisma/adapter-mssql` | เขียน query แบบ type-safe แทน SQL |
| Auth | **NextAuth (Auth.js) v5** + Credentials | login ด้วยอีเมล/รหัสผ่าน, session แบบ JWT |
| Hash | **bcryptjs** | เข้ารหัสรหัสผ่านแบบทางเดียว |

### โครงสร้างไฟล์เป้าหมาย

```text
dsmtest/
├── .env                          ← ค่าลับ/ค่าตั้งค่า (ไม่ commit)
├── .gitignore
├── AGENTS.md / CLAUDE.md         ← คำสั่งสำหรับ AI agent
├── eslint.config.mjs             ← ตั้งค่า ESLint
├── next.config.ts                ← ตั้งค่า Next.js
├── package.json                  ← dependencies + scripts
├── postcss.config.mjs            ← เปิดใช้ Tailwind ผ่าน PostCSS
├── prisma7.config.ts             ← ตั้งค่า Prisma CLI (path schema, migrations, DB URL)
├── tsconfig.json                 ← ตั้งค่า TypeScript + alias "@/"
├── prisma/
│   ├── schema.prisma             ← นิยามตาราง (models)
│   ├── seed.ts                   ← ข้อมูลตั้งต้น (admin, หน่วยงาน, ประเภทเอกสาร)
│   └── migrations/               ← SQL ที่ Prisma สร้างให้ (สร้างอัตโนมัติ)
├── public/                       ← ไฟล์ static (รูป, icon)
└── src/
    ├── proxy.ts                  ← ด่านตรวจ login ก่อนเข้าทุกหน้า (เดิมชื่อ middleware)
    ├── generated/prisma/         ← Prisma Client ที่ generate (สร้างอัตโนมัติ, ไม่ commit)
    ├── types/
    │   └── next-auth.d.ts        ← เพิ่ม field role/department ให้ type ของ session
    ├── lib/
    │   ├── prisma.ts             ← สร้าง PrismaClient ตัวเดียวใช้ทั้งแอป
    │   ├── auth.config.ts        ← config NextAuth ส่วนที่ไม่แตะฐานข้อมูล
    │   └── auth.ts               ← config NextAuth ตัวเต็ม (ตรวจรหัสผ่านกับ DB)
    ├── components/
    │   ├── AppShell.tsx          ← โครงหน้า: header + sidebar + เนื้อหา
    │   ├── SidebarNav.tsx        ← เมนูด้านซ้าย (Client Component)
    │   └── PasswordInput.tsx     ← ช่องรหัสผ่านมีปุ่มแสดง/ซ่อน (Client Component)
    └── app/
        ├── globals.css           ← Tailwind + ตัวแปรสี
        ├── layout.tsx            ← Root layout ครอบทุกหน้า
        ├── page.tsx              ← หน้า "/" → redirect ไป /dashboard
        ├── favicon.ico
        ├── login/page.tsx        ← หน้า login
        ├── dashboard/page.tsx    ← หน้า Dashboard
        └── api/auth/[...nextauth]/route.ts  ← endpoint ของ NextAuth
```

### ลำดับการทำงานเมื่อผู้ใช้เปิดเว็บ

```text
Browser ──► src/proxy.ts  (มี session ไหม?)
               │ ไม่มี → redirect /login?callbackUrl=...
               │ มี    → ผ่าน
               ▼
          src/app/<route>/page.tsx  (Server Component)
               │ auth()  → อ่าน session จาก cookie JWT
               │ prisma  → query SQL Server
               ▼
          HTML ส่งกลับ Browser
```

---

## Step 1: เตรียมเครื่องมือ

| เครื่องมือ | เวอร์ชัน | ตรวจสอบด้วย |
| --- | --- | --- |
| Node.js | **20.19+** (หรือ 22 LTS) | `node -v` |
| npm | มากับ Node | `npm -v` |
| SQL Server | 2017+ / Express / Docker | เชื่อมด้วย SSMS หรือ Azure Data Studio |
| Git | ล่าสุด | `git --version` |
| VS Code | + extension **Prisma**, **Tailwind CSS IntelliSense**, **ESLint** | — |

```bash
node -v
```

### เตรียมฐานข้อมูล SQL Server

1. เปิด SSMS แล้วสร้างฐานข้อมูลเปล่า เช่น `dsmtest`
   ```sql
   CREATE DATABASE dsmtest;
   ```
2. ต้องมี user ที่ login แบบ **SQL Server Authentication** ได้ (เช่น `sa` หรือสร้างใหม่)
3. เปิด **TCP/IP** ใน *SQL Server Configuration Manager* และจำพอร์ต (ปกติ `1433`)

> **ทำไมต้อง TCP/IP?** — driver `mssql` ของ Node เชื่อมผ่าน TCP เท่านั้น
> ไม่รองรับ Named Pipes/Shared Memory

---

## Step 2: สร้างโปรเจกต์ Next.js

```bash
npx create-next-app@latest dsmtest --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

อธิบายแต่ละ flag:

| flag | ผล |
| --- | --- |
| `--typescript` | ใช้ TypeScript (`.ts`/`.tsx`) |
| `--eslint` | สร้าง `eslint.config.mjs` |
| `--tailwind` | ติดตั้ง Tailwind v4 + สร้าง `postcss.config.mjs` |
| `--app` | ใช้ **App Router** (โฟลเดอร์ `app/`) |
| `--src-dir` | เก็บโค้ดไว้ใน `src/` แยกจากไฟล์ config |
| `--import-alias "@/*"` | import ด้วย `@/lib/prisma` แทน `../../lib/prisma` |

```bash
cd dsmtest
```

> ⚠️ **Next.js 16 ต่างจากเวอร์ชันเก่า** — เช่น `middleware.ts` เปลี่ยนชื่อเป็น `proxy.ts`,
> `params`/`searchParams` เป็น `Promise` ต้อง `await`, มี type `LayoutProps` / `PageProps`
> ให้ใช้แบบ global โดยไม่ต้อง import — อ่านคู่มือที่ตรงกับเวอร์ชันได้ที่
> `node_modules/next/dist/docs/`

---

## Step 3: ติดตั้ง Package ที่ต้องใช้

### 3.1 dependencies (ใช้ตอนรันจริง)

```bash
npm install @prisma/client @prisma/adapter-mssql prisma next-auth@beta bcryptjs
```

| package | หน้าที่ |
| --- | --- |
| `prisma` | CLI สำหรับ migrate / generate / studio |
| `@prisma/client` | runtime ของ Prisma Client |
| `@prisma/adapter-mssql` | **driver adapter** — Prisma 7 ต่อ DB ผ่าน adapter ที่เป็น JS (ใช้ package `mssql`) |
| `next-auth@beta` | Auth.js v5 (ยังเป็น beta) |
| `bcryptjs` | hash/compare รหัสผ่าน (pure JS ไม่ต้อง compile native) |

### 3.2 devDependencies (ใช้ตอนพัฒนา)

```bash
npm install -D @types/bcryptjs dotenv tsx
```

| package | หน้าที่ |
| --- | --- |
| `@types/bcryptjs` | type ของ bcryptjs |
| `dotenv` | โหลด `.env` ให้ Prisma CLI และสคริปต์ seed |
| `tsx` | รันไฟล์ `.ts` ได้โดยตรง (ใช้รัน `prisma/seed.ts`) |

### 3.3 เพิ่ม scripts ใน `package.json`

เปิด **`package.json`** แล้วแก้ส่วน `scripts` และเพิ่ม `prisma` ให้เป็นดังนี้:

```json
{
  "name": "dsmtest",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "npm run db:generate && tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

(ส่วน `dependencies`/`devDependencies` npm เติมให้เองจากขั้น 3.1–3.2)

| script | ใช้เมื่อ |
| --- | --- |
| `npm run dev` | รันเซิร์ฟเวอร์พัฒนา (hot reload) ที่ http://localhost:3000 |
| `npm run build` / `start` | build และรันแบบ production |
| `npm run db:generate` | สร้าง Prisma Client ใหม่หลังแก้ `schema.prisma` |
| `npm run db:migrate` | สร้าง migration + อัปเดตตารางใน DB (dev) |
| `npm run db:migrate:deploy` | apply migration ที่มีอยู่บน production (ไม่สร้างใหม่) |
| `npm run db:seed` | generate client แล้วใส่ข้อมูลตั้งต้น |
| `npm run db:studio` | เปิดหน้าเว็บดู/แก้ข้อมูลในตาราง |

---

## Step 4: ไฟล์ตั้งค่าโปรเจกต์ (config)

### 4.1 `tsconfig.json` (สร้างโดย create-next-app — ตรวจสอบให้ตรง)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

จุดสำคัญ:
- **`strict: true`** — บังคับเช็ก null/undefined ช่วยจับบั๊กตั้งแต่ตอนเขียน
- **`paths: "@/*" → "./src/*"`** — ทำให้ `@/generated/prisma/client` ชี้ไป `src/generated/prisma/client`
  (ทั้ง Next.js และ `tsx` ตอนรัน seed อ่าน alias นี้ได้)
- **`noEmit: true`** — TypeScript แค่ตรวจ type ส่วนการ compile เป็นหน้าที่ของ Next.js

### 4.2 `next.config.ts`

```ts
import type { NextConfig } from "next";

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB) || 20;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.9.200.75"],
  experimental: {
    serverActions: {
      bodySizeLimit: `${maxUploadSizeMb}mb`,
    },
  },
};

export default nextConfig;
```

- **`allowedDevOrigins`** — ตอน `npm run dev` Next.js จะบล็อกการเรียกจาก host อื่นที่ไม่ใช่ localhost
  ใส่ IP ของเครื่องที่ต้องการให้เปิดเว็บจากเครื่องอื่นในวงแลนได้ (เปลี่ยนเป็น IP ของคุณ)
- **`serverActions.bodySizeLimit`** — Server Action รับ body ได้ 1MB เป็นค่าเริ่มต้น
  ระบบนี้จะอัปโหลดไฟล์แนบผ่าน Server Action จึงขยายตาม `MAX_UPLOAD_SIZE_MB` (ค่าเริ่ม 20MB)

### 4.3 `postcss.config.mjs`

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

Tailwind v4 ทำงานเป็น PostCSS plugin ตัวเดียว — **ไม่ต้องมี `tailwind.config.js`** อีกแล้ว
การตั้งค่าธีมย้ายไปอยู่ใน CSS (`@theme` ใน `globals.css`)

### 4.4 `eslint.config.mjs`

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

ใช้รูปแบบ **flat config** ของ ESLint 9 — รวมกฎของ Next.js (core-web-vitals) และ TypeScript

### 4.5 `.gitignore` — เพิ่มบรรทัดท้ายไฟล์

```gitignore
# env files (can opt-in for committing if needed)
.env*

/src/generated/prisma
/storage/
```

- `.env*` — ห้าม commit รหัสผ่าน DB และ `AUTH_SECRET`
- `/src/generated/prisma` — Prisma Client สร้างใหม่ได้ทุกเมื่อด้วย `prisma generate`
- `/storage/` — โฟลเดอร์เก็บไฟล์แนบ/รูปโปรไฟล์ที่ผู้ใช้อัปโหลด

---

## Step 5: ไฟล์ Environment (`.env`)

สร้างไฟล์ **`.env`** ที่ root ของโปรเจกต์:

```dotenv
# การเชื่อมต่อ SQL Server
DATABASE_URL="sqlserver://localhost:1433;database=dsmtest;user=sa;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"

# NextAuth — สร้างค่าด้วย `npx auth secret`
AUTH_SECRET="ใส่ค่าที่ได้จากคำสั่ง npx auth secret"

# ขนาดไฟล์แนบสูงสุด (MB)
MAX_UPLOAD_SIZE_MB=20

# จำนวนเอกสารต่อหน้าในรายการเอกสาร
DOCUMENTS_PAGE_SIZE=20

# ขนาดรูปโปรไฟล์สูงสุด (MB)
MAX_AVATAR_SIZE_MB=2

# จำนวนแถวต่อหน้าใน audit log
AUDIT_LOG_PAGE_SIZE=50
```

### อธิบาย `DATABASE_URL`

```text
sqlserver://<host>:<port>;database=<db>;user=<user>;password=<pwd>;encrypt=true;trustServerCertificate=true
```

| ส่วน | ความหมาย |
| --- | --- |
| `host:port` | ที่อยู่ SQL Server เช่น `localhost:1433` |
| `database` | ชื่อ DB ที่สร้างใน Step 1 |
| `user` / `password` | บัญชี SQL Authentication |
| `encrypt=true` | เข้ารหัสการเชื่อมต่อ |
| `trustServerCertificate=true` | ยอมรับ certificate แบบ self-signed (เครื่อง dev) — production ควรใช้ cert จริง |

> ถ้ารหัสผ่านมีอักขระพิเศษ เช่น `;` `=` `{` ให้ครอบด้วย `{...}` เช่น `password={p@ss;w0rd}`

### สร้าง `AUTH_SECRET`

```bash
npx auth secret
```

คำสั่งนี้สุ่มค่าและเขียนลงไฟล์ `.env.local` — **คัดลอกไปไว้ใน `.env`** (เพราะ seed/Prisma อ่านเฉพาะ `.env`)
NextAuth ใช้ค่านี้เซ็น/เข้ารหัส JWT ใน cookie — ถ้าค่าเปลี่ยน ผู้ใช้ทุกคนต้อง login ใหม่

---

## Step 6: ฐานข้อมูลด้วย Prisma

### 6.1 `prisma7.config.ts` — ตั้งค่า Prisma CLI

สร้างไฟล์ที่ root:

```ts
// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

- **Prisma 7 ไม่โหลด `.env` เองแล้ว** → ต้อง `import "dotenv/config"` บรรทัดแรก
- **`datasource.url` ย้ายมาอยู่ที่นี่** (Prisma 7 ไม่ใส่ `url` ใน `schema.prisma` แล้ว)
- ไฟล์นี้ใช้เฉพาะ **CLI** (migrate/studio) — ตอนแอปรันจริงจะต่อ DB ผ่าน adapter ใน `src/lib/prisma.ts`
- เมื่อรันคำสั่ง prisma จะเห็นข้อความ `Loaded Prisma config from prisma7.config.ts.` แปลว่าอ่านถูกไฟล์
  (ชื่อมาตรฐานคือ `prisma.config.ts` — ถ้าตั้งชื่อนั้นก็ใช้ได้เช่นกัน)

### 6.2 `prisma/schema.prisma` — นิยามตาราง

สร้างโฟลเดอร์ `prisma/` แล้วสร้างไฟล์ `schema.prisma` ทีละส่วนตามนี้

#### (ก) generator และ datasource

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlserver"
}
```

- `provider = "prisma-client"` — generator ใหม่ของ Prisma 7 สร้างโค้ด TypeScript ลงโฟลเดอร์ที่กำหนด
  (ไม่ใช่ใน `node_modules` แบบเดิม) → import ด้วย `@/generated/prisma/client`
- `datasource` ระบุแค่ `provider` — URL อยู่ใน `prisma7.config.ts`

#### (ข) model `User` — ผู้ใช้งาน

```prisma
model User {
  id           String  @id @default(cuid())
  employeeCode String? @unique // รหัสพนักงาน (optional)
  email        String  @unique
  name         String
  passwordHash String
  avatarPath   String? // path/key ของรูปโปรไฟล์ (relative ต่อ storage/avatars), see src/lib/storage.ts
  role         String  @default("STAFF")
  isActive     Boolean @default(true)

  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  createdDocuments  Document[]      @relation("DocumentCreatedBy")
  approvedDocuments Document[]      @relation("DocumentApprovedBy")
  auditLogs         DocumentAudit[]

  // Extra document types this user may view across all departments (in
  // addition to their own department's documents) — see DocumentTypeAccess.
  documentTypeAccess DocumentTypeAccess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([departmentId])
}
```

อธิบาย syntax ที่พบ:

| syntax | ความหมาย |
| --- | --- |
| `@id` | primary key |
| `@default(cuid())` | สร้าง id แบบสุ่มที่ไม่ซ้ำ (เช่น `clx8...`) |
| `String?` | `?` = อนุญาตให้เป็น `NULL` |
| `@unique` | ห้ามค่าซ้ำ (สร้าง unique constraint) |
| `@default(now())` | ใส่เวลาปัจจุบันตอน insert |
| `@updatedAt` | Prisma อัปเดตเวลาให้อัตโนมัติทุกครั้งที่ update |
| `@relation(fields, references)` | foreign key: `departmentId` → `Department.id` |
| `Document[]` | ฝั่ง "หลาย" ของความสัมพันธ์ (ไม่มีคอลัมน์จริงในตาราง) |
| `@relation("ชื่อ")` | ตั้งชื่อความสัมพันธ์ เมื่อมี 2 ความสัมพันธ์ไปตารางเดียวกัน (สร้าง/อนุมัติ) |
| `@@index([...])` | สร้าง index ให้ค้นเร็ว |

> **ทำไม `role` เป็น `String` ไม่ใช่ `enum`?** — SQL Server ไม่รองรับ enum ใน Prisma
> จึงเก็บเป็นข้อความ และคุมค่าที่ถูกต้องในโค้ด (`ADMIN | MANAGER | STAFF | VIEWER`)
>
> **ทำไม `onDelete: NoAction`?** — SQL Server ไม่ยอมให้มี cascade path หลายเส้นทางไปตารางเดียวกัน
> (error "may cause cycles or multiple cascade paths") จึงต้องระบุ `NoAction` ในหลายความสัมพันธ์

#### (ค) model `Department` — หน่วยงาน

```prisma
// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

// หน่วยงาน
model Department {
  id   String @id @default(cuid())
  code String @unique // รหัสหน่วยงาน เช่น "HR", "IT"
  name String // ชื่อหน่วยงาน

  isActive Boolean @default(true)

  users     User[]
  documents Document[]

  // ประเภทเอกสารที่หน่วยงานนี้เป็น "เจ้าของ" (มีสิทธิ์สร้างเอกสารประเภทนั้น)
  ownedDocumentTypes DocumentType[] @relation("DocumentTypeOwner")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

`isActive` ใช้แทนการลบจริง (soft delete) — ปิดใช้งานหน่วยงานได้โดยข้อมูลเก่ายังอ้างอิงได้

#### (ง) model `DocumentType` — ประเภทเอกสาร

```prisma
// ประเภทเอกสาร
model DocumentType {
  id   String @id @default(cuid())
  code String @unique // รหัสประเภท เช่น "MEMO", "CONTRACT"
  name String // ชื่อประเภทเอกสาร

  // running-number config used when generating เลขที่เอกสาร, e.g. "{code}-{year}-{seq:4}"
  numberFormat String @default("{code}-{year}-{seq:4}")
  isActive     Boolean @default(true)

  // หน่วยงานเจ้าของประเภทเอกสารนี้ — มีเพียงหน่วยงานนี้ (หรือ admin) เท่านั้นที่สร้างเอกสารประเภทนี้ได้
  // ถ้าเป็น null ทุกหน่วยงานสร้างเอกสารประเภทนี้ได้ตามปกติ
  ownerDepartmentId String?
  ownerDepartment   Department? @relation("DocumentTypeOwner", fields: [ownerDepartmentId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  documents Document[]
  userAccess DocumentTypeAccess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerDepartmentId])
}
```

- `numberFormat` — แม่แบบเลขที่เอกสาร เช่น `{code}-{year}-{seq:4}` → `MEMO-2026-0001`
- `onDelete: SetNull` — ถ้าลบหน่วยงานเจ้าของ ประเภทเอกสารยังอยู่ แค่ไม่มีเจ้าของ

#### (จ) model `DocumentTypeAccess` — สิทธิ์ดูเอกสารข้ามหน่วยงาน

```prisma
// ให้สิทธิ์ user ดูเอกสารประเภทนี้ได้ข้ามหน่วยงาน (นอกเหนือจากเอกสารของหน่วยงานตัวเอง)
// เช่น ผู้ใช้ฝ่ายบัญชีได้รับสิทธิ์ดูประเภท "ใบกำกับภาษี" จากทุกหน่วยงาน
model DocumentTypeAccess {
  id String @id @default(cuid())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, documentTypeId])
  @@index([documentTypeId])
}
```

เป็นตาราง **many-to-many** ระหว่าง User กับ DocumentType
`@@unique([userId, documentTypeId])` ป้องกันการให้สิทธิ์ซ้ำ

#### (ฉ) model `Document` — เอกสาร

```prisma
// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

// DocumentStatus: "DRAFT" | "ACTIVE" | "ARCHIVED"
model Document {
  id String @id @default(cuid())

  // เลขที่เอกสาร - unique, primary search key
  documentNumber String @unique

  title       String
  description String? @db.NVarChar(Max)
  status      String  @default("ACTIVE")

  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  documentDate DateTime // วันที่ของเอกสาร (เช่น วันที่ลงนาม)

  createdById String
  createdBy   User   @relation("DocumentCreatedBy", fields: [createdById], references: [id], onDelete: NoAction, onUpdate: NoAction)

  // ถ้า approvedAt ไม่เป็น null แปลว่าเอกสารนี้ "ถูกต้องแล้ว" — ลบเอกสาร/ไฟล์แนบไม่ได้
  // ยกเว้น ADMIN หรือ MANAGER ของหน่วยงานเดียวกับเอกสารนี้ (ดู canDeleteDocument ใน access.ts)
  approvedAt   DateTime?
  approvedById String?
  approvedBy   User?     @relation("DocumentApprovedBy", fields: [approvedById], references: [id], onDelete: NoAction, onUpdate: NoAction)

  files     DocumentFile[]
  auditLogs DocumentAudit[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // เลขที่เอกสารคือ primary search key; ดัชนีเพิ่มเติมรองรับการค้นตามหน่วยงาน/ประเภท/สถานะ
  @@index([departmentId])
  @@index([documentTypeId])
  @@index([status])
  @@index([documentDate])
}
```

- `@db.NVarChar(Max)` — String ปกติใน SQL Server คือ `NVARCHAR(1000)`; รายละเอียดอาจยาวกว่านั้นจึงใช้ `MAX`
- `createdBy` กับ `approvedBy` ชี้ไป `User` ทั้งคู่ → ต้องตั้งชื่อ relation ให้ตรงกับฝั่ง `User`

#### (ช) model `DocumentFile` — ไฟล์แนบ

```prisma
// ไฟล์แนบของเอกสาร (รองรับหลายไฟล์ต่อ 1 เอกสาร)
model DocumentFile {
  id String @id @default(cuid())

  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  fileName    String // ชื่อไฟล์ต้นฉบับ
  storagePath String // path/key ที่เก็บจริงบน disk หรือ object storage
  mimeType    String
  sizeBytes   Int

  uploadedAt DateTime @default(now())

  @@index([documentId])
}
```

เก็บ **ข้อมูลของไฟล์** ใน DB ส่วนตัวไฟล์จริงเก็บบน disk (`storage/`) — `onDelete: Cascade` ลบเอกสารแล้วแถวไฟล์แนบหายตาม

#### (ซ) model `DocumentAudit` — ประวัติการใช้งาน

```prisma
// audit trail: บันทึกการสร้าง/ลบ/ดาวน์โหลดเอกสาร
// action: "CREATE" | "UPDATE" | "DOWNLOAD" | "DELETE" | "ARCHIVE" | "APPROVE"
//
// documentId เป็น nullable + onDelete: SetNull (ไม่ใช่ Cascade) โดยตั้งใจ —
// ถ้า cascade ไปด้วย แถว audit ของการ "ลบ" เอกสารจะถูกลบทิ้งไปพร้อมกับเอกสารที่มันบันทึกไว้
// ทำให้ตรวจสอบย้อนหลังไม่ได้ว่าใครลบเอกสารไปเมื่อไหร่ — จึงเก็บ documentNumber/documentTitle
// เป็น snapshot ไว้ในแถวเองด้วย เพื่อให้ log ยังอ่านได้แม้เอกสารต้นฉบับถูกลบไปแล้ว
model DocumentAudit {
  id String @id @default(cuid())

  documentId String?
  document   Document? @relation(fields: [documentId], references: [id], onDelete: SetNull, onUpdate: NoAction)

  documentNumber String // snapshot ตอน log ถูกสร้าง ใช้แสดงผลได้แม้เอกสารถูกลบไปแล้ว
  documentTitle  String

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  action String
  detail String?

  createdAt DateTime @default(now())

  @@index([documentId])
  @@index([userId])
  @@index([createdAt])
}
```

#### แผนภาพความสัมพันธ์ (ER)

```text
Department 1───* User 1───* DocumentTypeAccess *───1 DocumentType
    │  1           │ 1 (createdBy / approvedBy)          │ 1
    │              │                                      │
    └──────* Document *───────────────────────────────────┘
               │ 1
       ┌───────┴────────┐
       * DocumentFile   * DocumentAudit ──* User
Department 1───* DocumentType (ownerDepartment, optional)
```

ตรวจความถูกต้องของ schema:

```bash
npx prisma validate
```

```bash
npx prisma format
```

### 6.3 สร้างตารางใน DB ด้วย migration

```bash
npm run db:migrate -- --name start
```

สิ่งที่เกิดขึ้น:
1. Prisma เทียบ `schema.prisma` กับ DB แล้วสร้างไฟล์
   `prisma/migrations/<timestamp>_start/migration.sql` (คำสั่ง `CREATE TABLE`, `CREATE INDEX`, `FOREIGN KEY`)
2. รัน SQL นั้นกับ DB (ครอบด้วย `BEGIN TRAN ... COMMIT`, ถ้าผิดพลาดจะ `ROLLBACK`)
3. สร้าง `prisma/migrations/migration_lock.toml` ระบุว่าใช้ `sqlserver`
4. บันทึกประวัติไว้ในตาราง `_prisma_migrations`

> **ไม่ต้องเขียนไฟล์ migration เอง** — commit โฟลเดอร์ `migrations/` เข้า git
> เพื่อให้เครื่องอื่น/production รัน `npm run db:migrate:deploy` แล้วได้ตารางแบบเดียวกัน
>
> ทุกครั้งที่แก้ `schema.prisma` → รัน `npm run db:migrate -- --name <ชื่อการเปลี่ยนแปลง>` ใหม่

### 6.4 Generate Prisma Client

```bash
npm run db:generate
```

สร้างโค้ดใน `src/generated/prisma/` — ได้ type ของทุก model เช่น `prisma.user.findUnique(...)`
ที่ VS Code autocomplete ได้ทุก field

### 6.5 `prisma/seed.ts` — ข้อมูลตั้งต้น

```ts
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import bcrypt from "bcryptjs";

const adapter = new PrismaMssql(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const itDept = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: { code: "IT", name: "ฝ่ายเทคโนโลยีสารสนเทศ" },
  });

  await prisma.department.upsert({
    where: { code: "HR" },
    update: {},
    create: { code: "HR", name: "ฝ่ายทรัพยากรบุคคล" },
  });

  await prisma.documentType.upsert({
    where: { code: "MEMO" },
    update: {},
    create: {
      code: "MEMO",
      name: "บันทึกข้อความ",
      numberFormat: "{code}-{year}-{seq:4}",
    },
  });

  await prisma.documentType.upsert({
    where: { code: "CONTRACT" },
    update: {},
    create: {
      code: "CONTRACT",
      name: "สัญญา",
      numberFormat: "{code}-{year}-{seq:4}",
    },
  });

  const passwordHash = await bcrypt.hash("Admin@1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@company.local" },
    update: {},
    create: {
      email: "admin@company.local",
      name: "System Admin",
      passwordHash,
      role: "ADMIN",
      departmentId: itDept.id,
    },
  });

  console.log("Seed complete. Login with admin@company.local / Admin@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

อธิบายทีละส่วน:

1. **`import "dotenv/config"`** — สคริปต์นี้รันนอก Next.js จึงต้องโหลด `.env` เอง
2. **`new PrismaMssql(url)`** — สร้าง adapter ต่อ SQL Server แล้วส่งให้ `PrismaClient({ adapter })`
   (Prisma 7 **บังคับ** ใช้ adapter)
3. **`upsert`** = ถ้าเจอ (`where`) ให้ `update` ถ้าไม่เจอให้ `create`
   ใส่ `update: {}` ทำให้ **รัน seed ซ้ำกี่ครั้งก็ได้** ไม่เกิดข้อมูลซ้ำ/error
4. **`bcrypt.hash(password, 10)`** — 10 คือ cost factor (ยิ่งมากยิ่งปลอดภัยแต่ช้าลง)
   **ห้ามเก็บรหัสผ่านเป็นข้อความตรง ๆ** เก็บเฉพาะ hash
5. `main().catch().finally()` — ถ้าผิดพลาดให้ exit code 1 และปิด connection เสมอ

รัน seed:

```bash
npm run db:seed
```

ตรวจข้อมูลด้วย Prisma Studio (เปิดที่ http://localhost:5555):

```bash
npm run db:studio
```

---

## Step 7: Prisma Client สำหรับแอป

สร้าง **`src/lib/prisma.ts`**:

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMssql(process.env.DATABASE_URL!);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**ทำไมต้องเก็บไว้ใน `globalThis`?**
ตอน `npm run dev` Next.js จะ reload โมดูลทุกครั้งที่แก้ไฟล์ ถ้าเขียน `new PrismaClient()` ตรง ๆ
จะเกิด client ใหม่ (และ connection pool ใหม่) ทุกครั้ง จน SQL Server connection เต็ม
การเก็บไว้ที่ `globalThis` ทำให้ใช้ตัวเดิมข้าม hot-reload ได้ (**singleton pattern**)
ส่วน production โมดูลโหลดครั้งเดียวอยู่แล้วจึงไม่ต้องเก็บ

`!` หลัง `process.env.DATABASE_URL` บอก TypeScript ว่า "ค่านี้ไม่เป็น undefined แน่นอน"

**วิธีใช้ในไฟล์อื่น:**

```ts
import { prisma } from "@/lib/prisma";
const users = await prisma.user.findMany({ where: { isActive: true } });
```

> ⚠️ ใช้ `prisma` ได้เฉพาะโค้ดฝั่ง server (Server Component, Server Action, Route Handler)
> ห้าม import ในไฟล์ที่มี `"use client"`

---

## Step 8: ระบบยืนยันตัวตน (NextAuth)

แบ่งเป็น 5 ไฟล์ สร้างตามลำดับนี้:

```text
src/types/next-auth.d.ts          ① ขยาย type
src/lib/auth.config.ts            ② config เบา ไม่แตะ DB (ใช้ใน proxy)
src/lib/auth.ts                   ③ config เต็ม + ตรวจรหัสผ่านกับ DB
src/app/api/auth/[...nextauth]/route.ts  ④ endpoint HTTP ของ NextAuth
src/proxy.ts                      ⑤ ด่านตรวจทุก request
```

### 8.1 `src/types/next-auth.d.ts` — ขยาย type

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    departmentId: string;
    departmentName: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      departmentId: string;
      departmentName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    departmentId?: string;
    departmentName?: string;
  }
}
```

โดยปกติ `session.user` มีแค่ `name`, `email`, `image`
ไฟล์นี้ใช้ **module augmentation** (`declare module`) เพิ่ม field ของเราเข้าไป
ทำให้เขียน `session.user.role` ได้โดยไม่มี error และมี autocomplete
`& DefaultSession["user"]` = รวม field เดิม (name/email/image) ไว้ด้วย

### 8.2 `src/lib/auth.config.ts` — config ส่วนเบา

```ts
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config (no Prisma/bcrypt) used by middleware to check
 * session presence only. The Credentials provider itself lives in auth.ts,
 * which runs in the Node.js runtime.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
      }
      return session;
    },
  },
};
```

**ทำไมต้องแยก 2 ไฟล์ (auth.config.ts / auth.ts)?**
`proxy.ts` ทำงานก่อนทุก request และถูกออกแบบให้เบา — ไม่ควรโหลด Prisma/bcrypt
จึงแยก config ที่ **แค่อ่าน JWT จาก cookie** ไว้ที่นี่ ส่วนการตรวจรหัสผ่านกับ DB อยู่ใน `auth.ts`

- `pages.signIn: "/login"` — เมื่อต้อง login ให้ไปหน้า `/login` ของเรา (แทนหน้า default ของ NextAuth)
- `providers: []` — ไม่มี provider ที่นี่ (อยู่ใน auth.ts)
- `callbacks.session` — คัดลอกข้อมูลจาก JWT (`token`) ใส่ `session.user`
  (`token.sub` = subject = id ของผู้ใช้)

### 8.3 `src/lib/auth.ts` — config เต็ม

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { department: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.department.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
      }
      return session;
    },
  },
});
```

อธิบาย:

1. **`...authConfig`** — เอา config เบาจาก 8.2 มาใช้ต่อ แล้วเพิ่มส่วนที่ต้องใช้ DB
2. **`session: { strategy: "jwt" }`** — เก็บ session เป็น JWT ใน cookie (เข้ารหัสด้วย `AUTH_SECRET`)
   ไม่ต้องมีตาราง Session ใน DB
3. **`Credentials({ authorize })`** — เมื่อผู้ใช้กด login NextAuth เรียก `authorize`:
   - ไม่มี email/password → `return null` (= login ไม่ผ่าน)
   - หา user ด้วย email พร้อม `include: { department: true }` (JOIN ตาราง Department)
   - user ไม่มี หรือถูกปิดใช้งาน (`isActive=false`) → `null`
   - `bcrypt.compare` เทียบรหัสที่พิมพ์กับ hash ใน DB → ไม่ตรง → `null`
   - ผ่าน → คืน object ผู้ใช้ (**ห้ามคืน `passwordHash`**)
4. **ลำดับ callbacks**
   ```text
   authorize() ──► jwt({ token, user })   ← user มีค่าเฉพาะตอน login ครั้งแรก
                     └ คัดลอก role/department ใส่ token → เก็บลง cookie
   ทุก request ──► jwt({ token })         ← user = undefined, คืน token เดิม
               ──► session({ session, token }) ← แปลง token เป็น session ที่ auth() คืนให้
   ```
5. **export 4 ตัว**
   | ชื่อ | ใช้ที่ไหน |
   | --- | --- |
   | `handlers` | route handler (8.4) |
   | `signIn` | Server Action ในหน้า login |
   | `signOut` | ปุ่มออกจากระบบ |
   | `auth` | อ่าน session ใน Server Component: `const session = await auth()` |

> ⚠️ ข้อมูลใน JWT เป็น "ภาพถ่าย" ตอน login — ถ้า admin เปลี่ยน role ผู้ใช้
> session เดิมยังเป็น role เก่าจนกว่าจะ login ใหม่ (หน้า dashboard จึง query `user` ซ้ำจาก DB)

### 8.4 `src/app/api/auth/[...nextauth]/route.ts` — endpoint

สร้างโฟลเดอร์ `src/app/api/auth/[...nextauth]/` (พิมพ์วงเล็บเหลี่ยมและจุด 3 จุดตามนี้จริง ๆ)

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- `route.ts` ใน App Router = **Route Handler** (API) — export ฟังก์ชันตามชื่อ HTTP method
- `[...nextauth]` = **catch-all segment** จับทุก path ใต้ `/api/auth/` เช่น
  `/api/auth/session`, `/api/auth/csrf`, `/api/auth/callback/credentials`, `/api/auth/signout`

### 8.5 `src/proxy.ts` — ด่านตรวจทุก request

```ts
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/documents", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

- **Next.js 16 เปลี่ยนชื่อ `middleware.ts` → `proxy.ts`** วางไว้ใน `src/` ระดับเดียวกับ `app/`
  (ดู `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`)
- สร้าง `auth` จาก **`authConfig` (ตัวเบา)** — ไม่โหลด Prisma
- `auth((req) => ...)` — ห่อฟังก์ชันของเรา ทำให้ `req.auth` = session (หรือ `null`)
- ตรรกะ:
  | สถานะ | หน้าที่เข้า | ผล |
  | --- | --- | --- |
  | ยังไม่ login | หน้าอื่น | redirect `/login?callbackUrl=<หน้าเดิม>` |
  | login แล้ว | `/login` | redirect `/documents` |
  | อื่น ๆ | — | ผ่าน (`NextResponse.next()`) |
- **`matcher`** — regex บอกว่า proxy ทำงานกับ path ไหน: ทุก path **ยกเว้น**
  `api/auth` (ไม่งั้น login ไม่ได้เพราะวนลูป), ไฟล์ static ของ Next, และ favicon

> ⚠️ proxy เป็นแค่ด่านแรก — **หน้า/Action ที่สำคัญต้องเช็ก `auth()` และสิทธิ์ (role) ซ้ำเสมอ**

---

## Step 9: Layout, CSS และหน้า Login

### 9.1 `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #f3f4f6;
  --foreground: #171717;
  --sidebar-bg: #131a2b;
  --sidebar-active: #2563eb;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

- `@import "tailwindcss"` — โหลด Tailwind v4 ทั้งหมดด้วยบรรทัดเดียว
- `:root { --... }` — ตัวแปร CSS สีหลักของระบบ
- **`@theme inline`** — สร้าง utility class ของ Tailwind จากตัวแปร เช่น `--color-background`
  → ใช้ `bg-background`, `text-foreground` ได้

### 9.2 `src/app/layout.tsx` — Root Layout

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบจัดเก็บเอกสารภายในองค์กร",
  description: "Internal document management system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- Layout ที่ `app/layout.tsx` **ครอบทุกหน้า** ต้องมี `<html>` และ `<body>`
- `next/font/google` — ดาวน์โหลดฟอนต์ตอน build แล้วเสิร์ฟจากเซิร์ฟเวอร์เราเอง (ไม่เรียก Google ตอนใช้งาน)
- `metadata` — กำหนด `<title>` และ `<meta description>`
- **`LayoutProps<"/">`** — type helper แบบ global ของ Next.js 16 (ไม่ต้อง import)
- `lang="th"` — บอก browser/screen reader ว่าเนื้อหาภาษาไทย

### 9.3 `src/app/page.tsx` — หน้าแรก

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

เปิด `/` แล้วส่งต่อไป `/dashboard` ทันที (`redirect` ทำงานฝั่ง server ส่ง HTTP redirect)

### 9.4 `src/components/PasswordInput.tsx` — ช่องรหัสผ่าน (Client Component)

```tsx
"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

export function PasswordInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const inputId = props.id ?? id;

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
```

- **`"use client"`** บรรทัดแรก — ใน App Router ทุก component เป็น **Server Component** โดยค่าเริ่มต้น
  ถ้าต้องใช้ state (`useState`) หรือ event (`onClick`) ต้องประกาศเป็น Client Component
- `InputHTMLAttributes<HTMLInputElement>` — รับ prop ทุกอย่างที่ `<input>` รับได้ (`name`, `required`, ...)
  แล้วส่งต่อด้วย `{...props}`
- `visible` สลับ `type` ระหว่าง `"password"` (ซ่อน) กับ `"text"` (แสดง)
- ปุ่ม `type="button"` — **สำคัญ** ถ้าไม่ใส่ ปุ่มใน `<form>` จะเป็น submit
- `tabIndex={-1}` — กด Tab แล้วข้ามปุ่มนี้ ไปปุ่ม login ได้เลย
- `aria-label` — ให้ screen reader อ่านได้ว่าปุ่มทำอะไร
- `pr-10` — เว้นที่ด้านขวาของช่องให้ไอคอน

### 9.5 `src/app/login/page.tsx` — หน้า Login

```tsx
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { PasswordInput } from "@/components/PasswordInput";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const target = (formData.get("callbackUrl") as string) || "/documents";

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: target,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(target)}`);
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1420]">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            ระบบจัดเก็บเอกสารภายในองค์กร
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            เข้าสู่ระบบเพื่อดำเนินการต่อ
          </p>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>
        )}

        <input
          type="hidden"
          name="callbackUrl"
          value={callbackUrl ?? "/documents"}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="user@company.local"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            รหัสผ่าน
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  );
}
```

อธิบาย:

1. **`searchParams` เป็น `Promise`** (Next.js 15+) → ต้อง `await searchParams` ก่อนใช้
   - `callbackUrl` — หน้าที่ผู้ใช้ตั้งใจจะเข้า (proxy ใส่มาให้)
   - `error` — มีค่าเมื่อ login ผิด เพื่อแสดงกล่องแจ้งเตือนสีแดง
2. **Server Action** — ฟังก์ชัน `login` มี `"use server"` → รันบนเซิร์ฟเวอร์
   ผูกกับฟอร์มด้วย `<form action={login}>` — **ไม่ต้องเขียน API หรือ `fetch` เอง**
   และฟอร์มทำงานได้แม้ JavaScript ฝั่ง browser ยังโหลดไม่เสร็จ
3. `formData.get("email")` — อ่านค่าตาม `name` ของ input
4. **`signIn("credentials", {...})`** — เรียก `authorize()` ใน `auth.ts`
   - สำเร็จ → NextAuth ตั้ง cookie แล้ว **throw redirect** ไปยัง `redirectTo`
   - ล้มเหลว → throw `AuthError` → เรา redirect กลับ `/login?error=1`
5. **`throw err`** — สำคัญมาก! `redirect()` ของ Next.js ทำงานโดยการ throw error พิเศษ
   ถ้า catch แล้วกลืนไป redirect หลัง login สำเร็จจะไม่เกิด จึงต้อง throw ต่อทุก error ที่ไม่ใช่ `AuthError`
6. `<input type="hidden" name="callbackUrl">` — ส่ง callbackUrl ไปกับฟอร์ม
7. `encodeURIComponent(target)` — เข้ารหัส URL ให้ปลอดภัยเมื่อใส่ใน query string

> ℹ️ ค่า default หลัง login คือ `/documents` ซึ่งยังไม่ได้สร้างใน workshop นี้ (ดู Step 13)
> ระหว่างนี้ถ้าเจอหน้า 404 หลัง login ให้เปิด `/dashboard` เอง หรือเปลี่ยนค่า default เป็น `/dashboard` ชั่วคราว

---

## Step 10: AppShell, Sidebar และหน้า Dashboard

### 10.1 `src/components/SidebarNav.tsx` — เมนูซ้าย (Client Component)

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_NAV_ITEMS = [{ href: "/documents", label: "เอกสารทั้งหมด" }];
const CREATE_NAV_ITEM = { href: "/documents/new", label: "สร้างเอกสาร" };

const ADMIN_NAV_ITEMS = [
  { href: "/admin/departments", label: "หน่วยงาน" },
  { href: "/admin/document-types", label: "ประเภทเอกสาร" },
  { href: "/admin/users", label: "ผู้ใช้งาน" },
  { href: "/admin/audit-log", label: "ประวัติการใช้งาน" },
];

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive =
    href === "/documents"
      ? pathname === "/documents"
      : pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={`block rounded px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

export function SidebarNav({
  isAdmin,
  canCreateDocuments = true,
}: {
  isAdmin?: boolean;
  canCreateDocuments?: boolean;
}) {
  const pathname = usePathname();
  const navItems = canCreateDocuments
    ? [...BASE_NAV_ITEMS, CREATE_NAV_ITEM]
    : BASE_NAV_ITEMS;

  return (
    <nav className="w-64 shrink-0 bg-[#131a2b] py-4">
      <ul className="space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
      </ul>

      {isAdmin && (
        <>
          <p className="mt-6 px-7 text-xs font-semibold uppercase tracking-wide text-gray-500">
            จัดการระบบ
          </p>
          <ul className="mt-2 space-y-1 px-3">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}
```

- ต้องเป็น Client Component เพราะใช้ **`usePathname()`** (hook อ่าน URL ปัจจุบันใน browser)
  เพื่อไฮไลต์เมนูที่กำลังเปิดอยู่
- `isActive`: เมนู `/documents` ต้องตรงเป๊ะ (ไม่งั้น `/documents/new` จะไฮไลต์ 2 เมนู)
  เมนูอื่นใช้ `startsWith` ให้หน้าลูก เช่น `/admin/users/123` ยังไฮไลต์ "ผู้ใช้งาน"
- `canCreateDocuments` — `VIEWER` จะไม่เห็นเมนู "สร้างเอกสาร"
- `isAdmin` — เฉพาะ `ADMIN` เห็นกลุ่ม "จัดการระบบ"
- `<Link>` — เปลี่ยนหน้าแบบ client-side (ไม่โหลดทั้งหน้าใหม่) และ prefetch ล่วงหน้า

### 10.2 `src/components/AppShell.tsx` — โครงหน้า (Server Component)

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/SidebarNav";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function AppShell({
  children,
  userLabel,
  userId,
  isAdmin,
  role,
}: {
  children: ReactNode;
  userLabel?: string;
  userId?: string;
  isAdmin?: boolean;
  role?: string;
}) {
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarPath: true },
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between bg-[#0f1420] px-6 text-white">
        <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-200">
          ระบบจัดเก็บเอกสาร
        </Link>
        {userLabel && (
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:text-white"
            >
              {user?.avatarPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/users/${userId}/avatar`}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-600 text-xs">
                  {userLabel.charAt(0).toUpperCase()}
                </span>
              )}
              <span>{userLabel}</span>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded border border-gray-600 px-3 py-1 hover:bg-white/10">
                ออกจากระบบ
              </button>
            </form>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        <SidebarNav isAdmin={isAdmin} canCreateDocuments={role !== "VIEWER"} />
        <main className="flex-1 bg-gray-100 p-8">{children}</main>
      </div>
    </div>
  );
}
```

- เป็น **async Server Component** → `await prisma...` ได้ตรง ๆ ในตัว component
- `select: { avatarPath: true }` — ดึงเฉพาะคอลัมน์ที่ต้องใช้ (ไม่ดึง `passwordHash` ออกมาโดยไม่จำเป็น)
- ถ้ามีรูปโปรไฟล์ → `<img src="/api/users/{id}/avatar">` (route นี้สร้างใน Step 13)
  ไม่มีรูป → วงกลมแสดงตัวอักษรแรกของชื่อ
- ปุ่ม **ออกจากระบบ** ใช้ Server Action แบบ inline (`"use server"` ในฟังก์ชัน) เรียก `signOut`
  ลบ cookie แล้ว redirect `/login`
- **Server Component ส่ง prop ให้ Client Component ได้** (`SidebarNav`) — ค่าต้องเป็นข้อมูลที่ serialize ได้
  (string, boolean, number, object ธรรมดา)
- โครง layout: header สูง 64px ด้านบน, ด้านล่างแบ่ง sidebar กว้าง 256px (`w-64`) + เนื้อหา `flex-1`

### 10.3 `src/app/dashboard/page.tsx` — หน้า Dashboard

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleLabels: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  MANAGER: "ผู้จัดการ",
  STAFF: "พนักงาน",
  VIEWER: "ผู้เข้าชม",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true },
  });

  const [totalDocuments, activeUsers, activeDepartments, draftDocuments, recentDocuments] =
    await Promise.all([
      prisma.document.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.document.count({ where: { status: "DRAFT" } }),
      prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          documentType: true,
          department: true,
          createdBy: { select: { name: true } },
        },
      }),
    ]);

  const userRole = user?.role ?? session.user.role;
  const displayName = user?.name ?? session.user.name ?? "ผู้ใช้งาน";
  const departmentName = user?.department?.name ?? session.user.departmentName ?? "ไม่ระบุหน่วยงาน";

  const summaryCards = [
    {
      label: "เอกสารทั้งหมด",
      value: totalDocuments,
      detail: "รวมทุกเอกสารในระบบ",
      accent: "bg-blue-500/10 text-blue-700",
    },
    {
      label: "พนักงานที่ใช้งาน",
      value: activeUsers,
      detail: "คนในองค์กร",
      accent: "bg-emerald-500/10 text-emerald-700",
    },
    {
      label: "หน่วยงาน",
      value: activeDepartments,
      detail: "แยกตามภาคส่วน",
      accent: "bg-violet-500/10 text-violet-700",
    },
    {
      label: "เอกสารร่าง",
      value: draftDocuments,
      detail: "ต้องทบทวนก่อนเผยแพร่",
      accent: "bg-amber-500/10 text-amber-700",
    },
  ];

  return (
    <AppShell
      userLabel={displayName}
      userId={user?.id ?? session.user.id}
      isAdmin={userRole === "ADMIN"}
      role={userRole}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ภาพรวมระบบ</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {roleLabels[userRole] ?? userRole}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
              {departmentName}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${card.accent}`}>
                {card.label}
              </div>
              <div className="mt-4 text-3xl font-bold text-slate-900">{card.value}</div>
              <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">เอกสารล่าสุด</h2>
              <Link href="/documents" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                ดูทั้งหมด
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocuments.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  ยังไม่มีเอกสารในระบบ
                </p>
              ) : (
                recentDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{document.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {document.documentType.name}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.documentNumber} • {document.department.name}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {document.status}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        โดย {document.createdBy.name} • {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(document.createdAt))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">เมนูด่วน</h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/documents"
                  className="block rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  ดูเอกสารทั้งหมด
                </Link>
                <Link
                  href="/documents/new"
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  สร้างเอกสารใหม่
                </Link>
                {userRole === "ADMIN" && (
                  <Link
                    href="/admin/users"
                    className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    จัดการผู้ใช้งาน
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">ข้อมูลส่วนตัว</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <dt>ชื่อ</dt>
                  <dd className="font-medium text-slate-800">{displayName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>บทบาท</dt>
                  <dd className="font-medium text-slate-800">{roleLabels[userRole] ?? userRole}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>หน่วยงาน</dt>
                  <dd className="font-medium text-slate-800">{departmentName}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
```

อธิบายทีละส่วน:

1. **`roleLabels`** — แปลงรหัส role เป็นคำภาษาไทย (`Record<string, string>` = object key/value เป็น string)
2. **`await auth()`** — อ่าน session; ไม่มี → `redirect("/login")` (ป้องกันซ้ำแม้ proxy ตรวจแล้ว)
   หลังบรรทัดนี้ TypeScript รู้ว่า `session.user` มีค่าแน่นอน เพราะ `redirect` มี type `never`
3. **query `user` ซ้ำจาก DB** — ได้ชื่อ/role/หน่วยงานล่าสุด แม้ admin เพิ่งแก้ไข (JWT อาจเก่า)
4. **`Promise.all([...])`** — ยิง 5 query **พร้อมกัน** แทนที่จะรอทีละตัว → หน้าโหลดเร็วขึ้น
   และ destructure ผลลัพธ์ตามลำดับ
   - `count()` — นับจำนวนแถว (`SELECT COUNT(*)`)
   - `findMany({ take: 5, orderBy: { createdAt: "desc" } })` — 5 เอกสารล่าสุด
   - `include` — JOIN ตารางที่เกี่ยวข้อง; `createdBy: { select: { name: true } }` เอาแค่ชื่อผู้สร้าง
5. **`??` (nullish coalescing)** — ใช้ค่าจาก DB ก่อน ถ้าไม่มีใช้จาก session ถ้าไม่มีอีกใช้ค่า default
6. **`summaryCards`** — เก็บข้อมูลการ์ดเป็น array แล้ว `.map()` สร้าง UI (ไม่ต้องเขียน JSX ซ้ำ 4 ครั้ง)
   `key={card.label}` — React ต้องการ key ที่ไม่ซ้ำเมื่อ render รายการ
7. **Responsive grid** — `md:grid-cols-2 xl:grid-cols-4` = มือถือ 1 คอลัมน์, แท็บเล็ต 2, จอใหญ่ 4
   `xl:grid-cols-[1.7fr_1fr]` = ค่าแบบกำหนดเอง (arbitrary value) ของ Tailwind
8. **`Intl.DateTimeFormat("th-TH", ...)`** — แสดงวันที่แบบไทย (พ.ศ.) เช่น `29 ก.ย. 2569`
9. การแสดงผลแบบมีเงื่อนไข: `cond ? A : B` และ `{userRole === "ADMIN" && (...)}`

---

## Step 11: รันและทดสอบ

### 11.1 ลำดับคำสั่งตั้งแต่ต้น (เครื่องใหม่ / clone มาจาก git)

```bash
npm install
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

เปิด http://localhost:3000

### 11.2 Checklist ทดสอบ

| # | ทดสอบ | ผลที่ควรได้ |
| --- | --- | --- |
| 1 | เปิด `/` โดยยังไม่ login | ไป `/login?callbackUrl=%2Fdashboard` |
| 2 | login ด้วยรหัสผิด | กลับมาหน้า login พร้อมกล่องแดง "อีเมลหรือรหัสผ่านไม่ถูกต้อง" |
| 3 | กดไอคอนรูปตา | รหัสผ่านสลับแสดง/ซ่อน |
| 4 | login ด้วยบัญชี admin จาก seed (ดู `prisma/seed.ts`) | ไปหน้า `/dashboard` (ตาม callbackUrl) |
| 5 | ดู Dashboard | เห็นการ์ด 4 ใบ, role "ผู้ดูแลระบบ", หน่วยงาน "ฝ่ายเทคโนโลยีสารสนเทศ" |
| 6 | Sidebar | เห็นกลุ่ม "จัดการระบบ" (เพราะเป็น ADMIN) |
| 7 | เปิด `/login` ขณะ login อยู่ | ถูก redirect ออกไป `/documents` |
| 8 | กด "ออกจากระบบ" | กลับหน้า `/login` และเข้า `/dashboard` ไม่ได้อีก |

> 🔐 เปลี่ยนรหัสผ่าน admin เริ่มต้นทันทีหลังติดตั้งบนเครื่องจริง

### 11.3 ตรวจคุณภาพโค้ด

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

---

## Step 12: แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `Cannot find module '@/generated/prisma/client'` | ยังไม่ generate → `npm run db:generate` |
| `Login failed for user` / `ECONNREFUSED` | ตรวจ `DATABASE_URL`, เปิด TCP/IP + พอร์ต 1433, SQL Authentication |
| `self signed certificate` | เพิ่ม `trustServerCertificate=true` ใน URL |
| `MissingSecret` จาก NextAuth | ไม่มี `AUTH_SECRET` ใน `.env` → `npx auth secret` แล้วคัดลอกมาใส่ |
| Prisma CLI หา `DATABASE_URL` ไม่เจอ | ลืม `import "dotenv/config"` ใน `prisma7.config.ts` |
| `may cause cycles or multiple cascade paths` | SQL Server ห้าม cascade หลายทาง → ใช้ `onDelete: NoAction` |
| แก้ schema แล้ว type ไม่อัปเดต | `npm run db:migrate` (จะ generate ให้) หรือ `npm run db:generate` แล้ว restart TS server ใน VS Code |
| login ถูกแต่ไม่ redirect | ใน `catch` ต้อง `throw err` ต่อสำหรับ error ที่ไม่ใช่ `AuthError` |
| หลัง login เจอ 404 | หน้า `/documents` ยังไม่ได้สร้าง (Step 13) |
| เปิดจากเครื่องอื่นในแลนแล้วค้าง/ถูกบล็อก | เพิ่ม IP ใน `allowedDevOrigins` ของ `next.config.ts` |
| `Body exceeded 1 MB limit` | ปรับ `MAX_UPLOAD_SIZE_MB` ใน `.env` แล้ว restart |

---

## Step 13: ขั้นตอนต่อไป

เมนูและลิงก์ในโปรเจกต์อ้างถึงหน้าที่ยังไม่มี — สร้างต่อตามลำดับนี้ (แต่ละหน้าใช้แพตเทิร์นเดียวกับ Dashboard:
`auth()` → ตรวจสิทธิ์ → `prisma` query → ห่อด้วย `<AppShell>`)

| ลำดับ | ไฟล์ที่ต้องสร้าง | หน้าที่ |
| --- | --- | --- |
| 1 | `src/lib/access.ts` | ฟังก์ชันตรวจสิทธิ์ เช่น `canDeleteDocument`, where-clause เอกสารที่ user มองเห็นได้ (หน่วยงานตัวเอง + `DocumentTypeAccess`) |
| 2 | `src/lib/storage.ts` | บันทึก/อ่าน/ลบไฟล์ใน `storage/documents` และ `storage/avatars` |
| 3 | `src/app/documents/page.tsx` | รายการเอกสาร + ค้นหา + แบ่งหน้า (`DOCUMENTS_PAGE_SIZE`) |
| 4 | `src/app/documents/new/page.tsx` | ฟอร์มสร้างเอกสาร + อัปโหลดไฟล์ + ออกเลขที่ตาม `numberFormat` + บันทึก audit `CREATE` |
| 5 | `src/app/documents/[id]/page.tsx` | รายละเอียด, ดาวน์โหลดไฟล์ (audit `DOWNLOAD`), อนุมัติ, ลบ |
| 6 | `src/app/profile/page.tsx` + `src/app/api/users/[id]/avatar/route.ts` | แก้ข้อมูลส่วนตัว/รหัสผ่าน/รูปโปรไฟล์ |
| 7 | `src/app/admin/departments`, `document-types`, `users` | CRUD ข้อมูลหลัก (ADMIN เท่านั้น) |
| 8 | `src/app/admin/audit-log/page.tsx` | ดูประวัติ (`AUDIT_LOG_PAGE_SIZE`) |

แต่ละงานถัดไปจะมีหัวข้อใหม่เพิ่มต่อท้าย workshop นี้ พร้อมอธิบายทุกไฟล์ที่สร้าง/แก้ไขแบบ step by step
