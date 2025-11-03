-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rollno" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "canLogin" BOOLEAN NOT NULL DEFAULT true,
    "mID" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rollNumber" TEXT,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "projectPillar" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusMessage" TEXT,
    "mentorId" TEXT,
    "leadId" TEXT,
    "teamNumber" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment" TEXT,
    "ppt_attachment" TEXT,
    "poster_attachment" TEXT,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "remark_updated_at" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "teamCode" TEXT,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poster" TEXT,
    "link" TEXT,
    "video" TEXT,
    "description" TEXT,
    "meta" TEXT,
    "themeId" INTEGER,
    "code" TEXT NOT NULL,
    "gallery" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "presentation" TEXT,
    "report" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamEvaluation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "posterMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "videoMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reportMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pptMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "groupScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalEvaluatorName" TEXT,
    "externalEvaluatorEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TeamEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndividualEvaluation" (
    "id" TEXT NOT NULL,
    "teamEvaluationId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "memberEmail" TEXT NOT NULL,
    "learningContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "presentationSkill" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionToProject" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "individualScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalEvaluatorMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIndividualMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "IndividualEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_rollno_key" ON "User"("rollno");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leadId_key" ON "Team"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamNumber_key" ON "Team"("teamNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TeamEvaluation_teamId_key" ON "TeamEvaluation"("teamId");

-- CreateIndex
CREATE INDEX "TeamEvaluation_teamId_idx" ON "TeamEvaluation"("teamId");

-- CreateIndex
CREATE INDEX "TeamEvaluation_mentorId_idx" ON "TeamEvaluation"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualEvaluation_teamMemberId_key" ON "IndividualEvaluation"("teamMemberId");

-- CreateIndex
CREATE INDEX "IndividualEvaluation_teamEvaluationId_idx" ON "IndividualEvaluation"("teamEvaluationId");

-- CreateIndex
CREATE INDEX "IndividualEvaluation_memberId_idx" ON "IndividualEvaluation"("memberId");

-- CreateIndex
CREATE INDEX "IndividualEvaluation_teamMemberId_idx" ON "IndividualEvaluation"("teamMemberId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_teamCode_fkey" FOREIGN KEY ("teamCode") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_code_fkey" FOREIGN KEY ("code") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEvaluation" ADD CONSTRAINT "TeamEvaluation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEvaluation" ADD CONSTRAINT "TeamEvaluation_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualEvaluation" ADD CONSTRAINT "IndividualEvaluation_teamEvaluationId_fkey" FOREIGN KEY ("teamEvaluationId") REFERENCES "TeamEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualEvaluation" ADD CONSTRAINT "IndividualEvaluation_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
