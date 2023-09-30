-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "author" TEXT NOT NULL,
    "channel_Id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reminder_Time" TIMESTAMP(3) NOT NULL,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
