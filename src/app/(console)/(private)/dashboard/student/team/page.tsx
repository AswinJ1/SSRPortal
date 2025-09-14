'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TeamForm from './form';
import toast from 'react-hot-toast';

// Define ProjectPillar type
type ProjectPillar = 'DRUG_AWARENESS' | 'CYBERSECURITY_AWARENESS' | 'HEALTH_AND_WELLBEING' | 
  'INDIAN_CULTURE_AND_HERITAGE' | 'SKILL_BUILDING' | 'ENVIRONMENTAL_INITIATIVES' | 
  'WOMEN_EMPOWERMENT' | 'PEER_MENTORSHIP' | 'TECHNICAL_PROJECTS' | 'FINANCIAL_LITERACY';

interface TeamMember {
  name: string;
  email: string;
  rollNumber: string;
  isLeader: boolean;
}

interface TeamData {
  teamName: string;
  projectTitle: string;
  projectPillar: ProjectPillar;
  mentorId: string;
  batch: string;
  teamNumber: string;
  members: TeamMember[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusMessage?: string;
}

export default function TeamPage() {
  const { data: session, status } = useSession();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const fetchTeam = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/teams/user/${session.user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team data');
        }

        const data = await response.json();
        
        if (data) {
          const teamData: TeamData = {
            teamName: data.name || '',
            projectTitle: data.projectTitle || '',
            projectPillar: data.projectPillar as ProjectPillar,
            mentorId: data.mentorId || '',
            batch: data.batch || '',
            teamNumber: data.teamNumber || '',
            status: data.status,
            statusMessage: data.statusMessage,
            members: data.members?.map((m: any) => ({  // Changed from teamMembers to members
              name: m.name,
              email: m.email,
              rollNumber: m.rollNumber || '',
              isLeader: m.role === 'LEADER'
            })) || []
          };
          console.log('Fetched team data:', teamData); // Add this for debugging
          setTeam(teamData);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchTeam();
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Show different views based on team status
  const renderTeamContent = () => {
    if (!team) {
      return <TeamForm />;
    }

    switch (team.status) {
      case 'PENDING':
        return (
          <div className="bg-green-50 border border-green-200 rounded-md p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Team Request Submitted!</h2>
            <div className="space-y-2 text-green-700">
              <p>Your team request has been submitted successfully.</p>
              <p>Team Number: {team.teamNumber}</p>
              <p>Status: Awaiting mentor approval</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/student')}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Return to Dashboard
            </button>
          </div>
        );

      case 'APPROVED':
        return (
          <div className="bg-white border rounded-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Team</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Team Number:</p>
                <p className="font-medium">{team.teamNumber}</p>
              </div>
                <div className="flex justify-between items-center">
                <p className="text-gray-600">Batch:</p>
                <p className="font-medium">{team.batch}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Project Title:</p>
                <p className="font-medium">{team.projectTitle}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Project Pillar:</p>
                <p className="font-medium">{team.projectPillar}</p>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Team Members</h3>
                <ul className="space-y-2">
                  {team.members.map((member, index) => (
                    <li key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {member.name} 
                            {member.isLeader && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Leader
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <p className="text-sm text-gray-600">{member.rollNumber}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 p-2 bg-green-50 rounded">
                <p className="text-green-700">Status: Approved</p>
              </div>
            </div>
          </div>
        );

      case 'REJECTED':
        return (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Team Request Rejected</h2>
              <p className="text-red-700">Reason: {team.statusMessage}</p>
            </div>
            <TeamForm initialData={team} isEditing={true} />
          </div>
        );

      default:
        return <TeamForm />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {!session?.user ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-yellow-700">Please log in to manage your team.</p>
        </div>
      ) : (
        renderTeamContent()
      )}
    </div>
  );
}