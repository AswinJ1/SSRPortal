// import { NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
// import prisma from '@/lib/db/prisma';

// export async function GET() {
//   try {
//     const session = await auth();
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Get all teams where the user is a mentor
//     const teams = await prisma.team.findMany({
//       where: {
//         mentorId: session.user.id
//       },
//       include: {
//         members: {
//           include: {
//             user: true
//           }
//         },
//         lead: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         },
//         project: {
//           include: {
//             theme: true
//           }
//         },
//         proposals: true
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     // Transform the data correctly
//     const transformedTeams = teams.map(team => ({
//       id: team.id,
//       teamNumber: team.teamNumber, // Use teamNumber directly
//       code: team.id,
//       projectTitle: team.projectTitle,
//       status: team.status,
//       stats: {
//         members: team.members.length,
//         proposals: team.proposals.length,
//         status: team.status
//       },
//       members: team.members.map(member => ({
//         name: `${member.user.firstName} ${member.user.lastName}`,
//         email: member.user.email,
//         role: member.role
//       })),
//       lead: team.lead ? {
//         name: `${team.lead.firstName} ${team.lead.lastName}`,
//         email: team.lead.email
//       } : null,
//       project: team.project ? {
//         id: team.project.id,
//         title: team.project.name,
//         description: team.project.description,
//         theme: team.project.theme?.name
//       } : null
//     }));

//     console.log('Transformed teams:', transformedTeams); // Debug log
//     return NextResponse.json(transformedTeams);
//   } catch (error) {
//     console.error('Error fetching mentor teams:', error);
//     return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: {
        mentor: {
          email: session.user.email
        }
      },
      include: {
        mentor: true,
        members: {
          include: {
            user: true
          }
        },
        proposals: {
          include: {
            author: true
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        project: {
          include: {
            theme: true
          }
        }
      }
    });

    const formattedTeams = teams.map(team => ({
      id: team.id,
      teamNumber: team.teamNumber,
      code: team.id,
      projectTitle: team.projectTitle || '',
      projectPillar: team.projectPillar || '',
      batch: team.batch,
      status: team.status,
      mentor: {
        id: team.mentor.id,
        uid: team.mentor.id,
        email: team.mentor.email,
        name: `${team.mentor.firstName} ${team.mentor.lastName}`,
        avatarURL: null,
        avatarID: null
      },
      members: team.members.map(member => ({
        id: member.user.id,
        name: `${member.user.firstName} ${member.user.lastName}`,
        email: member.user.email,
        rollno: member.user.rollno || '',
        role: member.role
      })),
      proposals: team.proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        content: proposal.content,
        attachment: proposal.attachment,
        ppt_attachment: proposal.ppt_attachment,
        poster_attachment: proposal.poster_attachment,
        link: proposal.link,
        state: proposal.state,
        remarks: proposal.remarks,
        created_at: proposal.created_at,
        updated_at: proposal.updated_at,
        remark_updated_at: proposal.remark_updated_at,
        authorId: proposal.authorId,
        teamCode: proposal.teamCode,
        author: {
          firstName: proposal.author.firstName,
          lastName: proposal.author.lastName,
          email: proposal.author.email,
          rollno: proposal.author.rollno
        }
      })),
      project: team.project,
      stats: {
        proposals: team.proposals.length,
        teamNumber: team.teamNumber,
        members: team.members.length,
        status: team.status
      }
    }));

    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error('Error fetching mentor teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
