import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is a mentor and get their mentored teams
    const mentor = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: { 
        mentees: true  // Get teams mentored by this user
      }
    });

    if (!mentor || mentor.role !== "MENTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!mentor.mentees || mentor.mentees.length === 0) {
      return NextResponse.json({ 
        data: [], 
        message: "You are not assigned as a mentor to any teams yet" 
      });
    }

    // Get the team IDs of all teams mentored by this mentor (not teamNumbers!)
    const teamIds = mentor.mentees.map(team => team.id);

    // Fetch all proposals from teams mentored by this mentor
    const proposals = await prisma.proposal.findMany({
      where: {
        teamCode: { in: teamIds } // Only get proposals from teams this mentor is assigned to
      },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        attachment: true,
        ppt_attachment: true,
        poster_attachment: true,
        link: true,
        state: true,
        remarks: true,
        created_at: true,
        updated_at: true,
        remark_updated_at: true,
        // Include ALL metadata fields that students fill
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            rollno: true
          },
        },
        Team: {
          select: {
            id: true,
            projectTitle: true,
            teamNumber: true,
            batch: true,
            members: {
              select: {
                name: true,
                email: true,
                rollNumber: true,
                role: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    rollno: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Extract metadata from content field and add it to each proposal
    const proposalsWithMetadata = proposals.map(proposal => {
      let metadata = {};
      
      // Extract metadata from HTML comment in content field
      try {
        const metadataMatch = proposal.content.match(/<!-- METADATA:(.*?) -->/);
        if (metadataMatch) {
          metadata = JSON.parse(metadataMatch[1]);
        }
      } catch (error) {
        console.error('Error parsing metadata for proposal', proposal.id, error);
      }
      
      return {
        ...proposal,
        metadata
      };
    });

    return NextResponse.json({ data: proposalsWithMetadata });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
