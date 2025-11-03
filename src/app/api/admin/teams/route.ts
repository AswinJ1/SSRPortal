import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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
        proposals: {
          select: {
            id: true,
            title: true,
            description: true,
            content: true,
            state: true,
            link: true,
            attachment: true,
            ppt_attachment: true,
            poster_attachment: true,
            remarks: true,
            created_at: true,
            updated_at: true
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        evaluation: {
          include: {
            individualEvaluations: {
              include: {
                teamMember: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get members for all teams
    const allTeamIds = teams.map(team => team.id);
    const allMembers = await prisma.teamMember.findMany({
      where: {
        teamId: { in: allTeamIds }
      }
    });

    const membersByTeam: Record<string, typeof allMembers> = {};
    for (const member of allMembers) {
      if (!membersByTeam[member.teamId]) {
        membersByTeam[member.teamId] = [];
      }
      membersByTeam[member.teamId].push(member);
    }

    const transformedTeams = teams.map(team => ({
      id: team.id,
      teamNumber: team.teamNumber,
      projectTitle: team.projectTitle,
      status: team.status,
      mentor: team.mentor ? {
        id: team.mentor.id,
        name: `${team.mentor.firstName} ${team.mentor.lastName}`,
        email: team.mentor.email
      } : null,
      members: (membersByTeam[team.id] || []).map(m => ({
        name: m.name,
        email: m.email,
        role: m.role
      })),
      lead: team.lead ? {
        name: `${team.lead.firstName} ${team.lead.lastName}`,
        email: team.lead.email
      } : null,
      project: team.project,
      proposals: team.proposals.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        state: p.state,
        link: p.link,
        attachment: p.attachment,
        pptAttachment: p.ppt_attachment,
        posterAttachment: p.poster_attachment,
        remarks: p.remarks,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      evaluation: team.evaluation ? {
        id: team.evaluation.id,
        status: team.evaluation.status,
        // Group marks
        posterMarks: team.evaluation.posterMarks,
        videoMarks: team.evaluation.videoMarks,
        reportMarks: team.evaluation.reportMarks,
        pptMarks: team.evaluation.pptMarks,
        groupScore: team.evaluation.groupScore,
        // External evaluator
        externalEvaluatorName: team.evaluation.externalEvaluatorName,
        externalEvaluatorEmail: team.evaluation.externalEvaluatorEmail,
        // Individual evaluations
        individualEvaluations: team.evaluation.individualEvaluations.map(ie => ({
          id: ie.id,
          memberName: ie.memberName,
          memberEmail: ie.memberEmail,
          learningContribution: ie.learningContribution,
          presentationSkill: ie.presentationSkill,
          contributionToProject: ie.contributionToProject,
          individualScore: ie.individualScore,
          externalEvaluatorMarks: ie.externalEvaluatorMarks,
          totalIndividualMarks: ie.totalIndividualMarks,
          teamMember: ie.teamMember
        })),
        // Metadata
        remarks: team.evaluation.remarks,
        evaluatedAt: team.evaluation.evaluatedAt,
        updatedAt: team.evaluation.updatedAt
      } : null
    }));

    return NextResponse.json(transformedTeams);
  } catch (error) {
    console.error('Error fetching all teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}