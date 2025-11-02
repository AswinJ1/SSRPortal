import { NextResponse } from 'next/server';
import { auth } from '@auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  attachment: z.string().optional(),
  ppt_attachment: z.string().optional(),
  poster_attachment: z.string().optional(),
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
    
    // Validate request body
    const result = proposalSchema.safeParse(body);
    if (!result.success) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: parseInt(params.id) },
      data: {
        title: body.title,
        description: body.description,
        content: body.content,
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

// ...existing code...