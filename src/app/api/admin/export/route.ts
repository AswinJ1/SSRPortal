import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Parser } from '@json2csv/plainjs';

// Define column mapping for data extraction
const COLUMN_MAPPING: Record<string, { label: string; getValue: (data: any) => string }> = {
  teamNumber: { 
    label: 'Team Number', 
    getValue: (data) => data.team.teamNumber || 'N/A' 
  },
  teamStatus: { 
    label: 'Team Status', 
    getValue: (data) => data.team.status 
  },
  projectTitle: { 
    label: 'Project Title', 
    getValue: (data) => data.team.projectTitle || 'No Title' 
  },
  projectPillar: { 
    label: 'Project Pillar', 
    getValue: (data) => data.team.projectPillar || 'N/A' 
  },
  batch: { 
    label: 'Batch', 
    getValue: (data) => data.team.batch || 'N/A' 
  },
  createdAt: { 
    label: 'Created Date', 
    getValue: (data) => data.team.createdAt.toLocaleDateString() 
  },
  updatedAt: { 
    label: 'Updated Date', 
    getValue: (data) => data.team.updatedAt.toLocaleDateString() 
  },
  
  // Mentor fields
  mentorName: { 
    label: 'Mentor Name', 
    getValue: (data) => data.team.mentor ? `${data.team.mentor.firstName} ${data.team.mentor.lastName}` : 'No Mentor' 
  },
  mentorEmail: { 
    label: 'Mentor Email', 
    getValue: (data) => data.team.mentor?.email || 'N/A' 
  },
  mentorPhone: { 
    label: 'Mentor Phone', 
    getValue: (data) => data.team.mentor?.phone || 'N/A' 
  },
  
  // Lead fields
  leadName: { 
    label: 'Team Lead Name', 
    getValue: (data) => data.team.lead ? `${data.team.lead.firstName} ${data.team.lead.lastName}` : 'No Lead' 
  },
  leadEmail: { 
    label: 'Team Lead Email', 
    getValue: (data) => data.team.lead?.email || 'N/A' 
  },
  leadPhone: { 
    label: 'Team Lead Phone', 
    getValue: (data) => data.team.lead?.phone || 'N/A' 
  },
  
  // Team member fields - One per line
  memberNames: { 
    label: 'Team Members', 
    getValue: (data) => data.members.map((m: any) => m.name).join('\n') || 'No Members' 
  },
  memberEmails: { 
    label: 'Member Emails', 
    getValue: (data) => data.members.map((m: any) => m.email).join('\n') || 'N/A' 
  },
  memberRoles: { 
    label: 'Member Roles', 
    getValue: (data) => data.members.map((m: any) => m.role).join('\n') || 'N/A' 
  },
  memberRollNumbers: { 
    label: 'Member Roll Numbers', 
    getValue: (data) => data.members.map((m: any) => m.rollNumber || 'N/A').join('\n') || 'N/A' 
  },
  memberBatches: { 
    label: 'Member Batches', 
    getValue: (data) => data.members.map((m: any) => m.batch || 'N/A').join('\n') || 'N/A' 
  },
  memberCount: { 
    label: 'Total Members', 
    getValue: (data) => data.members.length.toString() 
  },
};

// Helper function to extract metadata from proposal
const extractProposalMetadata = (proposal: any): any => {
  try {
    // First try to extract from content field (HTML comment)
    const metadataMatch = proposal.content.match(/<!-- METADATA:(.*?) -->/);
    if (metadataMatch) {
      return JSON.parse(metadataMatch[1]);
    } else if (proposal.link && proposal.link.startsWith('{')) {
      // Fallback: try to parse link field as JSON
      return JSON.parse(proposal.link);
    }
    return {};
  } catch {
    return {};
  }
};

