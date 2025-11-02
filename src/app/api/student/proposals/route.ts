import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { proposalSchema } from '@/lib/validation/proposal';

export async function POST(req: Request) {
  try {
    console.log('POST /api/student/proposals - Start');
    const session = await auth();
    if (!session?.user?.id) {
      console.log('POST /api/student/proposals - Unauthorized: No session or user ID');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.log('POST /api/student/proposals - User ID:', session.user.id);

    const body = await req.json();
    console.log('POST /api/student/proposals - Request body:', JSON.stringify(body));
    const result = proposalSchema.safeParse(body);
    
    if (!result.success) {
      // Using type assertion to satisfy TypeScript
      console.error('Validation failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed',
        // We use type assertion since TypeScript doesn't recognize the discriminated union
        details: (result as { error: { issues: any[] } }).error.issues
      }, { status: 400 });
    }
    
    // If validation succeeds, result has a data property
    const parsed = result.data;

    // find user's team
    console.log('POST /api/student/proposals - Finding user with team');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        teamMembers: {
          include: { team: true }
        },
        Proposal: true
      },
    });
    
    console.log('POST /api/student/proposals - User found:', user?.firstName, user?.lastName);
    console.log('POST /api/student/proposals - Team members count:', user?.teamMembers?.length || 0);
    
    if (!user?.teamMembers || user.teamMembers.length === 0) {
      console.log('POST /api/student/proposals - No team members found');
      return NextResponse.json({
        success: false,
        error: 'Team not found',
        message: 'You must be part of a team to submit a proposal',
      }, { status: 404 });
    }
    
    // Get team through team members relation
    const userTeam = user.teamMembers[0]?.team;
    console.log('POST /api/student/proposals - User team found:', userTeam?.id || 'null');
    
    if (!userTeam) {
      console.log('POST /api/student/proposals - No team found for user');
      return NextResponse.json({
        success: false,
        error: 'Team not found',
        message: 'You must be part of a team to submit a proposal',
      }, { status: 404 });
    }
    
    // Check if the student already has a proposal
    const existingProposal = user?.Proposal?.[0];
    
    if (existingProposal) {
      // If there's an existing proposal, check if it's rejected
      if (existingProposal.state !== 'REJECTED') {
        return NextResponse.json({
          success: false,
          error: 'Proposal exists',
          message: 'You already have a proposal submitted. Only rejected proposals can be edited.',
          currentState: existingProposal.state
        }, { status: 400 });
      }
      
      // If it's rejected, we'll update it instead of creating a new one
      // Extract optional metadata if provided
      const metadata = body._metadata || {};
      
      const p = await prisma.proposal.update({
        where: { id: existingProposal.id },
        data: {
          title: parsed.title,
          description: parsed.description,
          content: parsed.content,
          attachment: parsed.attachment || '',
          ppt_attachment: parsed.ppt_attachment || '',
          poster_attachment: parsed.poster_attachment || '',
          link: parsed.link || '',
          state: 'DRAFT', // Reset to draft for mentor review
          // Metadata can be stored as JSON if your schema supports it
          // metadata: metadata,
          updated_at: new Date(),
        },
        include: {
          author: { select: { firstName: true, lastName: true, email: true } },
          Team: { include: { mentor: { select: { email: true } } } },
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        data: p,
        message: 'Proposal updated and submitted for review again'
      }, { status: 200 });
    }
    
    // Extract optional metadata if provided
    const metadata = body._metadata || {};
    
    // For new proposals
    const p = await prisma.proposal.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        attachment: parsed.attachment || '',
        ppt_attachment: parsed.ppt_attachment || '',
        poster_attachment: parsed.poster_attachment || '',
        link: parsed.link || '',
        state: 'DRAFT',
        // Store additional metadata as JSON in metadata field if your schema supports it
        // metadata: metadata,  // Uncomment if you have a metadata JSON field in your schema
        Team: { connect: { id: userTeam.id } },
        author: { connect: { id: session.user.id } },
        updated_at: new Date(),
      },
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        Team: { include: { mentor: { select: { email: true } } } },
      },
    });

    return NextResponse.json({ success: true, data: p }, { status: 201 });
  } catch (e: any) {
    console.error('Error creating proposal:', e);
    // More detailed error message to help with debugging
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      message: e?.message || 'Unknown error occurred',
      // Include stack trace in development mode
      ...(process.env.NODE_ENV === 'development' && { stack: e?.stack })
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        teamMembers: {
          include: { team: true }
        }
      },
    });

    // Get team through team members relation
    const userTeam = user?.teamMembers?.[0]?.team;
    
    if (!userTeam) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    // Get the proposals for this user - should be only one
    const proposals = await prisma.proposal.findMany({
      where: { 
        authorId: session.user.id,  // Only get this student's proposals
        teamCode: userTeam.id       // From their team
      },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        attachment: true,
        ppt_attachment: true,
        poster_attachment: true,
        link: true,  // Make sure link field is included for metadata
        state: true,
        remarks: true,
        created_at: true,
        updated_at: true,
        remark_updated_at: true,
        author: { select: { firstName: true, lastName: true, email: true } },
        Team: { 
          include: { 
            mentor: { select: { firstName: true, lastName: true, email: true } } 
          } 
        }
      },
    });

    return NextResponse.json({ success: true, data: proposals });
  } catch (e) {
    console.error('Error fetching proposals:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
