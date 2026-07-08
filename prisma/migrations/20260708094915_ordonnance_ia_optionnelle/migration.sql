-- AlterTable
ALTER TABLE "ordonnance" ADD COLUMN     "consultationIAId" TEXT,
ADD COLUMN     "genereParIA" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "medecinId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ordonnance_genereParIA_idx" ON "ordonnance"("genereParIA");

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_consultationIAId_fkey" FOREIGN KEY ("consultationIAId") REFERENCES "consultation_ia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
