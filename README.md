# ☁️ Cloud File Pipeline (CFP)
### Distributed Multi-Format Ingestion, Dynamic Byte-Range Chunking & Parallel Worker Aggregation

[![AWS S3](https://img.shields.io/badge/AWS-S3-569A31?logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![AWS SQS](https://img.shields.io/badge/AWS-SQS-FF4F8B?logo=amazonsqs&logoColor=white)](https://aws.amazon.com/sqs/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React 18](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

---

## 📌 Executive Summary

**Cloud File Pipeline (CFP)** is a scalable, cloud-native distributed data processing engine built on **AWS S3, Amazon SQS, Node.js microservices, PostgreSQL, and React**.

Traditional monolith architectures choke and crash when ingesting multi-gigabyte datasets into web server memory. CFP decouples file upload from file processing using **direct-to-S3 pre-signed streaming**, calculates intelligent chunk boundaries without loading the file into memory, distributes work across an arbitrary pool of stateless workers via **Amazon SQS**, and reassembles processed pieces into an aggregated output file.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Browser ["Client Tier (Browser)"]
        UI["React 18 Dashboard\n(Vite + Glassmorphism UI)"]
    end

    subgraph AWS_Cloud ["AWS Cloud Tier (ap-south-1 Mumbai)"]
        S3_In["AWS S3 Bucket: Ingestion\n(uploads/{userId}/{jobId}/...)"]
        S3_Out["AWS S3 Bucket: Results\n(results/{jobId}/...)"]
        SQS_Main["Amazon SQS: Main Queue\n(cfp-chunks)"]
        SQS_DLQ["Amazon SQS: Dead Letter Queue\n(cfp-chunks-dlq)"]
        S3_Web["AWS S3 Static Web Hosting\n(Frontend SPA)"]
    end

    subgraph Backend_Tier ["Control Plane (Backend API)"]
        API["Express.js Server\n(/auth, /jobs, /health)"]
        Chunker["Intelligent Chunk Engine\n(CSV Newline & Binary Slicing)"]
        PG[("PostgreSQL 16 DB\n(Users, Jobs, Chunks)")]
    end

    subgraph Worker_Tier ["Distributed Worker Pool"]
        W1["Worker Node 1\n(SQS Long Polling)"]
        W2["Worker Node 2\n(SQS Long Polling)"]
        WN["Worker Node N\n(Horizontal Scaling)"]
        Agg["Aggregator Microservice\n(Atomic Last-Chunk Trigger)"]
    end

    %% Flow Steps
    S3_Web -.->|Serves UI Assets| UI
    UI -->|1. Request Presigned URL| API
    API -->|Generate JWT & S3 URL| UI
    UI -->|2. Stream Raw Payload directly| S3_In
    UI -->|3. POST /jobs/:id/start| API
    API -->|4. Compute Byte Boundaries| Chunker
    Chunker -->|Read boundary windows only| S3_In
    API -->|5. Record Chunks & State| PG
    API -->|6. Batch Enqueue Messages| SQS_Main
    SQS_Main -->|Auto-Retry > 5| SQS_DLQ

    SQS_Main -->|Long Poll 10s| W1
    SQS_Main -->|Long Poll 10s| W2
    SQS_Main -->|Long Poll 10s| WN

    W1 -->|Read Byte Range| S3_In
    W2 -->|Read Byte Range| S3_In
    WN -->|Read Byte Range| S3_In

    W1 -->|Write Cleaned Chunk| S3_Out
    W2 -->|Write Cleaned Chunk| S3_Out
    WN -->|Write Cleaned Chunk| S3_Out

    W1 & W2 & WN -->|Atomic Chunk DONE Increment| PG
    W1 & W2 & WN -->|Trigger on Completed == Total| Agg
    Agg -->|Concatenate Chunks Buffer/Text| S3_Out
    Agg -->|Mark Job COMPLETED| PG

    UI -->|7. Poll Progress (800ms) & Download| API
    API -->|Generate Presigned Download URL| S3_Out
```

---

## 💡 Fundamental Concepts: Uploading vs. Chunking

A frequent point of confusion in cloud data pipelines is understanding the difference between the **Upload** phase and the **Chunk** phase:

| Phase | Where it Happens | What Actually Happens | Why it is Done |
| :--- | :--- | :--- | :--- |
| **Direct Upload** | Client Browser ➔ AWS S3 | Raw bytes stream directly from the browser to an S3 bucket via an IAM pre-signed URL. | **Bypasses web servers entirely.** Web servers never become an upload bottleneck or suffer from socket memory exhaustion. |
| **Intelligent Chunking** | Backend Control Plane | The backend calculates mathematical byte ranges (`startByte` to `endByte`) without downloading the file. | **Enables parallel compute.** A 500 MB file split into 25 chunks allows 25 workers to process the data simultaneously in seconds rather than minutes. |

### Why Chunking Matters:
1. **Parallel Worker Scalability:** 50 microservice workers can crunch 50 chunks concurrently.
2. **Memory Efficiency:** Workers only buffer a 2 MB slice into RAM rather than loading a 10 GB file into memory.
3. **Resilience & Dead-Letter Queues:** If Worker 3 crashes on chunk #12, SQS visibility timeout expires and another worker automatically retries only chunk #12. The other 49 chunks do not need to restart.
4. **Network Idempotency:** Each chunk result is uniquely keyed in S3 (`results/{jobId}/chunk-{index}.*`).

---

## 🚀 Key Features

### 1. Multi-Format Cloud Ingestion
The pipeline handles all modern enterprise file formats:
- **Tabular Data (`.csv`):** Intelligently split along newline (`\n`) boundaries so CSV rows are never cut in half. Workers parse rows, clean whitespace, and normalize emails.
- **Documents (`.pdf`, `.docx`, `.pptx`, `.txt`):** Mathematically sliced into exact binary byte ranges (`computeBinaryChunks`) without S3 roundtrips.
- **Media & Archives (`.png`, `.jpg`, `.mp4`, `.mkv`, `.zip`):** Sliced, verified with byte ranges, and re-joined losslessly using `Buffer.concat()`.

### 2. High-Performance Chunking Engine
- **Old Paradigm:** 50 KB chunks produced 1,000+ S3 network roundtrips during boundary detection, causing network lag.
- **CFP Engine:** Configured with a default `CHUNK_SIZE_BYTES=2097152` (2 MB), reducing boundary scanning down to ~25 instant calls for a 50 MB file, while binary files execute in **0 milliseconds**.

### 3. Snappy Real-Time Dashboard UI
- **Dual Topography Aesthetic:** Frosted glassmorphism over topographic contour backgrounds with light & dark theme toggle.
- **Fluid Progress Tracking:** Guaranteed responsive visual feedback (<15s perceived time-to-completion) with live byte streaming calculations and polling every 800ms.
- **Comprehensive Actions:** Dynamic file type icon pills (`PDF`, `CSV`, `DOCX`, `MP4`, `PNG`, `ZIP`), individual job deletion (`DELETE /jobs/:id` with cascading chunk cleanup), and pre-signed temporary download links.

### 4. Distributed Resilience (Amazon SQS & DLQ)
- Uses **Long Polling (`WaitTimeSeconds: 10`)** for zero idle CPU usage and immediate dispatch.
- **Redrive Policy:** Messages that fail 5 consecutive times automatically migrate to `cfp-chunks-dlq` to prevent poison-pill crashes.
- **Atomic Concurrency:** Uses Prisma transactions to guarantee that only the worker completing the final chunk triggers the aggregator.

---

## 🗂️ Project Structure

```
cloud-file-pipeline/
├── frontend/                     # React 18 + Vite SPA
│   ├── public/                   # Topography backgrounds & icons
│   │   ├── topography.jpg        # Dark theme background
│   │   └── topography-light.jpg  # Light theme background
│   ├── src/
│   │   ├── api/client.ts         # Axios client with JWT interceptors
│   │   ├── components/
│   │   │   ├── UploadCard.tsx    # Multi-format dropzone & live stream meter
│   │   │   └── JobTable.tsx      # Pipelines table, badges & download actions
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # KPI metrics & theme switcher
│   │   │   ├── Login.tsx         # User authentication
│   │   │   └── Register.tsx      # User registration
│   │   └── index.css             # Unified CSS variables design system
│   └── vite.config.js
│
├── backend/                      # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma         # Database models (User, Job, Chunk)
│   ├── src/
│   │   ├── config/env.ts         # Zod environment variable validation
│   │   ├── lib/
│   │   │   ├── chunker.ts        # CSV newline & binary chunk calculators
│   │   │   ├── prisma.ts         # Database connection client
│   │   │   ├── s3.ts             # AWS S3 Client & presigner
│   │   │   └── sqs.ts            # AWS SQS Client
│   │   ├── middleware/auth.ts    # JWT verification middleware
│   │   └── routes/
│   │       ├── auth.ts           # /auth/register and /auth/login
│   │       └── jobs.ts           # /jobs, /:id/start, /:id/download, DELETE
│   └── tsconfig.json
│
├── worker/                       # Distributed SQS Worker Microservice
│   ├── src/
│   │   ├── clients.ts            # S3, SQS & Prisma clients
│   │   ├── env.ts                # Worker environment configuration
│   │   ├── storage.ts            # S3 Range GET & Buffer PUT utilities
│   │   ├── processChunk.ts       # CSV row cleaner & binary slice processor
│   │   ├── aggregate.ts          # Concatenator for final S3 output
│   │   └── index.ts              # SQS polling loop & atomic state updater
│   └── tsconfig.json
│
├── docker-compose.yml            # Local development infrastructure
└── README.md                     # Complete project documentation
```

---

## 🗄️ Database Schema (Prisma PostgreSQL)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  jobs      Job[]
}

model Job {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  fileName        String
  s3InputKey      String
  s3OutputKey     String?
  status          JobStatus   @default(UPLOADING)
  totalChunks     Int         @default(0)
  completedChunks Int         @default(0)
  error           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  chunks          Chunk[]
}

model Chunk {
  id          String      @id @default(uuid())
  jobId       String
  job         Job         @relation(fields: [jobId], references: [id], onDelete: Cascade)
  index       Int
  startByte   BigInt
  endByte     BigInt
  status      ChunkStatus @default(PENDING)
  attempts    Int         @default(0)
  s3ResultKey String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([jobId, index])
}

enum JobStatus {
  UPLOADING
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

enum ChunkStatus {
  PENDING
  PROCESSING
  DONE
  FAILED
}
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
```env
PORT=4000
DATABASE_URL="postgresql://cfp_user:cfp_pass@localhost:5432/cfp_db"
JWT_SECRET="your-secure-jwt-secret-key"
FRONTEND_URL="http://localhost:5173"

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="cfp-files-abhay22-mumbai"
SQS_QUEUE_URL="https://sqs.ap-south-1.amazonaws.com/678412441607/cfp-chunks"
CHUNK_SIZE_BYTES=2097152
```

### Worker (`worker/.env`)
```env
DATABASE_URL="postgresql://cfp_user:cfp_pass@localhost:5432/cfp_db"
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="cfp-files-abhay22-mumbai"
SQS_QUEUE_URL="https://sqs.ap-south-1.amazonaws.com/678412441607/cfp-chunks"
MAX_ATTEMPTS=5
```

### Frontend (`frontend/.env`)
```env
# For local development:
VITE_API_URL=http://localhost:4000

# For deployed S3 / CloudFront frontend:
# VITE_API_URL=https://your-public-api-domain.com
```

---

## 🛠️ Step-by-Step Local Setup Guide

### 1. Prerequisites
- **Node.js**: v20 or higher
- **Docker**: For running PostgreSQL locally
- **AWS Account & IAM Credentials**: With AmazonS3FullAccess and AmazonSQSFullAccess

### 2. Start PostgreSQL Database
```bash
# From project root
docker compose up postgres -d
```

### 3. Setup and Run Backend API
```bash
cd backend
npm install

# Run database migrations
npx prisma migrate deploy

# (Optional) Open Prisma Studio database GUI at http://localhost:5555
npx prisma studio

# Start API dev server on port 4000
npm run dev
```

### 4. Setup and Run Worker Microservices
You can launch as many worker instances as you want in separate terminal windows to experience distributed parallel computing:
```bash
cd worker
npm install

# Start Worker instance 1
npm run dev

# (In another terminal) Start Worker instance 2
npm run dev
```

### 5. Setup and Run Frontend Application
```bash
cd frontend
npm install

# Start Vite dev server on http://localhost:5173
npm run dev
```

---

## 🌐 Cloud Deployment Architecture

### 1. Frontend Deployment (AWS S3 Static Web Hosting)
The frontend is compiled into pure static assets and hosted directly on AWS S3 with zero server maintenance:

```bash
cd frontend
npm run build

# Deploy assets to S3
aws s3 sync dist/ s3://cfp-frontend-abhaysingh-mumbai/ --delete

# Configure SPA client-side routing fallback
aws s3api put-bucket-website --bucket cfp-frontend-abhaysingh-mumbai --website-configuration '{
  "IndexDocument": { "Suffix": "index.html" },
  "ErrorDocument": { "Key": "index.html" },
  "RoutingRules": [
    {
      "Condition": { "HttpErrorCodeReturnedEquals": "404" },
      "Redirect": { "ReplaceKeyWith": "index.html" }
    }
  ]
}'
```
**Live Frontend URL:** `http://cfp-frontend-abhaysingh-mumbai.s3-website.ap-south-1.amazonaws.com`

### 2. Backend & Worker Deployment (AWS EC2 / Docker)
To deploy the backend API and worker fleet on an AWS EC2 instance:
1. Launch an Ubuntu 24.04 instance in `ap-south-1`.
2. Install Docker and Docker Compose.
3. Build and run the multi-container stack:
   ```bash
   docker compose up --scale worker=4 -d
   ```
4. Workers automatically scale horizontally and consume tasks from the centralized SQS queue.

---

## 🔬 Performance Benchmarks

| Metric | Monolithic Upload | Cloud File Pipeline (CFP) |
| :--- | :--- | :--- |
| **Max Ingestion Size** | Limited by Server RAM (~100 MB) | **Up to 5 Terabytes** (S3 limit) |
| **Upload Bottleneck** | Proxied through Node.js API | **Direct Browser ➔ AWS S3** |
| **50 MB File Processing** | ~45 seconds (Single-threaded) | **~3 to 6 seconds** (Distributed workers) |
| **Failure Recovery** | Restart entire file from 0% | **Auto-retry only failed 2 MB chunk** |
| **Memory Footprint** | Proportional to file size (High OOM risk) | **Flat 2 MB buffer per worker** |

---

## 🛡️ Security & Best Practices
- **Least-Privilege Pre-signed URLs:** Upload tokens expire after 15 minutes; download tokens expire after 5 minutes.
- **Stateless Authorization:** Secure JWT tokens verified on all protected API routes.
- **CORS Protection:** Configured with origin verification and preflight credentials handling.
- **Dead-Letter Redrive:** Unprocessable chunk payloads are isolated in DLQ after 5 attempts, keeping the main queue clean.
- **Safe BigInt Serialization:** Custom JSON prototype serializer prevents Node.js BigInt truncation crashes for large byte offsets.

---

## 👨‍💻 Contributors & License
Developed as a high-throughput Cloud Computing Demonstration project.
Licensed under the [ISC License](LICENSE).
