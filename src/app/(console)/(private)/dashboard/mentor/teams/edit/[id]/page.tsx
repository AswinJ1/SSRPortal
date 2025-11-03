import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import UpdateTeamForm from '../../updateteamform';
import { ProjectPillar, TeamStatus } from '../../updateteamform';

export default async function EditTeamPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      mentorId: session.user.id
    },
    include: {
      members: true
    }
  });

  if (!team) redirect('/dashboard/mentor/teams');

  return (
    <UpdateTeamForm
      id={team.id}
      currentStatus={team.status as TeamStatus}
      currentProjectTitle={team.projectTitle}
      currentProjectPillar={team.projectPillar as ProjectPillar}
      currentTeamNumber={team.teamNumber}
      currentMembers={team.members}
    />
  );
}