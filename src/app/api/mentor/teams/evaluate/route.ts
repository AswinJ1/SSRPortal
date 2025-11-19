import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

// Type definitions for evaluation data
interface IndividualEvaluation {
  memberId: string;
  memberName: string;
  memberEmail: string;
  
  // Mentor's individual score (3 marks - direct input from mentor)
  individualScore: number; // 3 marks - mentor gives this directly
  
  // External evaluator criteria (will be summed to externalEvaluatorMarks)
  learningContribution: number; // 2 marks
  presentationSkill: number; // 2 marks
  contributionToProject: number; // 2 marks
  externalEvaluatorMarks: number; // Sum of above 3 = 6 marks
  
  totalIndividualMarks: number; // groupScore + individualScore + externalEvaluatorMarks
}

interface TeamEvaluation {
  teamId: string;
  teamNumber: string;
  projectTitle: string;
  batch: string;
  mentorId: string;
  
  // Group marks (same for everyone in group)
  posterMarks: number; // 2 marks
  videoMarks: number; // 3 marks
  reportMarks: number; // 3 marks (attachment evaluation)
  pptMarks: number; // 3 marks (ppt_attachment evaluation)
  groupScore: number; // Sum of above = 11 marks
  
  // Individual evaluations for each member
  individualEvaluations: IndividualEvaluation[];
  
  // External evaluator
  externalEvaluatorName?: string;
  externalEvaluatorEmail?: string;
  
  // Metadata
  evaluatedAt: Date;
  updatedAt?: Date;
  status: 'DRAFT' | 'SUBMITTED';
  remarks?: string;
}

// GET - Fetch evaluation for a team
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const mentor = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { mentees: true }
    });

    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Only mentors can view evaluations' }, { status: 403 });
    }

    const isAssigned = mentor.mentees.some(team => team.id === teamId);
    if (!isAssigned) {
      return NextResponse.json({ error: 'You are not assigned to this team' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
            },
            individualEvaluation: true
          }
        },
        project: true,
        proposals: true
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const existingEvaluation = await prisma.teamEvaluation.findUnique({
      where: { teamId: teamId },
      include: {
        individualEvaluations: {
          include: {
            teamMember: true
          }
        },
        team: {  // does this solve issue
          include: {
            members: true
         }
        }
      }
    });

    if (existingEvaluation) {
      return NextResponse.json({
        message: 'Evaluation found',
        data: existingEvaluation
      });
    } //bug was there not included missed evaluated members


    return NextResponse.json({
      message: 'No evaluation found, returning team data',
      data: {
        team: {
          id: team.id,
          teamNumber: team.teamNumber,
          projectTitle: team.projectTitle,
          batch: team.batch,
          members: team.members.map(member => ({
            id: member.id,
            teamMemberId: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            rollNumber: member.rollNumber,
            user: member.user
          })),
          proposals: team.proposals
        }
      }
    });

  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}

