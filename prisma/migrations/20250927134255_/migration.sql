-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "locked" "public"."YesNo" NOT NULL DEFAULT 'nao';
