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

type Proposal = {
  id: string;
  title: string;
  status: string;
  description: string;
  content?: string;
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
  proposals: Proposal[];
  batch: string;
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
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
      console.log('API Response batch:', data.batch); // Debug log

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

      console.log('Transformed batch:', transformedTeam.batch); // Debug log
      setTeam(transformedTeam);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
              {/* Update batch display to use the helper function */}
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
            <div className="grid gap-4">
              {team.proposals.map((proposal) => (
                <div key={proposal.id} className="p-4 border rounded-lg">
                  <p><span className="font-medium">Title:</span> {proposal.title}</p>
                  {proposal.content && (
                    <p><span className="font-medium">Content:</span> {proposal.content}</p>
                  )}
                  <p className="mt-2 text-gray-700">{proposal.description}</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                    proposal.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : proposal.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {proposal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


