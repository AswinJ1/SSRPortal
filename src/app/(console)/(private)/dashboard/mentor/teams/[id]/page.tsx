'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit } from 'lucide-react';

type TeamLead = {
  firstName: string;
  lastName: string;
  email: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ProjectTheme = {
  name: string;
};

type Project = {
  code: string;
  title: string;
  description: string;
  theme?: ProjectTheme;
};

type ProposalAuthor = {
  firstName: string;
  lastName: string;
  email: string;
  rollno: string;
};

type Proposal = {
  id: number;
  title: string;
  state: string;
  description: string;
  content?: string;
  attachment?: string;
  link?: string;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
  remark_updated_at?: Date;
  author: ProposalAuthor;
  metadata?: any;
};

type Team = {
  id: string;
  teamNumber: string;
  projectTitle: string;
  projectPillar: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mentorId: string;
  leadId: string;
  createdAt: Date;
  updatedAt: Date;
  lead: TeamLead | null;
  members: TeamMember[];
  project?: Project;
  proposals: { id: number }[];
  batch: string;
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert batch codes to readable names
  const getBatchDisplayName = (batchValue: string): string => {
    if (!batchValue) return 'Not assigned';
    
    const batchMap: { [key: string]: string } = {
      'AI_A': 'AI A',
      'AI_B': 'AI B', 
      'AI_DS': 'AI-DS',
      'CYS': 'CYS',
      'CSE_A': 'CSE A',
      'CSE_B': 'CSE B',
      'CSE_C': 'CSE C',
      'CSE_D': 'CSE D',
      'ECE_A': 'ECE A',
      'ECE_B': 'ECE B',
      'EAC': 'EAC',
      'ELC': 'ELC',
      'EEE': 'EEE',
      'ME': 'ME',
      'RAE': 'RAE'
    };

    return batchMap[batchValue] || batchValue;
  };

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/mentor/teams/${params.id}`);

      if (!response.ok) {
        const errorData = await response.text();

        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        if (response.status === 404) {
          router.push('/dashboard/mentor/teams');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();

      const transformedTeam: Team = {
        id: data.id,
        teamNumber: data.name || '',
        projectTitle: data.projectTitle || '',
        projectPillar: data.projectPillar || '',
        status: data.status || 'PENDING',
        mentorId: '',
        leadId: '',
        batch: data.batch || '',
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lead: data.lead || null,
        members: data.members || [],
        project: data.project,
        proposals: data.proposals || []
      };

      setTeam(transformedTeam);

      // Fetch detailed proposal data for each proposal
      if (transformedTeam.proposals.length > 0) {
        await fetchProposals(transformedTeam.proposals);
      } else {
        setProposals([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async (proposalRefs: { id: number }[]) => {
    try {
      setProposalsLoading(true);
      
      // Fetch each proposal using the API endpoint
      const proposalPromises = proposalRefs.map(async (ref) => {
        const response = await fetch(`/api/mentor/proposals/${ref.id}`);
        
        if (!response.ok) {
          console.error(`Failed to fetch proposal ${ref.id}`);
          return null;
        }
        
        const result = await response.json();
        return result.data;
      });

      const fetchedProposals = await Promise.all(proposalPromises);
      
      // Filter out any null values from failed requests
      const validProposals = fetchedProposals.filter((p): p is Proposal => p !== null);
      
      setProposals(validProposals);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTeamDetails();
    }
  }, [params.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (params.id && !loading) {
        fetchTeamDetails();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [params.id, loading]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <button
            onClick={fetchTeamDetails}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <p>Team not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Details</h1>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">Team {team.teamNumber}</h2>
              <div className="mt-1">
                <span className="text-lg font-medium text-blue-600">
                  Batch: {getBatchDisplayName(team.batch)}
                </span>
              </div>
              <p className="text-gray-600 mt-2">{team.projectTitle}</p>
              <p className="text-sm text-gray-500">Project Pillar: {team.projectPillar}</p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${
              team.status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : team.status === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {team.status}
            </span>
          </div>
        </div>

        <Link
          href={`/dashboard/mentor/teams/edit/${team.id}`}
          className="bg-blue-500 rounded-md w-fit px-4 py-2 flex items-center gap-2 hover:bg-blue-600 transition-colors text-white"
        >
          <Edit className="text-white" />
          <span className="text-white">Edit Team</span>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Team Leader</h3>
            {team.lead ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{team.lead.firstName} {team.lead.lastName}</p>
                <p className="text-sm text-gray-600">{team.lead.email}</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No team leader assigned</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Members</h3>
            <div className="grid gap-4">
              {team.members
                .filter(member => !member.role.includes('LEADER'))
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                ))}
              {team.members.filter(member => !member.role.includes('LEADER')).length === 0 && (
                <p className="text-gray-500">No other members found</p>
              )}
            </div>
          </div>
        </div>

        {team.project && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <p><span className="font-medium">Code:</span> {team.project.code}</p>
            <p><span className="font-medium">Title:</span> {team.project.title}</p>
            {team.project.theme && (
              <p><span className="font-medium">Theme:</span> {team.project.theme.name}</p>
            )}
            <div className="mt-4">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-700">{team.project.description}</p>
            </div>
          </div>
        )}

        {team.proposals.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Project Proposals</h2>
            
            {proposalsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-lg">{proposal.title}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        proposal.state === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : proposal.state === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {proposal.state}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      By: {proposal.author.firstName} {proposal.author.lastName} ({proposal.author.rollno})
                    </p>
                    
                    <p className="text-gray-700 mb-2">{proposal.description}</p>
                    
                    {proposal.link && (
                      <p className="text-sm">
                        <span className="font-medium">Link:</span>{' '}
                        <a 
                          href={proposal.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {proposal.link}
                        </a>
                      </p>
                    )}
                    
                    {proposal.attachment && (
                      <p className="text-sm">
                        <span className="font-medium">Attachment:</span>{' '}
                        <a 
                          href={proposal.attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View File
                        </a>
                      </p>
                    )}
                    
                    {proposal.remarks && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-700">Remarks:</p>
                        <p className="text-sm text-gray-600">{proposal.remarks}</p>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Created: {new Date(proposal.created_at).toLocaleString()}</p>
                      {proposal.remark_updated_at && (
                        <p>Last reviewed: {new Date(proposal.remark_updated_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}