-- Um pedido de aprovação aberto por produção, garantido pelo banco (HARDEN-008).
CREATE UNIQUE INDEX "Approval_videoProjectId_pending_key" ON "Approval"("videoProjectId") WHERE (status = 'PENDING');
