-- Idioma preferido do usuário (ADR-041). Nulo segue o Accept-Language.
ALTER TABLE "User" ADD COLUMN "locale" TEXT;