// POST - Create new evaluation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      teamId,
      posterMarks,
      videoMarks,
      reportMarks,
      pptMarks,
      individualEvaluations,
      externalEvaluatorName,
      externalEvaluatorEmail,
      status,
      remarks
    } = body;

    console.log('POST evaluation request:', { teamId, posterMarks, videoMarks, reportMarks, pptMarks });
    console.log('Individual evaluations:', JSON.stringify(individualEvaluations, null, 2));

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const mentor = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { mentees: true }
    });

    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Only mentors can create evaluations' }, { status: 403 });
    }

    const isAssigned = mentor.mentees.some(team => team.id === teamId);
    if (!isAssigned) {
      return NextResponse.json({ error: 'You are not assigned to this team' }, { status: 403 });
    }

    // Validate group marks
    if (posterMarks < 0 || posterMarks > 2) {
      return NextResponse.json({ error: 'Poster marks must be between 0 and 2' }, { status: 400 });
    }
    if (videoMarks < 0 || videoMarks > 3) {
      return NextResponse.json({ error: 'Video marks must be between 0 and 3' }, { status: 400 });
    }
    if (reportMarks < 0 || reportMarks > 3) {
      return NextResponse.json({ error: 'Report marks must be between 0 and 3' }, { status: 400 });
    }
    if (pptMarks < 0 || pptMarks > 3) {
      return NextResponse.json({ error: 'PPT marks must be between 0 and 3' }, { status: 400 });
    }

    const groupScore = posterMarks + videoMarks + reportMarks + pptMarks;

    if (!individualEvaluations || !Array.isArray(individualEvaluations)) {
      return NextResponse.json({ error: 'Individual evaluations are required' }, { status: 400 });
    }

    // Validate individual marks
    for (const evalItem of individualEvaluations) {
      // Validate individualScore (3 marks - mentor's input)
      if (evalItem.individualScore === undefined || evalItem.individualScore === null) {
        return NextResponse.json({ 
          error: `Individual score is required for ${evalItem.memberName}` 
        }, { status: 400 });
      }
      if (evalItem.individualScore < 0 || evalItem.individualScore > 3) {
        return NextResponse.json({ 
          error: `Individual score for ${evalItem.memberName} must be between 0 and 3` 
        }, { status: 400 });
      }
      
      // Validate external evaluator criteria
      if (evalItem.learningContribution < 0 || evalItem.learningContribution > 2) {
        return NextResponse.json({ 
          error: `Learning contribution for ${evalItem.memberName} must be between 0 and 2` 
        }, { status: 400 });
      }
      if (evalItem.presentationSkill < 0 || evalItem.presentationSkill > 2) {
        return NextResponse.json({ 
          error: `Presentation skill for ${evalItem.memberName} must be between 0 and 2` 
        }, { status: 400 });
      }
      if (evalItem.contributionToProject < 0 || evalItem.contributionToProject > 2) {
        return NextResponse.json({ 
          error: `Contribution to project for ${evalItem.memberName} must be between 0 and 2` 
        }, { status: 400 });
      }
    }

    const existingEvaluation = await prisma.teamEvaluation.findUnique({
      where: { teamId }
    });

    if (existingEvaluation) {
      return NextResponse.json(
        { error: 'Evaluation already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    const evaluation = await prisma.teamEvaluation.create({
      data: {
        teamId,
        mentorId: mentor.id,
        posterMarks,
        videoMarks,
        reportMarks,
        pptMarks,
        groupScore,
        externalEvaluatorName,
        externalEvaluatorEmail,
        status: status || 'DRAFT',
        remarks,
        evaluatedAt: new Date(),
        individualEvaluations: {
          create: individualEvaluations.map((evalData: any) => {
            // Calculate externalEvaluatorMarks (6 marks) = sum of 3 criteria
            const externalEvaluatorMarks = 
              evalData.learningContribution + 
              evalData.presentationSkill + 
              evalData.contributionToProject;
            
            // Total = groupScore (11) + individualScore (3, from mentor) + externalEvaluatorMarks (6)
            const totalIndividualMarks = groupScore + evalData.individualScore + externalEvaluatorMarks;
            
            console.log(`Member: ${evalData.memberName}`);
            console.log(`  - Group Score: ${groupScore}`);
            console.log(`  - Individual Score (mentor): ${evalData.individualScore}`);
            console.log(`  - External Marks: ${externalEvaluatorMarks}`);
            console.log(`  - Total: ${totalIndividualMarks}`);
            
            return {
              teamMemberId: evalData.teamMemberId,
              memberId: evalData.memberId,
              memberName: evalData.memberName,
              memberEmail: evalData.memberEmail,
              
              // Mentor's individual score (3 marks - direct input)
              individualScore: evalData.individualScore,
              
              // External evaluator criteria (stored separately)
              learningContribution: evalData.learningContribution,
              presentationSkill: evalData.presentationSkill,
              contributionToProject: evalData.contributionToProject,
              
              // Calculated external evaluator marks (6 marks)
              externalEvaluatorMarks,
              
              // Total marks (20 max)
              totalIndividualMarks
            };
          })
        }
      },
      include: {
        individualEvaluations: {
          include: {
            teamMember: true
          }
        }
      }
    });

    console.log('Evaluation created successfully:', evaluation.id);

    return NextResponse.json({
      message: 'Evaluation created successfully',
      data: evaluation
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
}

// PUT - Update existing evaluation
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      teamId,
      posterMarks,
      videoMarks,
      reportMarks,
      pptMarks,
      individualEvaluations,
      externalEvaluatorName,
      externalEvaluatorEmail,
      status,
      remarks
    } = body;

    console.log('PUT evaluation request:', { teamId, posterMarks, videoMarks, reportMarks, pptMarks });
    console.log('Individual evaluations:', JSON.stringify(individualEvaluations, null, 2));

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const mentor = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { mentees: true }
    });

    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Only mentors can update evaluations' }, { status: 403 });
    }

    const isAssigned = mentor.mentees.some(team => team.id === teamId);
    if (!isAssigned) {
      return NextResponse.json({ error: 'You are not assigned to this team' }, { status: 403 });
    }

    const existingEvaluation = await prisma.teamEvaluation.findUnique({
      where: { teamId }
    });

    if (!existingEvaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found. Use POST to create.' },
        { status: 404 }
      );
    }

    // Validate group marks (same as POST)
    if (posterMarks < 0 || posterMarks > 2) {
      return NextResponse.json({ error: 'Poster marks must be between 0 and 2' }, { status: 400 });
    }
    if (videoMarks < 0 || videoMarks > 3) {
      return NextResponse.json({ error: 'Video marks must be between 0 and 3' }, { status: 400 });
    }
    if (reportMarks < 0 || reportMarks > 3) {
      return NextResponse.json({ error: 'Report marks must be between 0 and 3' }, { status: 400 });
    }
    if (pptMarks < 0 || pptMarks > 3) {
      return NextResponse.json({ error: 'PPT marks must be between 0 and 3' }, { status: 400 });
    }

    const groupScore = posterMarks + videoMarks + reportMarks + pptMarks;

    // Validate individual marks (same as POST)
    for (const evalItem of individualEvaluations) {
      if (evalItem.individualScore === undefined || evalItem.individualScore === null) {
        return NextResponse.json({ 
          error: `Individual score is required for ${evalItem.memberName}` 
        }, { status: 400 });
      }
      if (evalItem.individualScore < 0 || evalItem.individualScore > 3) {
        return NextResponse.json({ 
          error: `Individual score for ${evalItem.memberName} must be between 0 and 3` 
        }, { status: 400 });
      }
      if (evalItem.learningContribution < 0 || evalItem.learningContribution > 2) {
        return NextResponse.json({ 
          error: `Learning contribution for ${evalItem.memberName} must be between 0 and 2` 
        }, { status: 400 });
      }
      if (evalItem.presentationSkill < 0 || evalItem.presentationSkill > 2) {
        return NextResponse.json({ 
          error: `Presentation skill for ${evalItem.memberName} must be between 0 and 2` 
        }, { status: 400 });
      }
      if (evalItem.contributionToProject < 0 || evalItem.contributionToProject > 2) {
        return NextResponse.json({ 
          error: `Contribution to project for ${evalItem.memberName} must be between 0 and 2` 
        }, { status: 400 });
      }
    }

    // Delete existing individual evaluations
    await prisma.individualEvaluation.deleteMany({
      where: { teamEvaluationId: existingEvaluation.id }
    });

    const updatedEvaluation = await prisma.teamEvaluation.update({
      where: { teamId },
      data: {
        posterMarks,
        videoMarks,
        reportMarks,
        pptMarks,
        groupScore,
        externalEvaluatorName,
        externalEvaluatorEmail,
        status: status || existingEvaluation.status,
        remarks,
        updatedAt: new Date(),
        individualEvaluations: {
          create: individualEvaluations.map((evalData: any) => {
            // Calculate externalEvaluatorMarks (6 marks)
            const externalEvaluatorMarks = 
              evalData.learningContribution + 
              evalData.presentationSkill + 
              evalData.contributionToProject;
            
            // Total = groupScore (11) + individualScore (3, from mentor) + externalEvaluatorMarks (6)
            const totalIndividualMarks = groupScore + evalData.individualScore + externalEvaluatorMarks;
            
            console.log(`Member: ${evalData.memberName}`);
            console.log(`  - Group Score: ${groupScore}`);
            console.log(`  - Individual Score (mentor): ${evalData.individualScore}`);
            console.log(`  - External Marks: ${externalEvaluatorMarks}`);
            console.log(`  - Total: ${totalIndividualMarks}`);
            
            return {
              teamMemberId: evalData.teamMemberId,
              memberId: evalData.memberId,
              memberName: evalData.memberName,
              memberEmail: evalData.memberEmail,
              
              // Mentor's individual score (3 marks - direct input)
              individualScore: evalData.individualScore,
              
              // External evaluator criteria (stored separately)
              learningContribution: evalData.learningContribution,
              presentationSkill: evalData.presentationSkill,
              contributionToProject: evalData.contributionToProject,
              
              // Calculated external evaluator marks (6 marks)
              externalEvaluatorMarks,
              
              // Total marks (20 max)
              totalIndividualMarks
            };
          })
        }
      },
      include: {
        individualEvaluations: {
          include: {
            teamMember: true
          }
        }
      }
    });

    console.log('Evaluation updated successfully:', updatedEvaluation.id);

    return NextResponse.json({
      message: 'Evaluation updated successfully',
      data: updatedEvaluation
    });

  } catch (error) {
    console.error('Error updating evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
}