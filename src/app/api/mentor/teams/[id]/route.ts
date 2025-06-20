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
        members: {
          include: {
            user: true
          }
        },
        proposals: true,
        project: true
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      code: team.project.code,
      name: team.teamNumber,
      status: team.status,
      members: team.members.map(member => ({
        name: `${member.user.firstName} ${member.user.lastName}`,
        email: member.user.email,
        role: member.user.role
      })),
      proposals: team.proposals,
      project: team.project
    });
  } catch (error) {
    console.error('Error getting team details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { status, projectTitle, projectPillar } = body;

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
    updateData.updatedAt = new Date();

    const updatedTeam = await prisma.team.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        members: {
          include: {
            user: true
          }
        },
        lead: true,
        project: true,
        proposals: true
      }
    });

    return NextResponse.json({
      message: 'Team partially updated successfully',
      team: updatedTeam
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
    const { status, projectTitle, projectPillar, teamNumber } = body;

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
        updatedAt: new Date()
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        lead: true,
        project: true,
        proposals: true
      }
    });

    return NextResponse.json({
      message: 'Team fully updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Error fully updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}