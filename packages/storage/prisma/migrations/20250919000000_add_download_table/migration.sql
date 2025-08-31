-- CreateTable
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);
