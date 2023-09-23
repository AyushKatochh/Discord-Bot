
-- CreateTable
CREATE TABLE "recordedaudio" (
    "id" SERIAL NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "mp3file" VARCHAR(255),
    "wavfile" VARCHAR(255),

    CONSTRAINT "recordedaudio_pkey" PRIMARY KEY ("id")
);

