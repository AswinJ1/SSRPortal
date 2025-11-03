import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import EvaluateForm from '../../evaluateform';

export default async function EvaluateTeamPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Verify user is a mentor
  const mentor = await prisma.user.findUnique({
    where: { 
      id: session.user.id,
      role: 'MENTOR'
    }
  });

  if (!mentor) {
    redirect('/dashboard/mentor/teams');
  }

  // Verify team exists and mentor is assigned to it
  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      mentorId: mentor.id
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              rollno: true
            }
          }
        }
      },
      project: true,
      evaluation: {
        include: {
          individualEvaluations: {
            include: {
              teamMember: true
            }
          }
        }
      }
    }
  });

  if (!team) {
    redirect('/dashboard/mentor/teams');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Evaluate Team {team.teamNumber}</h1>
        <p className="text-gray-600 mt-2">{team.projectTitle}</p>
        <p className="text-sm text-gray-500">Batch: {team.batch}</p>
      </div>
      
      <EvaluateForm teamId={team.id} />
    </div>
  );
}