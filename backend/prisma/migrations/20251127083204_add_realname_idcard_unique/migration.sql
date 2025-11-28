/*
  Warnings:

  - A unique constraint covering the columns `[realName,idCard]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_realName_idCard_key" ON "User"("realName", "idCard");
