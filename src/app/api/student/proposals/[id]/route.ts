import { NextResponse } from 'next/server';
import { auth } from '@auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Remove or update the old proposalSchema
const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  content: z.string().optional(), // Changed from min(100) to optional
  attachment: z.string().optional(),
  ppt_attachment: z.string().optional(),
  poster_attachment: z.string().optional(),
  link: z.string().optional(),
});

// Update the schema to match the shared proposalSchema
const updateProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  content: z.string().optional(), // Changed from min(100) to optional
  attachment: z.string().optional(),
  poster_attachment: z.string().optional(),
  ppt_attachment: z.string().optional(),
  link: z.string().optional(),
  state: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({
        error: 'Unauthorized',
        message: 'Please sign in to view proposals'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!proposal) {
      return new NextResponse(JSON.stringify({
        error: 'Not Found',
        message: 'Proposal not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to view this proposal
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { team: true },
    });

    if (!user?.team || user.team.teamNumber !== proposal.teamCode) {
      return new NextResponse(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to view this proposal'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return new NextResponse(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Failed to fetch proposal'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({
        error: 'Unauthorized',
        message: 'Please sign in to update proposals'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        author: true,
        Team: true,
      },
    });

    if (!proposal) {
      return new NextResponse(JSON.stringify({
        error: 'Not Found',
        message: 'Proposal not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to edit this proposal
    if (proposal.authorId !== session.user.id) {
      return new NextResponse(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to edit this proposal'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only allow editing of drafts
    if (proposal.state !== 'DRAFT') {
      return new NextResponse(JSON.stringify({
        error: 'Forbidden',
        message: 'Only draft proposals can be edited'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    
    // Validate request body using updated schema
    const result = proposalSchema.safeParse(body);
    if (!result.success) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed',
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update proposal with fallback for content
    const updatedProposal = await prisma.proposal.update({
      where: { id: parseInt(params.id) },
      data: {
        title: body.title,
        description: body.description,
        content: body.content || proposal.content || '', // Add fallback
        attachment: body.attachment,
        ppt_attachment: body.ppt_attachment,
        poster_attachment: body.poster_attachment,
        link: body.link,
        updated_at: new Date(),
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return new NextResponse(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Failed to update proposal'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({
        error: 'Unauthorized',
        message: 'Please sign in to update proposals'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const proposalId = parseInt(params.id);
    
    if (isNaN(proposalId)) {
      return new NextResponse(JSON.stringify({
        error: 'Invalid proposal ID',
        message: 'The proposal ID must be a number'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify proposal exists and belongs to user
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { author: true },
    });

    if (!existingProposal) {
      return new NextResponse(JSON.stringify({
        error: 'Not Found',
        message: 'Proposal not found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (existingProposal.authorId !== session.user.id) {
      return new NextResponse(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to update this proposal'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const validatedData = updateProposalSchema.parse(body);

    // Ensure content is always a string (default to empty if not provided)
    const updateData = {
      ...validatedData,
      content: validatedData.content || existingProposal.content || '',
    };

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
    });

    return NextResponse.json(updatedProposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({
        error: 'Validation failed',
        details: error.errors
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.error('Error updating proposal:', error);
    return new NextResponse(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Failed to update proposal'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}