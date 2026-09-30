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
11. [Library ฝั่ง server: config, สิทธิ์, เลขที่เอกสาร, ไฟล์](#step-11-library-ฝั่ง-server-config-สิทธิ์-เลขที่เอกสาร-ไฟล์)
12. [Component ที่ใช้ร่วมกัน: วันที่, แบ่งหน้า, ปุ่มยืนยัน, ดูตัวอย่างไฟล์](#step-12-component-ที่ใช้ร่วมกัน-วันที่-แบ่งหน้า-ปุ่มยืนยัน-ดูตัวอย่างไฟล์)
13. [รันและทดสอบ](#step-13-รันและทดสอบ)
14. [แก้ปัญหาที่พบบ่อย](#step-14-แก้ปัญหาที่พบบ่อย)
15. [ขั้นตอนต่อไป](#step-15-ขั้นตอนต่อไป)
16. [แก้บั๊กเพิ่มผู้ใช้ใหม่แล้วเจอ "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว"](#step-16-แก้บั๊กเพิ่มผู้ใช้ใหม่แล้วเจอ-ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว)
17. [แก้บั๊กอัปโหลดรูปโปรไฟล์แล้วรูปไม่เปลี่ยนทันที](#step-17-แก้บั๊กอัปโหลดรูปโปรไฟล์แล้วรูปไม่เปลี่ยนทันที)
18. [คู่มือ Deploy บน Ubuntu Server (`install.md`)](#step-18-คู่มือ-deploy-บน-ubuntu-server-installmd)
19. [เปลี่ยนมารันแอป production ด้วย PM2](#step-19-เปลี่ยนมารันแอป-production-ด้วย-pm2)
20. [คู่มือ Deploy บน Windows Server + PM2 (`installwin.md`)](#step-20-คู่มือ-deploy-บน-windows-server--pm2-installwinmd)

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
├── install.md                    ← คู่มือ deploy บน Ubuntu Server          (Step 18)
├── installwin.md                 ← คู่มือ deploy บน Windows Server + PM2   (Step 20)
├── ecosystem.config.cjs          ← ตั้งค่า PM2 สำหรับรันแอป production    (Step 19)
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
    │   ├── auth.ts               ← config NextAuth ตัวเต็ม (ตรวจรหัสผ่านกับ DB)
    │   ├── config.ts             ← อ่านค่าจำนวนแถวต่อหน้าจาก .env        (Step 11)
    │   ├── require-admin.ts      ← กันหน้า admin: ไม่ใช่ ADMIN → 404       (Step 11)
    │   ├── access.ts             ← กฎสิทธิ์ ดู/แก้/ลบ/อนุมัติ เอกสาร         (Step 11)
    │   ├── document-number.ts    ← ออกเลขที่เอกสารตาม numberFormat         (Step 11)
    │   └── storage.ts            ← บันทึก/อ่าน/ลบไฟล์แนบและรูปโปรไฟล์บน disk (Step 11)
    ├── components/
    │   ├── AppShell.tsx          ← โครงหน้า: header + sidebar + เนื้อหา
    │   ├── SidebarNav.tsx        ← เมนูด้านซ้าย (Client Component)
    │   ├── PasswordInput.tsx     ← ช่องรหัสผ่านมีปุ่มแสดง/ซ่อน (Client Component)
    │   ├── FormattedDate.tsx     ← แสดงวันที่ dd/mm/yyyy                  (Step 12)
    │   ├── Pagination.tsx        ← ปุ่มเปลี่ยนหน้า (Server Component)      (Step 12)
    │   ├── DeleteButton.tsx      ← ปุ่มลบ + กล่องยืนยัน                    (Step 12)
    │   ├── DeleteDocumentButton.tsx ← ลบเอกสารแล้วกลับไป /documents        (Step 12)
    │   ├── ApproveButton.tsx     ← ปุ่มอนุมัติเอกสาร + กล่องยืนยัน          (Step 12)
    │   ├── UnapproveButton.tsx   ← ปุ่มยกเลิกอนุมัติ + กล่องยืนยัน          (Step 12)
    │   └── FilePreview.tsx       ← ดูตัวอย่าง/พิมพ์ PDF และรูปภาพ           (Step 12)
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
    const target = (formData.get("callbackUrl") as string) || "/dashboard";

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
          value={callbackUrl ?? "/dashboard"}
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

> ℹ️ ถ้าไม่มี `callbackUrl` ระบบจะพาไป **`/dashboard`** หลัง login สำเร็จ
> (เปลี่ยนจาก `/documents` เพราะหน้า `/documents` ยังไม่ได้สร้าง — มี 2 จุดที่ต้องแก้ให้ตรงกัน:
> ค่า fallback ของ `target` ใน Server Action และ `value` ของ hidden input)
>
> ⚠️ แต่ `src/proxy.ts` ยัง redirect ผู้ใช้ที่ login แล้วแต่เปิด `/login` ไปที่ `/documents` อยู่
> ถ้าต้องการให้ตรงกัน ให้แก้บรรทัด `new URL("/documents", ...)` ใน proxy เป็น `/dashboard` ด้วย

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
- ถ้ามีรูปโปรไฟล์ → `<img src="/api/users/{id}/avatar">` (route นี้สร้างใน Step 15)
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

## Step 11: Library ฝั่ง server: config, สิทธิ์, เลขที่เอกสาร, ไฟล์

ก่อนสร้างหน้าเอกสาร เราเตรียม "ฟังก์ชันกลาง" ไว้ใน `src/lib/` ให้ทุกหน้าเรียกใช้ร่วมกัน
ข้อดีคือกฎทางธุรกิจ (ใครทำอะไรได้, เลขที่เอกสารหน้าตาอย่างไร, ไฟล์เก็บที่ไหน) อยู่ที่เดียว
แก้ที่เดียวแล้วมีผลทั้งระบบ

สร้าง 5 ไฟล์ตามลำดับนี้ (ไฟล์หลังพึ่งพาไฟล์ก่อนหน้าน้อยที่สุด):

```text
src/lib/config.ts            ① ค่าตั้งค่าจาก .env (ไม่พึ่งใคร)
src/lib/require-admin.ts     ② กันหน้า admin (ใช้ auth)
src/lib/access.ts            ③ กฎสิทธิ์ (ใช้ prisma)
src/lib/document-number.ts   ④ ออกเลขที่เอกสาร (ใช้ prisma)
src/lib/storage.ts           ⑤ จัดการไฟล์บน disk (ใช้ fs ของ Node)
```

> ไฟล์ทั้งหมดใน Step นี้ใช้ได้ **เฉพาะฝั่ง server** (Server Component / Server Action / Route Handler)
> เพราะแตะฐานข้อมูล ไฟล์ระบบ หรือ `process.env` ที่ไม่มีคำนำหน้า `NEXT_PUBLIC_`

### 11.1 `src/lib/config.ts` — ค่าตั้งค่าแบ่งหน้า

```ts
const DEFAULT_DOCUMENTS_PAGE_SIZE = 20;

export const DOCUMENTS_PAGE_SIZE = (() => {
  const parsed = Number(process.env.DOCUMENTS_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DOCUMENTS_PAGE_SIZE;
})();

const DEFAULT_AUDIT_LOG_PAGE_SIZE = 30;

export const AUDIT_LOG_PAGE_SIZE = (() => {
  const parsed = Number(process.env.AUDIT_LOG_PAGE_SIZE);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_AUDIT_LOG_PAGE_SIZE;
})();
```

อธิบาย:

1. **ค่าจาก `.env` เป็น string เสมอ** (หรือ `undefined` ถ้าไม่ได้ตั้ง) → แปลงด้วย `Number(...)`
2. **ตรวจความถูกต้องก่อนใช้** — `Number.isInteger(parsed) && parsed > 0`
   | ค่าใน .env | `Number(...)` | ผล |
   | --- | --- | --- |
   | `20` | `20` | ใช้ 20 |
   | ไม่ได้ตั้ง | `NaN` | ใช้ค่า default |
   | `abc` | `NaN` | ใช้ค่า default |
   | `0` หรือ `-5` | `0` / `-5` | ใช้ค่า default (ห้ามน้อยกว่า 1) |
   | `10.5` | `10.5` | ใช้ค่า default (ต้องเป็นจำนวนเต็ม) |
3. **`(() => { ... })()`** = IIFE (Immediately Invoked Function Expression) — ฟังก์ชันที่ประกาศแล้วเรียกทันที
   ใช้เพื่อคำนวณค่าคงที่ที่มีหลายบรรทัด แล้ว export ออกไปเป็น `const` ธรรมดา
   (คำนวณครั้งเดียวตอนโหลดโมดูล)
4. ค่า default ของ audit log คือ **30** ถ้าต้องการค่าอื่นให้ตั้ง `AUDIT_LOG_PAGE_SIZE` ใน `.env`

วิธีใช้:

```ts
import { DOCUMENTS_PAGE_SIZE } from "@/lib/config";

const documents = await prisma.document.findMany({
  skip: (page - 1) * DOCUMENTS_PAGE_SIZE,  // ข้ามแถวของหน้าก่อน ๆ
  take: DOCUMENTS_PAGE_SIZE,               // เอาแค่ 1 หน้า
});
```

### 11.2 `src/lib/require-admin.ts` — ด่านกันหน้า admin

```ts
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

/** Redirects non-admins to a 404 (no admin-only route reveals its existence). */
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") notFound();
  return session;
}
```

- **`notFound()`** — แสดงหน้า 404 (และหยุดการทำงานของฟังก์ชันทันที เหมือน `redirect`)
- **ทำไมแสดง 404 แทน 403 "ไม่มีสิทธิ์"?** — ผู้ใช้ทั่วไปจะไม่รู้ด้วยซ้ำว่าหน้า `/admin/...` มีอยู่
  ลดข้อมูลที่ผู้ไม่หวังดีใช้สำรวจระบบได้
- **คืน `session` กลับไป** — หน้าที่เรียกได้ข้อมูลผู้ใช้ไปใช้ต่อ ไม่ต้องเรียก `auth()` ซ้ำ
- หลังผ่าน `requireAdmin()` TypeScript รู้ว่า `session` ไม่เป็น `null` (เพราะ `notFound()` มี type `never`)

วิธีใช้ — บรรทัดแรกของทุกหน้า **และทุก Server Action** ใต้ `/admin`:

```tsx
// src/app/admin/users/page.tsx
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  // ... ถึงบรรทัดนี้ได้แปลว่าเป็น ADMIN แน่นอน
}
```

> ⚠️ **ต้องเรียกใน Server Action ด้วย** ไม่ใช่แค่ในหน้า — Server Action เรียกผ่าน HTTP POST ได้โดยตรง
> การซ่อนปุ่มบนหน้าจอไม่ได้ป้องกันอะไร

### 11.3 `src/lib/access.ts` — กฎสิทธิ์ทั้งระบบ

```ts
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  role: string;
  departmentId: string;
};

/** Roles that are scoped to their own department (as opposed to ADMIN/VIEWER, who see everything). */
function isDepartmentScopedRole(role: string): boolean {
  return role === "STAFF" || role === "MANAGER";
}

/**
 * Document type IDs this user can view across ALL departments, on top of
 * their own department's documents — granted per-user via DocumentTypeAccess
 * (e.g. an accounting staff member given access to "ใบกำกับภาษี" so they can
 * see invoices raised by sales, without seeing sales' other document types).
 * Admins and VIEWERs already see everything, so this is only meaningful for
 * department-scoped roles (STAFF/MANAGER); returns [] otherwise to avoid an
 * unnecessary query.
 */
export async function extraViewableDocumentTypeIds(
  user: SessionUser,
): Promise<string[]> {
  if (!isDepartmentScopedRole(user.role)) return [];
  const grants = await prisma.documentTypeAccess.findMany({
    where: { userId: user.id },
    select: { documentTypeId: true },
  });
  return grants.map((g) => g.documentTypeId);
}

/**
 * Admins and viewers see all departments; staff/managers are scoped to their
 * own department, plus any document types they've been granted
 * cross-department access to via DocumentTypeAccess. VIEWER is a read-only,
 * cross-department role (e.g. an executive who needs to see everything) — it
 * never grants create/edit/delete or access to /admin/*.
 */
export async function documentScopeFilter(
  user: SessionUser,
): Promise<Prisma.DocumentWhereInput> {
  if (user.role === "ADMIN" || user.role === "VIEWER") return {};

  const extraTypeIds = await extraViewableDocumentTypeIds(user);
  if (extraTypeIds.length === 0) {
    return { departmentId: user.departmentId };
  }

  return {
    OR: [
      { departmentId: user.departmentId },
      { documentTypeId: { in: extraTypeIds } },
    ],
  };
}

/** Can view/preview/download/print a document — same as the read scope above. */
export async function canViewDocument(
  user: SessionUser,
  documentDepartmentId: string,
  documentTypeId: string,
): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "VIEWER") return true;
  if (user.departmentId === documentDepartmentId) return true;

  const extraTypeIds = await extraViewableDocumentTypeIds(user);
  return extraTypeIds.includes(documentTypeId);
}

/** Can create/edit a document — VIEWER and cross-department type access are excluded, unlike canViewDocument. */
export function canManageDocument(
  user: SessionUser,
  documentDepartmentId: string,
) {
  if (user.role === "VIEWER") return false;
  return user.role === "ADMIN" || user.departmentId === documentDepartmentId;
}

/**
 * Can approve a document (mark it as ถูกต้องแล้ว) — only ADMIN, or a MANAGER
 * in the same department as the document. Plain STAFF/VIEWER never can, even
 * for their own department's documents.
 */
export function canApproveDocument(
  user: SessionUser,
  documentDepartmentId: string,
) {
  if (user.role === "ADMIN") return true;
  return user.role === "MANAGER" && user.departmentId === documentDepartmentId;
}

/**
 * Can delete a document or one of its attachments. Once a document is
 * approved (approvedAt is set), only ADMIN or a MANAGER in the same
 * department may delete it or its files — the point of approval is that an
 * ordinary STAFF member (even the one who created it) can no longer remove
 * it. Unapproved documents follow the normal canManageDocument rule.
 */
export function canDeleteDocument(
  user: SessionUser,
  documentDepartmentId: string,
  isApproved: boolean,
) {
  if (!isApproved) return canManageDocument(user, documentDepartmentId);
  return canApproveDocument(user, documentDepartmentId);
}

/**
 * Can edit a document's fields, or add/remove attachments on it. Same gate as
 * canDeleteDocument — once approved, only ADMIN or a MANAGER in the same
 * department may still change it (a plain STAFF member can no longer edit an
 * approved document, even the one they created). Kept as a distinct function
 * from canDeleteDocument (even though the rule is currently identical) since
 * "who can edit" and "who can delete" are separate questions that could
 * diverge later — don't collapse them into one just because they match today.
 */
export function canEditDocument(
  user: SessionUser,
  documentDepartmentId: string,
  isApproved: boolean,
) {
  if (!isApproved) return canManageDocument(user, documentDepartmentId);
  return canApproveDocument(user, documentDepartmentId);
}

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}
```

#### ตารางสิทธิ์ (สรุปจากโค้ดด้านบน)

"หน่วยงานเดียวกัน" = `user.departmentId === document.departmentId`

| การกระทำ | ADMIN | MANAGER | STAFF | VIEWER |
| --- | --- | --- | --- | --- |
| **ดู** เอกสาร | ทุกหน่วยงาน | หน่วยงานตัวเอง + ประเภทที่ได้รับสิทธิ์ | หน่วยงานตัวเอง + ประเภทที่ได้รับสิทธิ์ | ทุกหน่วยงาน (อ่านอย่างเดียว) |
| **สร้าง/แก้ไข** (ยังไม่อนุมัติ) | ✅ | หน่วยงานเดียวกัน | หน่วยงานเดียวกัน | ❌ |
| **แก้ไข/ลบ** (อนุมัติแล้ว) | ✅ | หน่วยงานเดียวกัน | ❌ | ❌ |
| **อนุมัติ** / ยกเลิกอนุมัติ | ✅ | หน่วยงานเดียวกัน | ❌ | ❌ |
| เข้า `/admin/*` | ✅ | ❌ | ❌ | ❌ |

#### อธิบายแต่ละฟังก์ชัน

1. **`SessionUser`** — type ที่มีแค่ 3 field ที่ต้องใช้ตัดสินสิทธิ์
   ส่ง `session.user` เข้ามาได้เลย (มี field เกินได้ TypeScript ไม่ว่า)
2. **`isDepartmentScopedRole`** — ไม่ได้ `export` = ใช้ภายในไฟล์เท่านั้น
3. **`extraViewableDocumentTypeIds`** — ดึงรายการประเภทเอกสารที่ผู้ใช้ได้รับสิทธิ์ดูข้ามหน่วยงาน
   จากตาราง `DocumentTypeAccess` — ถ้าเป็น ADMIN/VIEWER คืน `[]` ทันทีโดย **ไม่ query** (เพราะเห็นทุกอย่างอยู่แล้ว)
4. **`documentScopeFilter`** — หัวใจของระบบสิทธิ์การดู คืน **where-clause ของ Prisma**
   (`Prisma.DocumentWhereInput` คือ type ที่ Prisma generate ให้)
   | ผู้ใช้ | ค่าที่คืน | SQL ที่ได้ประมาณ |
   | --- | --- | --- |
   | ADMIN / VIEWER | `{}` | ไม่มีเงื่อนไข (เห็นทั้งหมด) |
   | STAFF ไม่มีสิทธิ์พิเศษ | `{ departmentId }` | `WHERE departmentId = @p1` |
   | STAFF มีสิทธิ์พิเศษ | `{ OR: [...] }` | `WHERE departmentId = @p1 OR documentTypeId IN (@p2, @p3)` |

   วิธีใช้ร่วมกับเงื่อนไขค้นหาอื่น ๆ — ใช้ `AND` รวมกัน **ห้ามใช้ spread** (`{...scope, ...search}`)
   เพราะถ้าทั้งสองมี key `OR` ตัวหลังจะทับตัวแรก ทำให้สิทธิ์รั่ว:
   ```ts
   const scope = await documentScopeFilter(session.user);
   const documents = await prisma.document.findMany({
     where: {
       AND: [
         scope,                                         // ← สิทธิ์
         { OR: [{ title: { contains: q } },            // ← คำค้น
                { documentNumber: { contains: q } }] },
       ],
     },
   });
   ```
5. **`canViewDocument`** — กฎเดียวกับข้อ 4 แต่ใช้ตรวจ **เอกสารทีละฉบับ** เช่นในหน้ารายละเอียด
   หรือ route ดาวน์โหลดไฟล์ (ต้อง `await` เพราะอาจ query DB)
6. **`canManageDocument`** — สร้าง/แก้ไข: VIEWER ห้ามเสมอ, ADMIN ได้หมด, คนอื่นเฉพาะหน่วยงานตัวเอง
   (สิทธิ์ "ดูข้ามหน่วยงาน" **ไม่** ทำให้แก้ไขได้)
7. **`canApproveDocument`** — อนุมัติได้เฉพาะ ADMIN หรือ MANAGER หน่วยงานเดียวกัน
8. **`canDeleteDocument` / `canEditDocument`** — ถ้า **ยังไม่อนุมัติ** ใช้กฎข้อ 6
   ถ้า **อนุมัติแล้ว** ใช้กฎข้อ 7 (เข้มขึ้น) — ตั้งใจแยกเป็น 2 ฟังก์ชันแม้ตอนนี้กฎเหมือนกัน
   เพราะเป็นคำถามคนละเรื่องที่อาจเปลี่ยนแยกกันในอนาคต
9. ฟังก์ชันที่ **ไม่ต้อง query** เป็นฟังก์ชันธรรมดา (sync) ส่วนที่ query เป็น `async`

วิธีใช้ใน Server Action (ตัวอย่างการลบ):

```ts
"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteDocument } from "@/lib/access";

export async function deleteDocument(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return { error: "ไม่พบเอกสาร" };

  if (!canDeleteDocument(session.user, doc.departmentId, doc.approvedAt !== null)) {
    return { error: "คุณไม่มีสิทธิ์ลบเอกสารนี้" };
  }
  // ... ลบไฟล์ + ลบแถว + บันทึก audit
  return {};
}
```

> 🔑 **หลักการ:** ใช้ฟังก์ชันเหล่านี้ 2 ที่เสมอ — (1) ตอน render เพื่อ **ซ่อน/แสดงปุ่ม**
> (2) ใน Server Action เพื่อ **บังคับจริง** อย่างหลังคือสิ่งที่ป้องกันระบบ

### 11.4 `src/lib/document-number.ts` — ออกเลขที่เอกสาร

```ts
import { prisma } from "@/lib/prisma";

/**
 * Generates a document number using a type's numberFormat template, e.g.
 * "{code}-{year}-{seq:4}" -> "MEMO-2026-0007".
 * Sequence resets per document type per year, derived by counting existing
 * documents of that type within the current year (not a separate counter
 * table, so this must run inside the same transaction as the insert to
 * avoid duplicate numbers under concurrent writes).
 */
export async function generateDocumentNumber(
  documentTypeId: string,
  tx: Pick<typeof prisma, "documentType" | "document"> = prisma,
): Promise<string> {
  const type = await tx.documentType.findUniqueOrThrow({
    where: { id: documentTypeId },
  });

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const countThisYear = await tx.document.count({
    where: {
      documentTypeId,
      documentDate: { gte: yearStart, lt: yearEnd },
    },
  });

  const seq = countThisYear + 1;

  return type.numberFormat.replace(
    /\{(code|year|seq)(?::(\d+))?\}/g,
    (_match, key: string, pad?: string) => {
      if (key === "code") return type.code;
      if (key === "year") return String(year);
      if (key === "seq") {
        return pad ? String(seq).padStart(Number(pad), "0") : String(seq);
      }
      return "";
    },
  );
}
```

อธิบายทีละขั้น:

1. **พารามิเตอร์ `tx`** — รับได้ทั้ง `prisma` ปกติ หรือ **transaction client** จาก `prisma.$transaction`
   - `Pick<typeof prisma, "documentType" | "document">` = type ที่มีแค่ 2 property นี้ของ prisma
     ทำให้ส่ง `tx` ใน transaction เข้ามาได้ (transaction client ไม่มี `$connect` ฯลฯ แต่มี model ครบ)
   - `= prisma` ค่า default ถ้าไม่ส่งมา
2. **`findUniqueOrThrow`** — หาไม่เจอจะ throw error แทนการคืน `null` (ไม่ต้องเขียนเช็ก null เอง)
3. **ช่วงปี** — `new Date(year, 0, 1)` = 1 ม.ค. (เดือนใน JS เริ่มที่ 0) ถึง 1 ม.ค. ปีถัดไป (`lt` = น้อยกว่า ไม่รวม)
4. **นับเอกสารประเภทเดียวกันในปีนี้** แล้ว +1 = ลำดับถัดไป → **เลขรันเริ่มใหม่ทุกปี ทุกประเภท**
5. **แทนค่าใน template ด้วย regex** `/\{(code|year|seq)(?::(\d+))?\}/g`
   | ส่วนของ regex | จับอะไร |
   | --- | --- |
   | `\{` ... `\}` | วงเล็บปีกกา (escape ด้วย `\`) |
   | `(code\|year\|seq)` | กลุ่มที่ 1 → `key` |
   | `(?::(\d+))?` | ส่วนเสริม `:ตัวเลข` (ไม่บังคับ) — ตัวเลขเป็นกลุ่มที่ 2 → `pad` |
   | `g` | แทนทุกตำแหน่งที่เจอ |

   ตัวอย่าง: ประเภท `MEMO`, ปี 2026, มีเอกสารแล้ว 6 ฉบับ, format `{code}-{year}-{seq:4}`
   ```text
   {code}   → MEMO
   {year}   → 2026
   {seq:4}  → "7".padStart(4, "0") → 0007
   ผลลัพธ์  → MEMO-2026-0007
   ```

วิธีใช้ — **ต้องอยู่ใน transaction เดียวกับการ insert:**

```ts
const document = await prisma.$transaction(async (tx) => {
  const documentNumber = await generateDocumentNumber(documentTypeId, tx);
  return tx.document.create({
    data: { documentNumber, title, documentTypeId, departmentId, documentDate, createdById },
  });
});
```

> ⚠️ **ข้อควรระวังของวิธี "นับแล้ว +1"** (ควรรู้ก่อนสร้างหน้าสร้าง/ลบเอกสาร)
> 1. **ลบเอกสารแล้วเลขชนกัน** — มี `0001, 0002, 0003` ลบ `0002` → นับได้ 2 → ฉบับใหม่ได้ `0003`
>    ซ้ำกับที่มีอยู่ → `documentNumber` เป็น `@unique` จึง insert ไม่ผ่าน (error `P2002`)
> 2. **ปีของเลข vs ปีที่นับ** — เลขใช้ปีปัจจุบัน แต่การนับดูจาก `documentDate`
>    ถ้าลงวันที่ย้อนหลังเป็นปีก่อน จะไม่ถูกนับในปีนี้ แต่ได้เลขของปีนี้ → เลขซ้ำได้เช่นกัน
> 3. **ผู้ใช้ 2 คนกดพร้อมกัน** — transaction ระดับ Read Committed (ค่าเริ่มต้นของ SQL Server)
>    ไม่กันการนับพร้อมกัน → ได้เลขเดียวกัน
>
> วิธีรับมือ: ใช้ `prisma.$transaction(fn, { isolationLevel: "Serializable" })`
> และ/หรือ จับ error `P2002` แล้วลองใหม่ หรือเปลี่ยนไปใช้ตารางตัวนับ (counter table)
> หรือหาเลขล่าสุดด้วย `orderBy: { documentNumber: "desc" }` แทนการนับ

### 11.5 `src/lib/storage.ts` — จัดการไฟล์บน disk

```ts
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Statically scoped (not built from an env var) so Next.js file tracing doesn't
// pull the whole project into the server bundle. Override via a bind mount at
// this fixed path in deployment if a different location is needed.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "documents");
const AVATAR_STORAGE_ROOT = path.join(process.cwd(), "storage", "avatars");

const DEFAULT_MAX_UPLOAD_SIZE_MB = 20;

export const MAX_UPLOAD_SIZE_MB = (() => {
  const parsed = Number(process.env.MAX_UPLOAD_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_UPLOAD_SIZE_MB;
})();

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const DEFAULT_MAX_AVATAR_SIZE_MB = 5;

export const MAX_AVATAR_SIZE_MB = (() => {
  const parsed = Number(process.env.MAX_AVATAR_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_AVATAR_SIZE_MB;
})();

export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export function isAllowedAvatarMimeType(mimeType: string): boolean {
  return ALLOWED_AVATAR_MIME_TYPES.includes(mimeType);
}

function assertInsidePath(root: string, fullPath: string) {
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(root)) {
    throw new Error("Resolved storage path escapes the storage root");
  }
  return resolved;
}

export async function saveDocumentFile(
  documentId: string,
  originalFileName: string,
  data: Buffer,
): Promise<{ storagePath: string }> {
  const dir = path.join(STORAGE_ROOT, documentId);
  await mkdir(dir, { recursive: true });

  const safeExt = path.extname(originalFileName).slice(0, 20);
  const storedName = `${randomUUID()}${safeExt}`;
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(dir, storedName));

  await writeFile(fullPath, data);

  // store path relative to storage root so it stays portable across environments
  return { storagePath: path.join(documentId, storedName) };
}

export async function readDocumentFile(storagePath: string): Promise<Buffer> {
  const fullPath = assertInsidePath(
    STORAGE_ROOT,
    path.join(STORAGE_ROOT, storagePath),
  );
  return readFile(fullPath);
}

export async function deleteDocumentFile(storagePath: string): Promise<void> {
  const fullPath = assertInsidePath(
    STORAGE_ROOT,
    path.join(STORAGE_ROOT, storagePath),
  );
  await unlink(fullPath).catch(() => undefined);
}

export async function saveAvatarFile(
  userId: string,
  originalFileName: string,
  data: Buffer,
): Promise<{ storagePath: string }> {
  await mkdir(AVATAR_STORAGE_ROOT, { recursive: true });

  const safeExt = path.extname(originalFileName).slice(0, 10) || ".jpg";
  const storedName = `${userId}-${randomUUID()}${safeExt}`;
  const fullPath = assertInsidePath(
    AVATAR_STORAGE_ROOT,
    path.join(AVATAR_STORAGE_ROOT, storedName),
  );

  await writeFile(fullPath, data);

  return { storagePath: storedName };
}

export async function readAvatarFile(storagePath: string): Promise<Buffer> {
  const fullPath = assertInsidePath(
    AVATAR_STORAGE_ROOT,
    path.join(AVATAR_STORAGE_ROOT, storagePath),
  );
  return readFile(fullPath);
}

export async function deleteAvatarFile(storagePath: string): Promise<void> {
  const fullPath = assertInsidePath(
    AVATAR_STORAGE_ROOT,
    path.join(AVATAR_STORAGE_ROOT, storagePath),
  );
  await unlink(fullPath).catch(() => undefined);
}
```

อธิบายทีละส่วน:

1. **import จาก Node.js** — `fs/promises` (อ่าน/เขียนไฟล์แบบ `await` ได้), `path` (ต่อ path ให้ถูกทั้ง
   Windows `\` และ Linux `/`), `crypto.randomUUID` (สุ่มชื่อไม่ซ้ำ)
2. **ตำแหน่งเก็บไฟล์คงที่** — `<โฟลเดอร์โปรเจกต์>/storage/documents` และ `/storage/avatars`
   - `process.cwd()` = โฟลเดอร์ที่รัน `npm run dev`/`start`
   - ตั้งใจ **ไม่** อ่าน path จาก env: ถ้า path เป็นค่าไดนามิก Next.js จะตามไฟล์ (file tracing)
     ไม่ถูกและอาจดึงทั้งโปรเจกต์เข้าไปใน build — ถ้าต้องการเก็บที่อื่นให้ mount โฟลเดอร์มาที่ path นี้
   - `storage/` อยู่ใน `.gitignore` แล้ว (Step 4.5) และอยู่ **นอก `public/`** — ไฟล์จึงเปิดตรง ๆ
     จาก URL ไม่ได้ ต้องผ่าน route ที่ตรวจสิทธิ์ก่อนเสมอ
3. **ขนาดไฟล์สูงสุด** — IIFE แบบเดียวกับ `config.ts` แต่ใช้ `Number.isFinite` (ยอมให้เป็นทศนิยม เช่น `2.5` MB)
   แล้วแปลงเป็น byte: `MB × 1024 × 1024` ไว้เทียบกับ `file.size`
   (ค่านี้ต้องไม่เกิน `bodySizeLimit` ใน `next.config.ts` ซึ่งอ่านจาก env ตัวเดียวกัน)
4. **`isAllowedAvatarMimeType`** — รูปโปรไฟล์รับเฉพาะ png/jpeg/webp/gif
5. **`assertInsidePath` — กัน Path Traversal**
   ถ้า `storagePath` ใน DB ถูกแก้เป็น `../../.env` → `path.join` จะได้ path ที่หลุดออกนอก storage
   ฟังก์ชันนี้ `path.resolve` ให้เป็น path เต็มแล้วตรวจว่ายังขึ้นต้นด้วย root → ถ้าไม่ throw ทันที
   > 💡 เพื่อความเข้มงวดขึ้น ควรเทียบกับ `root + path.sep` เพราะ `startsWith` แบบตรง ๆ
   > จะยอมให้ `storage/documents-อื่น` ผ่านได้ด้วย
6. **`saveDocumentFile`**
   - สร้างโฟลเดอร์ย่อยตาม id เอกสาร (`recursive: true` = สร้างโฟลเดอร์แม่ให้ด้วย, มีอยู่แล้วก็ไม่ error)
   - **ไม่ใช้ชื่อไฟล์ที่ผู้ใช้ส่งมา** — ตั้งชื่อใหม่เป็น UUID + นามสกุลเดิม (ตัดให้ไม่เกิน 20 ตัวอักษร)
     กันชื่อซ้ำ ชื่อภาษาไทย/อักขระแปลก และการยัด path มาในชื่อ
   - คืน **path แบบ relative** (`<documentId>/<uuid>.pdf`) ไปเก็บใน `DocumentFile.storagePath`
     ย้ายเครื่อง/ย้ายโฟลเดอร์โปรเจกต์แล้วยังใช้ได้; ชื่อต้นฉบับเก็บแยกใน `DocumentFile.fileName`
7. **`readDocumentFile`** — คืน `Buffer` ให้ route ดาวน์โหลดส่งกลับเป็น response
8. **`deleteDocumentFile`** — `.catch(() => undefined)` = ถ้าไฟล์หายไปแล้วก็ไม่ถือเป็น error
   (ลบแถวใน DB ต่อได้)
9. **ฟังก์ชัน avatar** — เหมือนกันแต่เก็บรวมในโฟลเดอร์เดียว ชื่อไฟล์ `<userId>-<uuid>.<ext>`
   และถ้าไม่มีนามสกุลใช้ `.jpg`

วิธีใช้ใน Server Action (รับไฟล์จากฟอร์ม):

```ts
const file = formData.get("file") as File;
if (file.size > MAX_UPLOAD_SIZE_BYTES) {
  return { error: `ไฟล์ต้องไม่เกิน ${MAX_UPLOAD_SIZE_MB} MB` };
}
const buffer = Buffer.from(await file.arrayBuffer());   // File (Web API) → Buffer (Node)
const { storagePath } = await saveDocumentFile(documentId, file.name, buffer);
await prisma.documentFile.create({
  data: { documentId, fileName: file.name, storagePath, mimeType: file.type, sizeBytes: file.size },
});
```

---

## Step 12: Component ที่ใช้ร่วมกัน: วันที่, แบ่งหน้า, ปุ่มยืนยัน, ดูตัวอย่างไฟล์

สร้าง 7 ไฟล์ใน `src/components/`

| ไฟล์ | ประเภท | ใช้ที่ไหน |
| --- | --- | --- |
| `FormattedDate.tsx` | Server/Client ได้ทั้งคู่ | ทุกที่ที่แสดงวันที่เอกสาร |
| `Pagination.tsx` | **Server** Component | รายการเอกสาร, audit log |
| `DeleteButton.tsx` | Client | ลบเอกสาร/ไฟล์แนบ/ข้อมูลหลักใน admin |
| `DeleteDocumentButton.tsx` | Client | ปุ่มลบในหน้ารายละเอียดเอกสาร |
| `ApproveButton.tsx` | Client | หน้ารายละเอียดเอกสาร |
| `UnapproveButton.tsx` | Client | หน้ารายละเอียดเอกสาร |
| `FilePreview.tsx` | Client | รายการไฟล์แนบ |

### 12.1 `src/components/FormattedDate.tsx` — แสดงวันที่

```tsx
/**
 * Renders a date as dd/mm/yyyy (Gregorian / ค.ศ.), fixed regardless of locale.
 * Uses UTC getters because document dates are stored as UTC midnight (parsed
 * from a plain "YYYY-MM-DD" <input type="date"> value) — local-time getters
 * would shift the displayed day in timezones behind UTC.
 */
export function FormattedDate({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();

  return (
    <>
      {dd}/{mm}/{yyyy}
    </>
  );
}
```

- รับได้ทั้ง `Date` (จาก Prisma) และ `string` (เช่น ค่าที่ผ่าน JSON มา)
- **ทำไมใช้ `getUTC...`?** — `<input type="date">` ส่งค่าเป็น `"2026-09-29"`
  ซึ่ง `new Date("2026-09-29")` ตีความเป็น **เที่ยงคืน UTC** ถ้าอ่านด้วยเวลาท้องถิ่น
  ในเขตเวลาที่อยู่หลัง UTC (เช่นอเมริกา) จะกลายเป็นวันที่ 28 — ใช้ UTC จึงได้วันที่ตรงกับที่กรอกเสมอ
- `getUTCMonth()` เริ่มที่ 0 จึงต้อง `+ 1`; `padStart(2, "0")` เติม 0 ข้างหน้า (`9` → `09`)
- ไม่มี `"use client"` และไม่ใช้ hook → ใช้ได้ทั้งใน Server และ Client Component
- `<>...</>` = Fragment คืนแค่ข้อความ ไม่มี tag ครอบ
- ต่างจาก Dashboard (Step 10.3) ที่ใช้ `Intl.DateTimeFormat("th-TH")` แสดงแบบ พ.ศ. —
  component นี้แสดง **ค.ศ. แบบตัวเลข** สำหรับวันที่ของเอกสาร

ใช้งาน: `<FormattedDate date={document.documentDate} />` → `29/09/2026`

### 12.2 `src/components/Pagination.tsx` — แบ่งหน้า

```tsx
import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1,
  ).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2);

  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      <p className="text-gray-500">
        หน้า {page} จาก {totalPages}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <Link
            href={buildHref(prevPage)}
            aria-disabled={page === 1}
            className={`rounded border px-3 py-1.5 ${
              page === 1
                ? "pointer-events-none border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ก่อนหน้า
          </Link>
        </li>

        {pageNumbers.map((p, idx) => {
          const prev = pageNumbers[idx - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <li key={p} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-gray-400">…</span>}
              <Link
                href={buildHref(p)}
                className={`rounded border px-3 py-1.5 ${
                  p === page
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            href={buildHref(nextPage)}
            aria-disabled={page === totalPages}
            className={`rounded border px-3 py-1.5 ${
              page === totalPages
                ? "pointer-events-none border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ถัดไป
          </Link>
        </li>
      </ul>
    </nav>
  );
}
```

อธิบาย:

1. **ใช้ลิงก์ ไม่ใช้ state** — เลขหน้าอยู่ใน URL (`?page=3`) ทำให้ bookmark/แชร์ลิงก์/กด back ได้
   และหน้า server อ่าน `searchParams.page` ไป query ได้ตรง ๆ
2. **`buildHref`** — ให้หน้าที่เรียกเป็นคนกำหนดวิธีสร้าง URL เอง (เพื่อคงคำค้น/ตัวกรองอื่นไว้)
   > ⚠️ `buildHref` เป็นฟังก์ชัน จึงใช้ `Pagination` ได้จาก **Server Component เท่านั้น**
   > (ส่งฟังก์ชันธรรมดาจาก server ไปให้ Client Component ไม่ได้) — ไฟล์นี้จึงไม่มี `"use client"`
3. `totalPages <= 1` → ไม่ต้องแสดงอะไร (`return null`)
4. `Math.max(1, ...)` / `Math.min(totalPages, ...)` — กันไม่ให้ก่อนหน้า/ถัดไปหลุดช่วง
5. **เลือกเลขหน้าที่จะแสดง** — สร้าง `[1..totalPages]` แล้วเก็บเฉพาะ หน้าแรก, หน้าสุดท้าย และหน้าที่ห่างจากหน้าปัจจุบัน ≤ 2
   ```text
   totalPages = 20, page = 10
   → [1, 8, 9, 10, 11, 12, 20]
   แสดง: 1 … 8 9 [10] 11 12 … 20
   ```
6. **`…` (ellipsis)** — ถ้าเลขที่อยู่ติดกันใน array ห่างกันเกิน 1 แปลว่ามีหน้าที่ถูกข้าม
7. ปุ่มที่กดไม่ได้ใช้ `pointer-events-none` + `aria-disabled` (`<Link>` ไม่มี attribute `disabled`)

ตัวอย่างใช้ในหน้ารายการเอกสาร:

```tsx
const params = await searchParams;
const page = Math.max(1, Number(params.page) || 1);
const total = await prisma.document.count({ where });
const totalPages = Math.ceil(total / DOCUMENTS_PAGE_SIZE);

<Pagination
  page={page}
  totalPages={totalPages}
  buildHref={(p) => {
    const qs = new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: String(p) });
    return `/documents?${qs}`;
  }}
/>
```

### 12.3 `src/components/DeleteButton.tsx` — ปุ่มลบพร้อมกล่องยืนยัน

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteButton({
  id,
  itemLabel,
  action,
  onDeleted,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        if (onDeleted) {
          onDeleted();
        } else {
          router.refresh();
        }
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
      >
        ลบ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {error ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  ไม่สามารถลบได้
                </h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    ปิด
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  ยืนยันการลบ
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  ต้องการลบ &ldquo;{itemLabel}&rdquo; ใช่หรือไม่?
                  การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? "กำลังลบ..." : "ลบ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

อธิบาย:

1. **Props**
   | prop | ความหมาย |
   | --- | --- |
   | `id` | id ของสิ่งที่จะลบ |
   | `itemLabel` | ชื่อที่แสดงในกล่องยืนยัน เช่น เลขที่เอกสาร |
   | `action` | **Server Action** ที่ทำการลบจริง ต้องคืน `{ error?: string }` |
   | `onDeleted` | (ไม่บังคับ) ทำอะไรหลังลบสำเร็จ — ถ้าไม่ส่งมาจะ refresh หน้าเดิม |
2. **ส่ง Server Action เป็น prop ได้** — ฟังก์ชันที่มี `"use server"` ส่งจาก Server Component
   ไปให้ Client Component ได้ (React แปลงเป็นการเรียก HTTP ให้อัตโนมัติ) แต่ **ฟังก์ชันธรรมดาส่งไม่ได้**
3. **State 3 ตัว**
   - `open` — เปิด/ปิดกล่องยืนยัน
   - `error` — ข้อความผิดพลาดจาก server (เช่น "ไม่มีสิทธิ์") ถ้ามีจะสลับไปแสดงหน้าจอข้อผิดพลาด
   - `isPending` จาก **`useTransition`** — `true` ระหว่างรอ server ใช้ disable ปุ่มและเปลี่ยนข้อความ
     เป็น "กำลังลบ..." กันกดซ้ำ
4. **คืน error แทนการ throw** — Server Action คืน `{ error: "..." }` เพื่อให้แสดงข้อความภาษาไทยที่เป็นมิตรได้
   (ถ้า throw ผู้ใช้จะเห็นหน้า error ของ Next.js)
5. **`router.refresh()`** — ขอให้ server render หน้าปัจจุบันใหม่ (ข้อมูลที่ลบไปจะหายจากตาราง)
   โดยไม่โหลดทั้งหน้าและไม่เสีย state ฝั่ง client อื่น ๆ
6. **Modal** — `fixed inset-0 z-50` คลุมเต็มจอ, `bg-black/40` พื้นหลังโปร่งดำ 40%
7. `&ldquo;` `&rdquo;` = เครื่องหมายคำพูด “ ” (ESLint ของ React ไม่ให้ใช้ `"` ตรง ๆ ใน JSX)

ตัวอย่างใช้งาน (ใน Server Component):

```tsx
import { deleteDocumentFileAction } from "./actions";   // ไฟล์ที่มี "use server"

<DeleteButton id={file.id} itemLabel={file.fileName} action={deleteDocumentFileAction} />
```

### 12.4 `src/components/DeleteDocumentButton.tsx` — ลบเอกสารแล้วกลับหน้ารายการ

```tsx
"use client";

import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";

export function DeleteDocumentButton({
  id,
  itemLabel,
  action,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();

  return (
    <DeleteButton
      id={id}
      itemLabel={itemLabel}
      action={action}
      onDeleted={() => router.push("/documents")}
    />
  );
}
```

**ทำไมต้องมีไฟล์นี้?** — หน้ารายละเอียดเอกสาร (`/documents/[id]`) เป็น Server Component
เมื่อลบเอกสารแล้ว `router.refresh()` จะ render หน้าของเอกสารที่ไม่มีอยู่แล้ว (404)
เราต้องการ `onDeleted={() => router.push("/documents")}` แต่ **Server Component ส่งฟังก์ชันธรรมดาให้
Client Component ไม่ได้** → จึงทำ Client Component ตัวห่อ (wrapper) ที่สร้างฟังก์ชันนั้นฝั่ง client เอง
แล้วหน้า server แค่ส่ง `id`, `itemLabel`, `action` (ซึ่งส่งได้) มาให้

### 12.5 `src/components/ApproveButton.tsx` — ปุ่มอนุมัติ

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ApproveButton({
  id,
  itemLabel,
  action,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        อนุมัติเอกสาร
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {error ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  ไม่สามารถอนุมัติได้
                </h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    ปิด
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  ยืนยันการอนุมัติ
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  ยืนยันว่า &ldquo;{itemLabel}&rdquo; ถูกต้องแล้ว? หลังอนุมัติ
                  จะลบเอกสารหรือไฟล์แนบได้เฉพาะหัวหน้างานของหน่วยงานนี้หรือผู้ดูแลระบบเท่านั้น
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending ? "กำลังอนุมัติ..." : "ยืนยันอนุมัติ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

โครงสร้างเหมือน `DeleteButton` ทุกประการ ต่างกันที่ข้อความและสี (เขียว) และไม่มี `onDeleted`
(อนุมัติแล้วอยู่หน้าเดิม แค่ `router.refresh()` ให้ป้าย "อนุมัติแล้ว" ปรากฏ)

Server Action ที่ส่งเข้ามาควรทำ:
1. `auth()` → หาเอกสาร → ตรวจ `canApproveDocument(session.user, doc.departmentId)`
2. `update` ตั้ง `approvedAt: new Date()`, `approvedById: session.user.id`
3. บันทึก `DocumentAudit` action `"APPROVE"`
4. คืน `{}` เมื่อสำเร็จ หรือ `{ error: "..." }`

แสดงปุ่มเฉพาะเมื่อมีสิทธิ์และยังไม่อนุมัติ:

```tsx
{!doc.approvedAt && canApproveDocument(session.user, doc.departmentId) && (
  <ApproveButton id={doc.id} itemLabel={doc.documentNumber} action={approveDocument} />
)}
```

### 12.6 `src/components/UnapproveButton.tsx` — ปุ่มยกเลิกอนุมัติ

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function UnapproveButton({
  id,
  itemLabel,
  action,
}: {
  id: string;
  itemLabel: string;
  action: (id: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
      >
        ยกเลิกการอนุมัติ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            {error ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  ไม่สามารถยกเลิกการอนุมัติได้
                </h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    ปิด
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  ยืนยันการยกเลิกอนุมัติ
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  ต้องการยกเลิกการอนุมัติ &ldquo;{itemLabel}&rdquo; ใช่หรือไม่?
                  เอกสารจะกลับไปเป็นสถานะรออนุมัติ
                  และเจ้าหน้าที่ในหน่วยงานจะสามารถแก้ไขเอกสารหรือไฟล์แนบได้อีกครั้ง
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิกอนุมัติ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

แบบเดียวกับ `ApproveButton` แต่ใช้สีเหลือง (amber) — Server Action ที่ส่งเข้ามาควรตั้ง
`approvedAt: null, approvedById: null` และใช้สิทธิ์ `canApproveDocument` เหมือนตอนอนุมัติ

> 💡 **แบบฝึกหัด:** `DeleteButton`, `ApproveButton`, `UnapproveButton` มีโครงเหมือนกันเกือบทั้งหมด
> ลองรวมเป็น `ConfirmActionButton` ตัวเดียวที่รับ prop ข้อความและสี เพื่อลดโค้ดซ้ำ

### 12.7 `src/components/FilePreview.tsx` — ดูตัวอย่างและพิมพ์ไฟล์

```tsx
"use client";

import { useState } from "react";

const PREVIEWABLE_PREFIXES = ["image/"];
const PREVIEWABLE_TYPES = ["application/pdf"];

export function isPreviewable(mimeType: string): boolean {
  return (
    PREVIEWABLE_TYPES.includes(mimeType) ||
    PREVIEWABLE_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
  );
}

export function FilePreview({
  fileName,
  mimeType,
  previewUrl,
}: {
  fileName: string;
  mimeType: string;
  previewUrl: string;
}) {
  const [open, setOpen] = useState(false);

  if (!isPreviewable(mimeType)) return null;

  function handlePrint() {
    const printWindow = window.open(previewUrl, "_blank");
    if (!printWindow) return;
    printWindow.addEventListener("load", () => printWindow.print());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-blue-600 hover:underline"
      >
        ดูตัวอย่าง
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="truncate text-sm font-medium text-gray-900">
                {fileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  พิมพ์
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="ปิด"
                  className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-2">
              {mimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title={fileName}
                  className="h-[75vh] w-full rounded border border-gray-200 bg-white"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="mx-auto max-h-[75vh] max-w-full rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

อธิบาย:

1. **`isPreviewable`** — ดูตัวอย่างได้เฉพาะ PDF และรูปทุกชนิด (`image/png`, `image/jpeg`, ...)
   export แยกไว้ให้หน้าอื่นใช้ตัดสินใจได้ด้วย (เช่น แสดง/ซ่อนคอลัมน์)
   - `.includes()` — ตรงตัวทั้งคำ
   - `.some(prefix => startsWith(prefix))` — ขึ้นต้นด้วย `image/` อย่างใดอย่างหนึ่ง
2. ไฟล์ชนิดอื่น (Word, Excel, zip) → `return null` ไม่แสดงปุ่มเลย (ผู้ใช้ดาวน์โหลดแทน)
   — `useState` ถูกเรียก **ก่อน** `return null` เสมอ ตามกฎของ hooks (ห้ามเรียก hook หลังเงื่อนไข)
3. **`previewUrl`** — URL ของ Route Handler ที่ส่งไฟล์กลับแบบ `Content-Disposition: inline`
   (สร้างใน Step 15) — route นั้นต้องตรวจ `canViewDocument` ก่อนส่งไฟล์
4. **PDF แสดงใน `<iframe>`** (ใช้ตัวอ่าน PDF ของ browser) ส่วน **รูปใช้ `<img>`**
5. **พิมพ์** — เปิดไฟล์ในแท็บใหม่ รอโหลดเสร็จ (`load`) แล้วเรียก `print()`
   `window.open` อาจคืน `null` ถ้า browser บล็อก popup → `return` ไม่ทำอะไร
6. `&times;` = เครื่องหมาย ×, `aria-label="ปิด"` ให้ screen reader อ่านได้
7. `truncate` — ชื่อไฟล์ยาวจะถูกตัดด้วย `…` ไม่ดันปุ่มตกบรรทัด

> ℹ️ `npm run lint` จะเตือน `@next/next/no-img-element` ที่บรรทัด `<img>` ในไฟล์นี้
> (เป็นแค่ warning) — `next/image` ไม่เหมาะกับไฟล์ที่ต้องผ่าน route ตรวจสิทธิ์และไม่รู้ขนาดล่วงหน้า
> จึงใช้ `<img>` ได้ ให้เพิ่มบรรทัดนี้เหนือ `<img>` แบบเดียวกับใน `AppShell.tsx` เพื่อปิดคำเตือน:
> ```tsx
> // eslint-disable-next-line @next/next/no-img-element
> ```

---

## Step 13: รันและทดสอบ

### 13.1 ลำดับคำสั่งตั้งแต่ต้น (เครื่องใหม่ / clone มาจาก git)

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

### 13.2 Checklist ทดสอบ

| # | ทดสอบ | ผลที่ควรได้ |
| --- | --- | --- |
| 1 | เปิด `/` โดยยังไม่ login | ไป `/login?callbackUrl=%2Fdashboard` |
| 2 | login ด้วยรหัสผิด | กลับมาหน้า login พร้อมกล่องแดง "อีเมลหรือรหัสผ่านไม่ถูกต้อง" |
| 3 | กดไอคอนรูปตา | รหัสผ่านสลับแสดง/ซ่อน |
| 4 | login ด้วยบัญชี admin จาก seed (ดู `prisma/seed.ts`) | ไปหน้า `/dashboard` (ตาม callbackUrl) |
| 5 | เปิด `/login` ตรง ๆ (ไม่มี callbackUrl) แล้ว login | ไปหน้า `/dashboard` (ค่า default ใหม่) |
| 6 | ดู Dashboard | เห็นการ์ด 4 ใบ, role "ผู้ดูแลระบบ", หน่วยงาน "ฝ่ายเทคโนโลยีสารสนเทศ" |
| 7 | Sidebar | เห็นกลุ่ม "จัดการระบบ" (เพราะเป็น ADMIN) |
| 8 | เปิด `/login` ขณะ login อยู่ | ถูก redirect ไป `/documents` (ตาม `proxy.ts` — ดูหมายเหตุ Step 9.5) |
| 9 | กด "ออกจากระบบ" | กลับหน้า `/login` และเข้า `/dashboard` ไม่ได้อีก |

> 🔐 เปลี่ยนรหัสผ่าน admin เริ่มต้นทันทีหลังติดตั้งบนเครื่องจริง

Library และ component ใน Step 11–12 ยังไม่มีหน้าไหนเรียกใช้ จะทดสอบผ่านหน้าจริงได้เมื่อสร้างหน้าใน Step 15
ระหว่างนี้ให้ตรวจว่า compile ผ่านด้วยคำสั่งในหัวข้อ 13.3

### 13.3 ตรวจคุณภาพโค้ด

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

ผลที่ควรได้ ณ ตอนนี้: `tsc` ไม่มี error; `lint` มี warning 1 จุด (`<img>` ใน `FilePreview.tsx` — ดู Step 12.7)

---

## Step 14: แก้ปัญหาที่พบบ่อย

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
| เปิด `/login` ตอน login อยู่แล้วเจอ 404 | `proxy.ts` ส่งไป `/documents` ซึ่งยังไม่ได้สร้าง → แก้ proxy เป็น `/dashboard` หรือสร้างหน้าใน Step 15 |
| เปิดจากเครื่องอื่นในแลนแล้วค้าง/ถูกบล็อก | เพิ่ม IP ใน `allowedDevOrigins` ของ `next.config.ts` |
| `Body exceeded 1 MB limit` | ปรับ `MAX_UPLOAD_SIZE_MB` ใน `.env` แล้ว restart |
| `Functions cannot be passed directly to Client Components` | ส่งฟังก์ชันธรรมดาจาก Server → Client ไม่ได้ ใช้ Server Action (`"use server"`) หรือทำ wrapper แบบ `DeleteDocumentButton` (Step 12.4) |
| สร้างเอกสารแล้วเจอ `Unique constraint failed ... documentNumber` (P2002) | เลขที่เอกสารชนกัน — ดูข้อควรระวังใน Step 11.4 |
| `Resolved storage path escapes the storage root` | `storagePath` ใน DB ชี้ออกนอกโฟลเดอร์ `storage/` — ตรวจข้อมูลในตาราง `DocumentFile` |
| `ENOENT` ตอนดาวน์โหลดไฟล์ | ไฟล์ใน `storage/documents` หายหรือยังไม่ได้ย้ายมาเครื่องใหม่ (`storage/` ไม่อยู่ใน git) |
| วันที่เอกสารแสดงเลื่อนไป 1 วัน | ใช้ `getDate()` แทน `getUTCDate()` — ใช้ `<FormattedDate>` (Step 12.1) |

---

## Step 15: ขั้นตอนต่อไป

Library กลาง (Step 11) และ component (Step 12) พร้อมแล้ว เหลือหน้าจอที่เมนูอ้างถึง — สร้างต่อตามลำดับนี้
(แต่ละหน้าใช้แพตเทิร์นเดียวกับ Dashboard: `auth()` → ตรวจสิทธิ์ด้วย `access.ts` → `prisma` query → ห่อด้วย `<AppShell>`)

| ลำดับ | ไฟล์ที่ต้องสร้าง | หน้าที่ | ใช้ของจาก Step 11–12 |
| --- | --- | --- | --- |
| 1 | `src/app/documents/page.tsx` | รายการเอกสาร + ค้นหา + แบ่งหน้า | `documentScopeFilter`, `DOCUMENTS_PAGE_SIZE`, `Pagination`, `FormattedDate` |
| 2 | `src/app/documents/new/page.tsx` + `actions.ts` | ฟอร์มสร้างเอกสาร + อัปโหลดไฟล์ + audit `CREATE` | `canManageDocument`, `generateDocumentNumber`, `saveDocumentFile`, `MAX_UPLOAD_SIZE_BYTES` |
| 3 | `src/app/documents/[id]/page.tsx` + `actions.ts` | รายละเอียด, อนุมัติ/ยกเลิก, ลบ, แก้ไข | `canViewDocument`, `canEditDocument`, `canDeleteDocument`, `canApproveDocument`, `ApproveButton`, `UnapproveButton`, `DeleteDocumentButton`, `DeleteButton` |
| 4 | `src/app/api/documents/files/[fileId]/route.ts` | ส่งไฟล์ให้ดาวน์โหลด/ดูตัวอย่าง + audit `DOWNLOAD` | `canViewDocument`, `readDocumentFile`, `FilePreview` |
| 5 | `src/app/profile/page.tsx` + `src/app/api/users/[id]/avatar/route.ts` | แก้ข้อมูลส่วนตัว/รหัสผ่าน/รูปโปรไฟล์ | `saveAvatarFile`, `readAvatarFile`, `isAllowedAvatarMimeType`, `MAX_AVATAR_SIZE_BYTES` |
| 6 | `src/app/admin/departments`, `document-types`, `users` | CRUD ข้อมูลหลัก + ให้สิทธิ์ `DocumentTypeAccess` | `requireAdmin`, `DeleteButton` |
| 7 | `src/app/admin/audit-log/page.tsx` | ดูประวัติการใช้งาน | `requireAdmin`, `AUDIT_LOG_PAGE_SIZE`, `Pagination` |

แต่ละงานถัดไปจะมีหัวข้อใหม่เพิ่มต่อท้าย workshop นี้ พร้อมอธิบายทุกไฟล์ที่สร้าง/แก้ไขแบบ step by step

---

## Step 16: แก้บั๊กเพิ่มผู้ใช้ใหม่แล้วเจอ "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว"

โจทย์ที่แก้ใน Step นี้:

- ทดสอบเพิ่มผู้ใช้ด้วยชื่อ `sale` และอีเมล `sale@gmail.com` แล้วกด Save
- ระบบแจ้งว่า "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว"
- แต่ตรวจแล้วพบว่าอีเมลนี้ยังไม่มีในระบบ

สาเหตุจริง:

- ใน SQL Server มี unique constraint ที่คอลัมน์ `employeeCode` ของตาราง `User`
- คอลัมน์นี้เป็น optional (`NULL` ได้) แต่ unique constraint ที่ถูกสร้างไว้ทำให้ค่า `NULL` ชนกันได้
- พอเพิ่มผู้ใช้ใหม่โดยไม่กรอก `employeeCode` จึงชนค่า `<NULL>` กับแถวเดิม
- Prisma จึงโยน `P2002` และหน้า UI แสดงข้อความรวมว่า "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว"

แนวทางแก้ (ตัวเลือกที่เลือกใช้):

- เอา `@unique` ออกจาก `employeeCode` ใน Prisma schema
- สร้าง migration เพื่อลบ constraint `User_employeeCode_key` ออกจาก SQL Server

### 16.1 ไฟล์ที่แก้ไข

ไฟล์ที่ 1: `prisma/schema.prisma`

โค้ดเต็มของส่วน `model User` หลังแก้ไข:

```prisma
model User {
  id           String  @id @default(cuid())
  employeeCode String? // รหัสพนักงาน (optional)
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

อธิบาย:

- เปลี่ยนจาก `employeeCode String? @unique` เป็น `employeeCode String?`
- ทำให้ `employeeCode` ยังเป็น field ทางเลือกเหมือนเดิม แต่ไม่บังคับ unique แล้ว
- ป้องกันปัญหาเพิ่มผู้ใช้หลายคนที่มี `employeeCode = NULL` แล้วชน constraint

ไฟล์ที่ 2: `prisma/migrations/20260930043745_remove_unique_employeecode/migration.sql`

โค้ดเต็มไฟล์:

```sql
BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_employeeCode_key];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
```

อธิบาย:

- migration นี้ลบ unique constraint เดิมของ `employeeCode`
- ใช้ transaction ครอบ เพื่อให้ rollback ได้ถ้าเกิดข้อผิดพลาด

### 16.2 คำสั่งที่ใช้

1. แก้ schema (`prisma/schema.prisma`) โดยเอา `@unique` ออก
2. สร้างและ apply migration

```bash
npm run db:migrate
```

หรือคำสั่งเทียบเท่า:

```bash
npx prisma migrate dev --name remove_unique_employeecode
```

3. ทดสอบซ้ำโดยสร้างผู้ใช้ใหม่ที่ไม่กรอก `employeeCode`

ผลที่ควรได้:

- บันทึกผู้ใช้ผ่าน
- ไม่ขึ้นข้อความ "ข้อมูลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว" จากกรณี `<NULL>` อีก

### 16.3 หมายเหตุสำคัญ

- ถ้าในอนาคตต้องการให้ `employeeCode` ไม่ซ้ำจริง แนะนำทำให้เป็น required field และบังคับกรอกจากฟอร์มแทน
- สำหรับระบบปัจจุบันที่ยังไม่ใช้ `employeeCode` ในฟอร์มเพิ่มผู้ใช้ การถอด unique เป็นทางแก้ที่ตรงอาการและปลอดภัยกว่า

---

## Step 17: แก้บั๊กอัปโหลดรูปโปรไฟล์แล้วรูปไม่เปลี่ยนทันที

โจทย์ที่แก้ใน Step นี้:

- ผู้ใช้อัปโหลดรูปใหม่ที่หน้า `/profile?success=avatar`
- ระบบแจ้งสำเร็จ แต่รูปที่เห็นยังเป็นรูปเดิม

สาเหตุหลัก:

- URL รูปที่ใช้แสดงผลคงที่ (`/api/users/:id/avatar`) ทำให้ browser มีโอกาสใช้ cache รูปเดิม
- endpoint รูปโปรไฟล์เคยตั้ง `Cache-Control: private, max-age=3600` ทำให้ browser เก็บรูปไว้ได้ 1 ชั่วโมง

แนวทางแก้:

- ทำ **cache-busting** โดยใส่ query string `v=<avatarPath>` ลงใน URL รูป
  เพราะ `avatarPath` จะเปลี่ยนทุกครั้งที่อัปโหลดไฟล์ใหม่
- ปรับ header ของ API รูปเป็น `private, no-store, max-age=0` เพื่อให้ browser ไม่เก็บไฟล์รูป endpoint นี้

### 17.1 ไฟล์ที่แก้ไข

ไฟล์ที่ 1: `src/app/profile/page.tsx`

โค้ดเต็มไฟล์หลังแก้ไข:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { PasswordInput } from "@/components/PasswordInput";
import { MAX_AVATAR_SIZE_MB } from "@/lib/storage";
import { changePassword, updateAvatar } from "./actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error, success } = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { department: true },
  });

  return (
    <AppShell
      userLabel={session.user.name ?? session.user.email ?? undefined}
      userId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
      role={session.user.role}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-xl font-semibold text-gray-900">โปรไฟล์ของฉัน</h1>
          <p className="text-sm text-gray-500">
            {user.name} — {user.email} — {user.department.name}
          </p>
        </header>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success === "password" && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            เปลี่ยนรหัสผ่านสำเร็จ
          </p>
        )}
        {success === "avatar" && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            อัปเดตรูปโปรไฟล์สำเร็จ
          </p>
        )}

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">รูปโปรไฟล์</h2>
          <div className="mt-4 flex items-center gap-6">
            {user.avatarPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/users/${user.id}/avatar?v=${encodeURIComponent(user.avatarPath)}`}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-500">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}

            <form action={updateAvatar} className="flex-1 space-y-2">
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp,image/gif"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                รองรับ PNG, JPEG, WEBP, GIF — ขนาดไฟล์สูงสุด{" "}
                {MAX_AVATAR_SIZE_MB} MB
              </p>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                อัปโหลดรูปใหม่
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            เปลี่ยนรหัสผ่าน
          </h2>
          <form action={changePassword} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                รหัสผ่านปัจจุบัน
              </label>
              <PasswordInput
                name="currentPassword"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                รหัสผ่านใหม่
              </label>
              <PasswordInput
                name="newPassword"
                required
                minLength={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                ยืนยันรหัสผ่านใหม่
              </label>
              <PasswordInput
                name="confirmPassword"
                required
                minLength={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
```

อธิบายจุดสำคัญ:

- เปลี่ยน `src` ของ `<img>` เป็น
  `/api/users/${user.id}/avatar?v=${encodeURIComponent(user.avatarPath)}`
- เมื่ออัปโหลดรูปใหม่ `avatarPath` ในฐานข้อมูลจะเปลี่ยน ทำให้ URL ใหม่ต่างจากเดิม
- browser จึงต้องยิง request ใหม่ และแสดงรูปใหม่ทันที

ไฟล์ที่ 2: `src/components/AppShell.tsx`

โค้ดเต็มไฟล์หลังแก้ไข:

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
                  src={`/api/users/${userId}/avatar?v=${encodeURIComponent(user.avatarPath)}`}
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

อธิบายจุดสำคัญ:

- ส่วน avatar ใน header ใช้ URL แบบมี `v=<avatarPath>` เช่นเดียวกับหน้าโปรไฟล์
- หลังอัปโหลดรูปใหม่แล้วกลับไปหน้าอื่นในระบบ รูปมุมขวาบนจะอัปเดตทันทีด้วย

ไฟล์ที่ 3: `src/app/api/users/[id]/avatar/route.ts`

โค้ดเต็มไฟล์หลังแก้ไข:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readAvatarFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { avatarPath: true },
  });

  if (!user?.avatarPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readAvatarFile(user.avatarPath);
  const ext = user.avatarPath.split(".").pop()?.toLowerCase();
  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
```

อธิบายจุดสำคัญ:

- เดิม `Cache-Control` เป็น `private, max-age=3600` (browser เก็บรูปเดิมได้นาน)
- เปลี่ยนเป็น `private, no-store, max-age=0` เพื่อไม่ให้ browser เก็บ cache รูป endpoint นี้
- รวมกับ query string version จะลดโอกาสเห็นรูปเก่าหลังอัปโหลดได้ชัดเจน

### 17.2 คำสั่งที่ต้องรัน

งานนี้แก้เฉพาะโค้ดฝั่งแอป ไม่ต้อง migrate ฐานข้อมูล

รันเพื่อตรวจสอบโค้ด:

```bash
npm run lint
```

ถ้าระบบรันอยู่แล้ว ให้ทดสอบใหม่ที่หน้า `/profile` ได้ทันที

### 17.3 วิธีทดสอบแบบ step-by-step

1. login เข้าระบบ
2. เปิดหน้า `/profile`
3. เลือกรูปใหม่ แล้วกด "อัปโหลดรูปใหม่"
4. ระบบ redirect กลับมาที่ `/profile?success=avatar`
5. ตรวจว่ารูปใหญ่ในหน้าโปรไฟล์เปลี่ยนทันที
6. คลิกไปหน้าอื่น เช่น `/dashboard` แล้วดูรูปมุมขวาบน ต้องเป็นรูปใหม่ทันที

ผลที่คาดหวังหลังแก้:

- ไม่ต้อง hard refresh ก็เห็นรูปใหม่
- ทั้งหน้าโปรไฟล์และ avatar ใน header ใช้รูปใหม่ตรงกัน

---

## Step 18: คู่มือ Deploy บน Ubuntu Server (`install.md`)

งานนี้ **ไม่แก้โค้ดของแอป** — สร้างเอกสารใหม่ 1 ไฟล์คือ `install.md` ที่ root ของโปรเจกต์ สำหรับนำระบบขึ้น production บน Ubuntu Server

### 18.1 ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `install.md` | **สร้างใหม่** — คู่มือติดตั้ง production ทีละขั้นตอน (โค้ด config ทุกไฟล์อยู่ในนั้นแบบเต็ม) |
| `workshop.md` | เพิ่ม Step 18 นี้ + สารบัญ + บรรทัด `install.md` ในโครงสร้างไฟล์ (Step 0) |

ไฟล์ที่ `install.md` สั่งให้สร้าง **บน server** (ไม่อยู่ใน repo):

| ไฟล์บน server | หน้าที่ | หัวข้อใน install.md |
| --- | --- | --- |
| `/opt/dsmtest/.env` | ค่าลับของ production (DB, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`) | ข้อ 6 |
| ~~`/etc/systemd/system/dsmtest.service`~~ | (เลิกใช้แล้ว — เปลี่ยนเป็น PM2 ใน Step 19) | ข้อ 8 |
| `/etc/nginx/sites-available/dsmtest` | reverse proxy, จำกัดขนาด upload, ส่ง `X-Forwarded-*`, ปิด buffering | ข้อ 9 |
| `/opt/dsmtest/deploy.sh` | สคริปต์อัปเดตเวอร์ชัน (pull → ci → generate → migrate deploy → build) | ข้อ 13 |
| `/usr/local/bin/dsmtest-backup.sh` | สำรอง DB + `storage/` + `.env` รายวัน | ข้อ 14 |

### 18.2 ลำดับเนื้อหาใน `install.md` และเหตุผล

1. **สิ่งที่ต้องเตรียม** — Node.js ต้องเป็น 22 LTS เพราะ `next@16` ต้องการ Node ≥ 20.9 และ `prisma@7` ต้องการ `^20.19 || ^22.12 || >=24` (ดูจาก `engines` ใน `node_modules/*/package.json`)
2. **เตรียมเครื่อง / ติดตั้ง Node.js** — ใช้ NodeSource เพราะ Node จาก repo Ubuntu เก่าเกินไป และตั้ง timezone `Asia/Bangkok`
3. **SQL Server** — สร้าง login `dsmtest_app` แยกจาก `sa` ให้สิทธิ์ `db_owner` เฉพาะ DB `dsmtest` (จำเป็นสำหรับ `prisma migrate deploy`)
4. **ดึงโค้ด + ผู้ใช้ `dsmtest`** — รันแอปด้วย system user ที่ไม่ใช่ root และสร้าง `storage/documents`, `storage/avatars` ไว้ล่วงหน้า เพราะ `src/lib/storage.ts` fix path ไว้ที่ `process.cwd()/storage/...` (ถ้าต้องการ disk อื่นให้ bind mount แทนการแก้โค้ด)
5. **`.env` ของ production** — เพิ่มจากเครื่อง dev 2 ตัว:
   - `AUTH_URL` — URL จริงที่ผู้ใช้เข้า
   - `AUTH_TRUST_HOST=true` — NextAuth v5 (`next-auth/lib/env.js`) จะตั้ง `trustHost` ให้เมื่อมี `AUTH_URL` หรือ `AUTH_TRUST_HOST` ถ้าไม่มีจะเจอ `UntrustedHost` เมื่ออยู่หลัง Nginx
6. **ติดตั้ง/migrate/seed/build** — ใช้ `npm ci` (ต้องได้ devDependencies เพราะ tailwind/typescript/tsx/dotenv ใช้ตอน build และ seed), `npx prisma generate` (เพราะ `src/generated/prisma` ถูก ignore), `npm run db:migrate:deploy` (ไม่ใช่ `migrate dev` ซึ่งอาจ reset DB) และ `npm run db:seed` ครั้งแรกครั้งเดียว — บัญชี `admin@company.local` / `Admin@1234` ต้องเปลี่ยนรหัสทันที
7. **systemd** (ภายหลังเปลี่ยนเป็น PM2 — ดู Step 19) — `WorkingDirectory=/opt/dsmtest` สำคัญเพราะทั้งการอ่าน `.env` และ path ของ `storage` อิง cwd, ฟังที่ `127.0.0.1:3000` เท่านั้น
8. **Nginx** — `client_max_body_size` ต้อง ≥ `MAX_UPLOAD_SIZE_MB` (default Nginx = 1 MB), `proxy_buffering off` ตามคู่มือ self-hosting ของ Next.js (`node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`) เพื่อรองรับ streaming
9. **HTTPS / Firewall** — certbot สำหรับ domain สาธารณะ หรือ cert ของ CA ภายใน; เปิดเฉพาะ SSH + 80/443
10. **ทดสอบ / อัปเดต / Backup / แก้ปัญหา** — checklist หลังติดตั้ง, สคริปต์ deploy ที่หยุดทันทีเมื่อขั้นใดล้ม, backup DB คู่กับ `storage/` เสมอ (DB เก็บแค่ path ของไฟล์) และตารางอาการ-สาเหตุ-วิธีแก้

### 18.3 คำสั่งที่ต้องรัน

บนเครื่อง dev ไม่มีคำสั่งที่ต้องรัน (งานเอกสารเท่านั้น) — คำสั่งทั้งหมดสำหรับ server อยู่ใน `install.md`

### 18.4 จุดที่ต้องระวัง

- `MAX_UPLOAD_SIZE_MB` ถูกอ่านใน `next.config.ts` ตอน **build** — เปลี่ยนค่าแล้วต้อง `npm run build` ใหม่ ไม่ใช่แค่ restart
- `allowedDevOrigins` ใน `next.config.ts` มีผลเฉพาะ `next dev` ไม่กระทบ production
- ห้ามสร้าง `AUTH_SECRET` ใหม่ทุกครั้งที่ deploy — ผู้ใช้ทุกคนจะหลุด login

---

## Step 19: เปลี่ยนมารันแอป production ด้วย PM2

Step 18 ให้รันแอปด้วย systemd unit ที่เขียนเอง งานนี้เปลี่ยนมาใช้ **PM2** (process manager ของ Node.js) แทน เพราะใช้งานง่ายกว่า ดู log/สถานะ/RAM ได้ด้วยคำสั่งเดียว และ reload build ใหม่ได้สะดวก

### 19.1 ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `ecosystem.config.cjs` | **สร้างใหม่** ที่ root ของโปรเจกต์ — ตั้งค่า process ของ PM2 (commit เข้า repo เพื่อให้ server ได้ไฟล์เดียวกันตอน `git pull`) |
| `install.md` | ข้อ 8 เขียนใหม่ทั้งหมดเป็น "รันแอปด้วย PM2"; แก้คำสั่ง restart/status/log ในข้อ 10, 12, 13, 15 จาก `systemctl`/`journalctl` เป็น `pm2`; `deploy.sh` เพิ่ม `pm2 reload` ท้ายสคริปต์; เพิ่มปัญหาที่พบบ่อยของ PM2 |
| `workshop.md` | เพิ่ม Step 19 + สารบัญ + บรรทัด `ecosystem.config.cjs` ในโครงสร้างไฟล์ (Step 0) + หมายเหตุใน Step 18 ว่าเลิกใช้ `dsmtest.service` |

### 19.2 สร้างไฟล์ `ecosystem.config.cjs`

path: **`ecosystem.config.cjs`** (root ของโปรเจกต์ ระดับเดียวกับ `package.json`)

```js
// PM2 process file for production (see install.md, section 8).
// Start:  pm2 start ecosystem.config.cjs
// Reload: pm2 reload ecosystem.config.cjs --update-env
module.exports = {
  apps: [
    {
      name: "dsmtest",
      // cwd matters: Next.js loads .env from here and src/lib/storage.ts
      // resolves ./storage relative to process.cwd()
      cwd: __dirname,
      // run the Next.js binary directly (not via npm) so PM2 manages the real
      // node process and signals/restarts reach it
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "1G",
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

อธิบายทีละส่วน:

| ส่วน | ทำอะไร / ทำไม |
| --- | --- |
| นามสกุล `.cjs` | บังคับให้ Node อ่านเป็น CommonJS จึงใช้ `module.exports` และ `__dirname` ได้เสมอ แม้วันหน้าจะตั้ง `"type": "module"` ใน `package.json` |
| `name` | ชื่อแอปใน PM2 ใช้กับ `pm2 logs dsmtest`, `pm2 restart dsmtest` |
| `cwd: __dirname` | working directory = โฟลเดอร์โปรเจกต์ — Next.js อ่าน `.env` จากที่นี่ และ `src/lib/storage.ts` สร้าง path `storage/...` จาก `process.cwd()` ถ้า cwd ผิด ไฟล์อัปโหลดจะไปอยู่ผิดที่ |
| `script` | ชี้ไปที่ `node_modules/next/dist/bin/next` โดยตรง แทน `npm run start` เพื่อให้ PM2 ดูแล process ของ Node ตัวจริง (ส่ง signal ตอน restart/stop ถึงแอปจริง และวัด RAM ถูกตัว) |
| `args` | `start -p 3000 -H 127.0.0.1` = `next start` ที่พอร์ต 3000 ฟังเฉพาะ localhost ให้ Nginx เป็นทางเข้าเดียว |
| `exec_mode: "fork"`, `instances: 1` | รัน 1 process ธรรมดา เพียงพอสำหรับระบบภายในองค์กร |
| `autorestart`, `restart_delay` | crash แล้วเปิดใหม่อัตโนมัติ เว้น 5 วินาทีกันวนเร็วเกินไป |
| `max_memory_restart` | RAM เกิน 1 GB ให้ restart กันหน่วยความจำรั่ว |
| `time: true` | ใส่เวลาหน้าทุกบรรทัดใน log |
| `env.NODE_ENV` | ตั้ง `production` เฉพาะตอนรันแอป — ไม่ได้ตั้งทั้งเครื่อง จึงไม่ทำให้ `npm ci` ข้าม devDependencies |

ตรวจไฟล์บนเครื่อง dev:

```bash
npx eslint ecosystem.config.cjs
node -e "console.log(require('./ecosystem.config.cjs').apps[0])"
```

### 19.3 ขั้นตอนบน server (สรุปจาก `install.md` ข้อ 8)

```bash
# 1) ติดตั้ง PM2 แบบ global
sudo npm install -g pm2

# 2) เริ่มแอปในนามผู้ใช้ dsmtest (PM2 เก็บสถานะไว้ที่ /opt/dsmtest/.pm2)
sudo -u dsmtest -H bash -c 'cd /opt/dsmtest && pm2 start ecosystem.config.cjs'

# 3) ให้ PM2 เริ่มเองตอนบูต แล้วบันทึกรายการ process
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u dsmtest --hp /opt/dsmtest
sudo -u dsmtest -H pm2 save

# 4) หมุน log กันดิสก์เต็ม
sudo -u dsmtest -H pm2 install pm2-logrotate
```

- **ต้องใช้ `sudo -u dsmtest -H` ทุกครั้ง** — PM2 แยกข้อมูลตาม `$HOME` ของผู้ใช้ ถ้าสั่งด้วย root จะเห็น PM2 คนละชุด
- `pm2 startup` สร้าง systemd unit ชื่อ `pm2-dsmtest` ให้อัตโนมัติ (systemd ยังอยู่เบื้องหลัง แต่เราไม่ต้องเขียน unit เอง)
- `pm2 save` ต้องรันใหม่ทุกครั้งที่เพิ่ม/ลบแอป

ถ้า server เคยติดตั้งตาม Step 18 (systemd) มาก่อน ให้ปิดของเดิมก่อนเริ่ม PM2 (ไม่งั้นพอร์ต 3000 ชนกัน):

```bash
sudo systemctl disable --now dsmtest
sudo rm /etc/systemd/system/dsmtest.service
sudo systemctl daemon-reload
```

### 19.4 การอัปเดตเวอร์ชัน

`/opt/dsmtest/deploy.sh` เพิ่ม 2 บรรทัดท้ายสคริปต์:

```bash
pm2 reload ecosystem.config.cjs --update-env
pm2 save
```

- `reload` restart แอปด้วย build ใหม่ และ `--update-env` ให้อ่านค่า env ใหม่
- เพราะสคริปต์ใช้ `set -euo pipefail` ถ้า build ล้มจะไม่ถึงขั้น reload แอปเดิมยังทำงานต่อ

### 19.5 วิธีทดสอบ

1. `sudo -u dsmtest -H pm2 status` → แอป `dsmtest` สถานะ `online`
2. `curl -I http://127.0.0.1:3000/login` → `200 OK`
3. `sudo -u dsmtest -H pm2 describe dsmtest` → `exec cwd` ต้องเป็น `/opt/dsmtest`
4. อัปโหลดไฟล์แนบ → ไฟล์ต้องอยู่ใน `/opt/dsmtest/storage/documents/...` (ยืนยันว่า cwd ถูก)
5. `sudo reboot` แล้วตรวจ `pm2 status` อีกครั้ง → กลับมา `online` เอง

---

## Step 20: คู่มือ Deploy บน Windows Server + PM2 (`installwin.md`)

งานนี้ **ไม่แก้โค้ดของแอป** — สร้างเอกสารใหม่ `installwin.md` ที่ root ของโปรเจกต์ สำหรับนำระบบขึ้น production บน Windows Server โดยใช้ PM2 รันแอป (ใช้ `ecosystem.config.cjs` ตัวเดียวกับ Step 19 โดยไม่ต้องแก้) และใช้ IIS เป็น reverse proxy

### 20.1 ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `installwin.md` | **สร้างใหม่** — คู่มือติดตั้งบน Windows Server 16 หัวข้อ (โค้ด config/สคริปต์ทุกไฟล์อยู่ในนั้นแบบเต็ม) |
| `workshop.md` | เพิ่ม Step 20 นี้ + สารบัญ + บรรทัด `installwin.md` ในโครงสร้างไฟล์ (Step 0) |

ไฟล์ที่ `installwin.md` สั่งให้สร้าง **บน server** (ไม่อยู่ใน repo):

| ไฟล์บน server | หน้าที่ | หัวข้อ |
| --- | --- | --- |
| `C:\apps\dsmtest\.env` | ค่าลับของ production (DB, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`) | ข้อ 6 |
| `C:\inetpub\dsmtest-proxy\web.config` | กฎ reverse proxy ของ IIS → `127.0.0.1:3000`, จำกัดขนาด upload, ส่ง `X-Forwarded-*` | ข้อ 10 |
| `C:\apps\scripts\deploy-dsmtest.ps1` | สคริปต์อัปเดตเวอร์ชัน | ข้อ 14 |
| `C:\apps\scripts\backup-dsmtest.ps1` | สำรอง DB + storage + config รายวัน | ข้อ 15 |

### 20.2 สิ่งที่ต่างจาก Ubuntu (`install.md`) และเหตุผล

| เรื่อง | Ubuntu | Windows Server | เหตุผล |
| --- | --- | --- | --- |
| ให้ PM2 เริ่มเองตอนบูต | `pm2 startup` + `pm2 save` | **pm2-installer** สร้าง Windows Service `PM2` (บัญชี Local Service) + `pm2 save` | `pm2 startup` ไม่รองรับ Windows; ถ้ารัน PM2 เฉย ๆ จะผูกกับ session ของผู้ที่ login — logoff/reboot แอปหยุด |
| บัญชีที่รันแอป | ผู้ใช้ `dsmtest` (`sudo -u dsmtest -H pm2 ...`) | `NT AUTHORITY\LOCAL SERVICE` (ผ่าน service `PM2`) — สั่ง `pm2` จาก PowerShell แบบ Admin | pm2-installer ตั้ง `PM2_HOME=C:\ProgramData\pm2\home` ระดับเครื่อง ทุก Admin คุย daemon ตัวเดียวกัน |
| สิทธิ์ไฟล์ | `chown` / `chmod 600 .env` | `icacls` ให้ Local Service อ่านทั้งโฟลเดอร์ + แก้ไข `storage\` และ `.next\`; ล็อก `.env` | แอปต้องเขียนไฟล์อัปโหลดและ cache ของ Next.js |
| Reverse proxy | Nginx | IIS + URL Rewrite + ARR | IIS เป็นของมาตรฐานบน Windows Server |
| streaming | `proxy_buffering off` | ARR `responseBufferLimit:0` | คำแนะนำ self-hosting ของ Next.js — proxy ต้องไม่ buffer |
| จำกัดขนาด upload | `client_max_body_size` | `maxAllowedContentLength` (หน่วย byte) | ต้อง ≥ `MAX_UPLOAD_SIZE_MB` |
| URL ที่ส่งต่อ | ส่งตรง | `{UNENCODED_URL}` + `allowDoubleEscaping` | กัน IIS decode URL ก่อนส่ง (path ที่มี `%xx` / ภาษาไทยจะเพี้ยน) |
| อัปเดตเวอร์ชัน | build ขณะแอปยังรัน แล้ว `pm2 reload` | `pm2 stop` ก่อน `npm ci`/build แล้ว `pm2 reload` | Windows ล็อกไฟล์ที่ process เปิดอยู่ → `EPERM` |
| สคริปต์ | bash `set -euo pipefail` | PowerShell + ฟังก์ชัน `Invoke-Step` ตรวจ `$LASTEXITCODE` | PowerShell 5.1 ไม่หยุดเองเมื่อคำสั่งภายนอก (git/npm) ล้ม |
| SQL Server | ติดตั้งผ่าน apt | ต้องเปิด **Mixed Mode**, **TCP/IP** และ **พอร์ตคงที่ 1433** | driver ของ Prisma ใช้ SQL Authentication; Express ปิด TCP/IP และใช้ dynamic port โดย default |
| เตรียมเครื่อง | — | เปิด `LongPathsEnabled`, `git core.longpaths`, Defender exclusion ของ `node_modules` / `.next` | `node_modules` มี path เกิน 260 ตัวอักษร; Defender ทำให้ช้าและล็อกไฟล์ |

### 20.3 ลำดับขั้นตอนใน `installwin.md`

1. สิ่งที่ต้องเตรียม (Node 22 LTS ด้วยเหตุผลเดียวกับ Step 18)
2. ตั้ง timezone, long path, Defender exclusion
3. ติดตั้ง Node.js (.msi) และ Git for Windows
4. SQL Server: Mixed Mode / TCP/IP / พอร์ต 1433 + สร้าง login `dsmtest_app`
5. `git clone` ไป `C:\apps\dsmtest` + สร้าง `storage\documents`, `storage\avatars` (หรือ junction ไป drive อื่น)
6. `.env` (สุ่ม `AUTH_SECRET` ด้วย `crypto.randomBytes` ของ Node)
7. `npm ci` → `npx prisma generate` → `npm run db:migrate:deploy` → `npm run db:seed` → `npm run build`
8. pm2-installer (`npm run configure`, `configure-policy`, `setup`) + `icacls`
9. `pm2 start ecosystem.config.cjs` → `pm2 save`
10. IIS: ติดตั้ง, เปิด proxy ของ ARR, อนุญาต server variables, สร้าง site ชี้ไป `C:\inetpub\dsmtest-proxy` (แยกจากโฟลเดอร์แอป เพื่อไม่ให้ IIS เสิร์ฟ `.env`/ซอร์สโค้ด)
11. HTTPS (win-acme หรือ `.pfx` ของ CA ภายใน) แล้วเปิด rule redirect + เปลี่ยน `X-Forwarded-Proto` เป็น `https`
12. Windows Firewall เปิดแค่ 80/443
13. Checklist ทดสอบ รวมถึง reboot โดยไม่ login เพื่อยืนยันว่า PM2 รันเป็น service
14. สคริปต์ deploy, 15. สคริปต์ backup + Task Scheduler, 16. ตารางแก้ปัญหา

### 20.4 คำสั่งที่ต้องรัน

บนเครื่อง dev ไม่มีคำสั่งที่ต้องรัน (งานเอกสารเท่านั้น) — คำสั่งทั้งหมดสำหรับ server อยู่ใน `installwin.md`
