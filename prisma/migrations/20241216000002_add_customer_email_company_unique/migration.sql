-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_email_key" ON "Customer"("companyId", "email");