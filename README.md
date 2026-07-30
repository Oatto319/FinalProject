# Team Matching App (projectmbit)

แอปพลิเคชันจับกลุ่มทีม (Team Matching App) สำหรับใช้ในสถานศึกษา ช่วยให้อาจารย์ (Host) สร้างห้องและจับกลุ่มนักเรียน (User) โดยอิงจากการวิเคราะห์ MBTI จากชุดคำถามในแต่ละ template ระบบจะจัดกลุ่มให้สมาชิกมีจุดเด่นหลากหลายและไม่ซ้ำกัน

สร้างด้วย [Next.js](https://nextjs.org) (App Router) + MongoDB

---

## ฟีเจอร์หลัก

- ระบบสมัครสมาชิก / login พร้อมตั้งชื่อและอวาตาร์
- สร้างห้อง (Create) กำหนดชื่อ, คำอธิบาย, จำนวนคนทั้งหมด, จำนวนคนต่อกลุ่ม, deadline
- เข้าร่วมห้องด้วย Room ID 6 หลัก (Join)
- ห้องรอสมาชิกพร้อมสถานะ Ready แบบ real-time (polling)
- ตั้งค่าห้องภายหลังได้ (ชื่อ/คำอธิบาย/จำนวนคน/deadline/โหมดจับกลุ่ม) จากปุ่มตั้งค่าในหน้าห้อง
- จับกลุ่ม 2 โหมด:
  - **Auto** — วิเคราะห์ MBTI ของสมาชิกแล้วจัดกลุ่มให้สมดุลอัตโนมัติ
  - **Manual (Selection)** — ผู้สร้างห้องกำหนดองค์ประกอบ MBTI ของแต่ละกลุ่มเอง
- แบบทดสอบ MBTI แยกตาม template (Programming, Design, Service, Presentation)
- เลือกหัวหน้าทีมได้ 2 แบบ: Vote (โหวต) หรือ Analyze (วิเคราะห์อัตโนมัติ)
- มินิแชทในกลุ่ม
- ระบบประเมินเพื่อนร่วมทีมหลังจบกิจกรรม
- Session recovery — กลับมาดูห้อง/ทีมที่เคยเข้าได้ผ่านหน้า "Team"

รายละเอียด flow การใช้งานแบบเต็มดูได้ที่ [`claude.md`](./claude.md)

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| ภาษา | TypeScript |
| UI | React 19, Tailwind CSS 4, lucide-react |
| Database | MongoDB (mongoose) |
| Auth | Session cookie + hashed token (bcryptjs) |

---

## เริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
```

### 3. รันโปรเจกต์ (Development)

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### 4. Build สำหรับ Production

```bash
npm run build
npm run start
```

---

## Scripts

| คำสั่ง | หน้าที่ |
|--------|---------|
| `npm run dev` | รันโหมด development |
| `npm run build` | build production |
| `npm run start` | รันแอปที่ build แล้ว |
| `npm run lint` | ตรวจสอบโค้ดด้วย ESLint |

---

## โครงสร้างโปรเจกต์ (ย่อ)

```
app/
├── api/                     # API routes (Next.js Route Handlers)
│   ├── rooms/
│   │   ├── route.ts             # POST สร้างห้อง
│   │   └── [roomId]/
│   │       ├── route.ts         # GET / PATCH (settings, match, kick ฯลฯ) / DELETE
│   │       ├── join/route.ts
│   │       ├── ready/route.ts
│   │       ├── messages/route.ts
│   │       ├── member-types/route.ts
│   │       └── member-eval-scores/route.ts
│   ├── users/route.ts
│   ├── myrooms/route.ts
│   ├── notifications/route.ts
│   ├── evaluations/rooms/route.ts
│   └── logout/route.ts
├── create/                  # flow สร้างห้อง (host)
│   ├── createroom/              # ฟอร์มตั้งค่าห้องตอนสร้าง
│   ├── typeselection/           # เลือกโหมด auto/manual
│   ├── typesetting/, select_templates/
│   ├── match/                   # ห้องรอ (โหมด auto) + ปุ่มตั้งค่าห้อง
│   ├── manual/                  # ห้องรอ (โหมด manual) + ตั้งค่าห้อง + ตั้งค่าองค์ประกอบ MBTI
│   ├── wait/, group/, matching/
├── join/                     # flow เข้าร่วมห้อง (นักเรียน)
│   ├── roomid/, check/, myroom/, myteam/, analyze/, vote/, myprojects/
├── question/                 # แบบทดสอบ MBTI แยกตาม template
├── mytype/                   # ผลลัพธ์ MBTI ของผู้ใช้
├── evaluation/                # ประเมินเพื่อนร่วมทีม
├── login/                     # login, register, welcome, profile
├── navbar/, components/       # UI ที่ใช้ร่วมกัน
└── templates/, settings/

lib/                          # models, auth, mongodb, date utils ฯลฯ
public/img/                   # asset รูปภาพ
```

---

## หมายเหตุด้าน Auth

- Session ผูกกับ cookie (`SESSION_COOKIE`) และ token ที่ hash ด้วย SHA-256 เก็บใน MongoDB (`User.sessionToken`)
- ทุก API route ที่แก้ไขข้อมูลห้องจะตรวจสอบสิทธิ์ host ผ่าน `isRoomHost()` ฝั่ง server เสมอ (ไม่เชื่อค่าที่ client ส่งมา)

---

## Changelog (ล่าสุด)

- ➕ เพิ่มปุ่ม **ตั้งค่าห้อง** ในหน้า `create/match` และ `create/manual` ให้ host แก้ไขชื่อ, คำอธิบาย, จำนวนคนทั้งหมด, จำนวนคนต่อกลุ่ม, วันเวลา deadline และสลับโหมดจับกลุ่ม (Auto ↔ Manual) ได้หลังสร้างห้องแล้ว
- 🔧 ปรับ API `PATCH /api/rooms/[roomId]` (action `settings`) ให้รองรับการแก้ไข `totalMembers`, `groupSize` และรับ deadline เป็นวันที่+เวลา พร้อม validation ครบถ้วน (ห้ามแก้หลังจับกลุ่มไปแล้ว, จำนวนต่อกลุ่มต้องไม่เกินจำนวนทั้งหมด, จำนวนทั้งหมดต้องไม่น้อยกว่าคนที่เข้าร่วมแล้ว)
