import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        mentorId: session.user.id
      },
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        proposals: true,
        project: {
          include: {
            theme: true
          }
        }
      }
    });

    // Fetch team members directly from TeamMember table
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: params.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // ✅ FIXED: Simplified query to get occupied team numbers
    const allTeams = await prisma.team.findMany({
      where: {
        id: {
          not: params.id // Exclude current team
        }
      },
      select: {
        teamNumber: true
      }
    });

    // Filter out null, undefined, and empty strings in JavaScript
    const occupiedTeamNumbers = allTeams
      .map(t => t.teamNumber)
      .filter(teamNum => teamNum && teamNum.trim() !== ''); // Only non-empty team numbers

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: team.id,
      code: team.project?.code || '',
      name: team.teamNumber,
      teamNumber: team.teamNumber || '', // ✅ Current team number
      batch: team.batch || '', // ✅ Current batch (if you have this field)
      status: team.status,
      projectTitle: team.projectTitle || '',
      projectPillar: team.projectPillar || '',
      members: teamMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      })),
      occupiedTeamNumbers, // ✅ Array of occupied team numbers
      lead: team.lead,
      proposals: team.proposals,
      project: team.project,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    });
  } catch (error) {
    console.error('Error getting team details:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message // This will help debug further issues
    }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { status, projectTitle, projectPillar, teamNumber, batch } = body;

    // Verify the team belongs to the mentor
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: params.id,
        mentorId: session.user.id
      }
    });

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // PATCH: Partial update - only update fields that are provided
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (projectTitle !== undefined) updateData.projectTitle = projectTitle;
    if (projectPillar !== undefined) updateData.projectPillar = projectPillar;
    if (teamNumber !== undefined) updateData.teamNumber = teamNumber;
    if (batch !== undefined) updateData.batch = batch; // ✅ Add batch update
    updateData.updatedAt = new Date();

    const updatedTeam = await prisma.team.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          include: {
            theme: true
          }
        },
        proposals: true
      }
    });

    // Fetch updated team members from TeamMember table
    const updatedTeamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: params.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      message: 'Team partially updated successfully',
      team: {
        ...updatedTeam,
        members: updatedTeamMembers
      }
    });
  } catch (error) {
    console.error('Error partially updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { status, projectTitle, projectPillar, teamNumber, batch } = body;

    // Verify the team belongs to the mentor
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: params.id,
        mentorId: session.user.id
      }
    });

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // PUT: Complete update - all fields are required
    if (!status || !projectTitle || !projectPillar) {
      return NextResponse.json({ 
        error: 'PUT requires all fields: status, projectTitle, projectPillar' 
      }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: {
        id: params.id
      },
      data: {
        status,
        projectTitle,
        projectPillar,
        ...(teamNumber && { teamNumber }),
        ...(batch && { batch }), // ✅ Add batch update
        updatedAt: new Date()
      },
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          include: {
            theme: true
          }
        },
        proposals: true
      }
    });

    // Fetch updated team members from TeamMember table
    const updatedTeamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: params.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      message: 'Team fully updated successfully',
      team: {
        ...updatedTeam,
        members: updatedTeamMembers
      }
    });
  } catch (error) {
    console.error('Error fully updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}