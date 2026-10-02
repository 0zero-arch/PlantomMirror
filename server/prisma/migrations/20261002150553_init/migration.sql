-- CreateEnum
CREATE TYPE "photo_type" AS ENUM ('SELFIE', 'OTHER');

-- CreateEnum
CREATE TYPE "photo_status" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'UNISEX');

-- CreateEnum
CREATE TYPE "ai_task_type" AS ENUM ('ANALYSIS', 'SIMULATION');

-- CreateEnum
CREATE TYPE "ai_task_status" AS ENUM ('CREATED', 'QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "feedback_reason" AS ENUM ('UNNATURAL', 'WRONG_HAIRSTYLE', 'NOT_LIKE_FACE', 'TOO_SLOW', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "type" "photo_type" NOT NULL DEFAULT 'SELFIE',
    "status" "photo_status" NOT NULL DEFAULT 'PENDING',
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appearance_profiles" (
    "id" UUID NOT NULL,
    "photo_id" UUID NOT NULL,
    "face_shape" TEXT,
    "hair_type" TEXT,
    "hair_length" TEXT,
    "hair_density" TEXT,
    "hair_frizziness" TEXT,
    "raw" JSONB,
    "provider" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appearance_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hairstyles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "gender" "gender" NOT NULL DEFAULT 'UNISEX',
    "length" TEXT,
    "texture" TEXT,
    "provider_style_id" TEXT,
    "reference_image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hairstyles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tasks" (
    "id" UUID NOT NULL,
    "type" "ai_task_type" NOT NULL,
    "status" "ai_task_status" NOT NULL DEFAULT 'CREATED',
    "provider" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "result" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(3),
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "ai_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "photo_id" UUID NOT NULL,
    "appearance_profile_id" UUID,
    "hairstyle_id" UUID NOT NULL,
    "ai_task_id" UUID NOT NULL,
    "output_storage_key" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "simulation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER,
    "reason" "feedback_reason",
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usages" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "task_type" "ai_task_type" NOT NULL,
    "input_size" INTEGER,
    "output_size" INTEGER,
    "latency_ms" INTEGER,
    "estimated_cost" DECIMAL(12,6),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_anonymous_id_key" ON "users"("anonymous_id");

-- CreateIndex
CREATE UNIQUE INDEX "photos_storage_key_key" ON "photos"("storage_key");

-- CreateIndex
CREATE INDEX "photos_user_id_created_at_idx" ON "photos"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "appearance_profiles_photo_id_key" ON "appearance_profiles"("photo_id");

-- CreateIndex
CREATE UNIQUE INDEX "hairstyles_code_key" ON "hairstyles"("code");

-- CreateIndex
CREATE INDEX "hairstyles_active_sort_order_idx" ON "hairstyles"("active", "sort_order");

-- CreateIndex
CREATE INDEX "ai_tasks_status_created_at_idx" ON "ai_tasks"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "simulations_ai_task_id_key" ON "simulations"("ai_task_id");

-- CreateIndex
CREATE INDEX "simulations_user_id_created_at_idx" ON "simulations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "feedbacks_simulation_id_idx" ON "feedbacks"("simulation_id");

-- CreateIndex
CREATE INDEX "ai_usages_provider_created_at_idx" ON "ai_usages"("provider", "created_at");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appearance_profiles" ADD CONSTRAINT "appearance_profiles_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_appearance_profile_id_fkey" FOREIGN KEY ("appearance_profile_id") REFERENCES "appearance_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_hairstyle_id_fkey" FOREIGN KEY ("hairstyle_id") REFERENCES "hairstyles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_ai_task_id_fkey" FOREIGN KEY ("ai_task_id") REFERENCES "ai_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