// Merge all column mappings
Object.assign(COLUMN_MAPPING, {
  // Additional Proposal fields - One per line
  proposalTitle: { 
    label: 'Proposal Title', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => p.title).join('\n')
      : 'No proposals'
  },
  proposalDescription: { 
    label: 'Proposal Description', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => p.description || 'No description').join('\n')
      : 'No proposals'
  },
  proposalStatus: { 
    label: 'Proposal Status', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => p.status || 'No status').join('\n')
      : 'No proposals'
  },
  proposalCategory: { 
    label: 'Proposal Category', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.category || 'No category';
        }).join('\n')
      : 'No proposals'
  },
  proposalLocationState: { 
    label: 'Proposal State/Location', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.state || 'No state';
        }).join('\n')
      : 'No proposals'
  },
  proposalDistrict: { 
    label: 'Proposal District', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.district || 'No district';
        }).join('\n')
      : 'No proposals'
  },
  proposalCity: { 
    label: 'Proposal City', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.city || 'No city';
        }).join('\n')
      : 'No proposals'
  },
  proposalPlaceVisited: { 
    label: 'Place Visited', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.placeVisited || 'No place visited';
        }).join('\n')
      : 'No proposals'
  },
  proposalTravelTime: { 
    label: 'Travel Time', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.travelTime || 'No travel time';
        }).join('\n')
      : 'No proposals'
  },
  proposalExecutionTime: { 
    label: 'Execution Time', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.executionTime || 'No execution time';
        }).join('\n')
      : 'No proposals'
  },
  proposalCompletionDate: { 
    label: 'Completion Date', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          const metadata = extractProposalMetadata(p);
          return metadata.completionDate ? new Date(metadata.completionDate).toLocaleDateString() : 'No completion date';
        }).join('\n')
      : 'No proposals'
  },
  proposalVideoLink: { 
    label: 'Video Link', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => {
          return p.link && !p.link.startsWith('{') ? p.link : 'No Video link';
        }).join('\n')
      : 'No proposals'
  },
  proposalAttachment: { 
    label: 'Proposal Attachment', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => p.attachment || 'No attachment').join('\n')
      : 'No proposals'
  },
  proposalRemarks: { 
    label: 'Proposal Remarks', 
    getValue: (data) => data.team.proposals.length > 0
      ? data.team.proposals.map((p: any) => p.remarks || 'No remarks').join('\n')
      : 'No proposals'
  },
  proposalSubmittedAt: { 
    label: 'Proposal Submitted Date', 
    getValue: (data) => data.team.proposals.length > 0 
      ? data.team.proposals[data.team.proposals.length - 1].created_at.toLocaleDateString()
      : 'No proposals'
  },
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const selectedColumns: string[] = body.columns || [];

    if (selectedColumns.length === 0) {
      return new NextResponse('No columns selected', { status: 400 });
    }

    const invalidColumns = selectedColumns.filter(col => !COLUMN_MAPPING[col]);
    if (invalidColumns.length > 0) {
      return new NextResponse(`Invalid columns: ${invalidColumns.join(', ')}`, { status: 400 });
    }

    const teams = await prisma.team.findMany({
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        project: {
          include: {
            theme: true
          }
        },
        proposals: {
          select: {
            title: true,
            description: true,
            content: true,
            state: true,
            link: true,
            created_at: true,
            attachment: true,
            remarks: true
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const allTeamIds = teams.map(team => team.id);
    const allMembers = await prisma.teamMember.findMany({
      where: {
        teamId: { in: allTeamIds }
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        email: true,
        role: true,
        rollNumber: true
       
      }
    });

    const membersByTeam: Record<string, typeof allMembers> = {};
    for (const member of allMembers) {
      if (!membersByTeam[member.teamId]) {
        membersByTeam[member.teamId] = [];
      }
      membersByTeam[member.teamId].push(member);
    }

    const csvData = teams.map(team => {
      const teamMembers = membersByTeam[team.id] || [];
      const data = { team, members: teamMembers };
      
      const row: Record<string, string> = {};
      for (const columnId of selectedColumns) {
        const columnConfig = COLUMN_MAPPING[columnId];
        if (columnConfig) {
          row[columnId] = columnConfig.getValue(data);
        }
      }
      
      return row;
    });

    const fields = selectedColumns.map(columnId => ({
      label: COLUMN_MAPPING[columnId].label,
      value: columnId
    }));

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `teams_export_${timestamp}.csv`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename=${filename}`);
    
    return new NextResponse(csv, { headers });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const teams = await prisma.team.findMany({
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        project: {
          include: {
            theme: true
          }
        },
        proposals: {
          select: {
            title: true,
            description: true,
            content: true,
            state: true,
            link: true,
            created_at: true,
            attachment: true,
            remarks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const allTeamIds = teams.map(team => team.id);
    const allMembers = await prisma.teamMember.findMany({
      where: {
        teamId: { in: allTeamIds }
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        email: true,
        role: true,
        rollNumber: true,
 
      }
    });

    const membersByTeam: Record<string, typeof allMembers> = {};
    for (const member of allMembers) {
      if (!membersByTeam[member.teamId]) {
        membersByTeam[member.teamId] = [];
      }
      membersByTeam[member.teamId].push(member);
    }

    const csvData = teams.map(team => {
      const teamMembers = membersByTeam[team.id] || [];
      
      return {
        teamNumber: team.teamNumber || 'N/A',
        teamStatus: team.status,
        projectTitle: team.projectTitle || 'No Title',
        projectPillar: team.projectPillar || 'N/A',
        batch: team.batch || 'N/A',
        mentorName: team.mentor ? `${team.mentor.firstName} ${team.mentor.lastName}` : 'No Mentor',
        mentorEmail: team.mentor?.email || 'N/A',
        leadName: team.lead ? `${team.lead.firstName} ${team.lead.lastName}` : 'No Lead',
        leadEmail: team.lead?.email || 'N/A',
        memberCount: teamMembers.length,
        members: teamMembers.map(m => m.name).join('\n') || 'No Members',
        memberEmails: teamMembers.map(m => m.email).join('\n') || 'N/A',
        memberRoles: teamMembers.map(m => m.role).join('\n') || 'N/A',
        memberRollNumbers: teamMembers.map(m => m.rollNumber || 'N/A').join('\n') || 'N/A',
        proposalCount: team.proposals.length,
        proposalStatus: team.proposals.length > 0
          ? team.proposals.map(p => `${p.title}: ${p.state}`).join('\n')
          : 'No proposals',
        latestProposalDate: team.proposals.length > 0 
          ? team.proposals[team.proposals.length - 1].created_at.toLocaleDateString()
          : 'No proposals',
        projectName: team.project?.name || 'No Project',
        projectTheme: team.project?.theme?.name || 'No Theme',
        projectDescription: team.project?.description || 'No Description',
        projectCode: team.project?.code || 'N/A',
        createdAt: team.createdAt.toLocaleDateString(),
        updatedAt: team.updatedAt.toLocaleDateString(),
      };
    });

    const parser = new Parser({
      fields: [
        { label: 'Team Number', value: 'teamNumber' },
        { label: 'Team Status', value: 'teamStatus' },
        { label: 'Project Title', value: 'projectTitle' },
        { label: 'Project Pillar', value: 'projectPillar' },
        { label: 'Batch', value: 'batch' },
        { label: 'Mentor Name', value: 'mentorName' },
        { label: 'Mentor Email', value: 'mentorEmail' },
        { label: 'Lead Name', value: 'leadName' },
        { label: 'Lead Email', value: 'leadEmail' },
        { label: 'Member Count', value: 'memberCount' },
        { label: 'Members', value: 'members' },
        { label: 'Member Emails', value: 'memberEmails' },
        { label: 'Member Roles', value: 'memberRoles' },
        { label: 'Member Roll Numbers', value: 'memberRollNumbers' },
        { label: 'Member Batches', value: 'memberBatches' },
        { label: 'Proposal Count', value: 'proposalCount' },
        { label: 'Proposal Status', value: 'proposalStatus' },
        { label: 'Latest Proposal Date', value: 'latestProposalDate' },
        { label: 'Project Name', value: 'projectName' },
        { label: 'Project Theme', value: 'projectTheme' },
        { label: 'Project Description', value: 'projectDescription' },
        { label: 'Project Code', value: 'projectCode' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' }
      ]
    });
    
    const csv = parser.parse(csvData);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `teams_export_${timestamp}.csv`;
    
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename=${filename}`);
    
    return new NextResponse(csv, { headers });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}