'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ITeam } from '@/app/(console)/types';
import Link from 'next/link';


export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/mentor/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data);
        }
      } catch (error) {
        console.error('Error fetching mentor teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-5 flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mentor Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
        <div className="grid grid-cols-1 gap-4">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Team {team.teamNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {team.stats.members} members · {team.stats.proposals} proposals
                    </p>
                  </div>
                  <span className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
                    {team.stats.status}
                  </span>
                </div>
                
                {/* Team Actions */}
                <div className="flex gap-2 mt-4">
                  <Link 
                    href={`/dashboard/mentor/teams/${team.id}`}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    View Details
                  </Link>
                  {team.stats.status === 'PROPOSAL_SUBMISSION' && (
                    <button
                      onClick={() => router.push(`/dashboard/mentor/teams/${team.code}/proposals`)}
                      className="px-4 py-2 text-sm bg-white border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Review Proposals
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No teams assigned yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/mentor/proposals')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            Review Proposals
          </button>
          <button
            onClick={() => router.push('/dashboard/mentor/teams')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            My Teams
          </button>
          <button
            onClick={() => router.push('/dashboard/mentor/approval')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            Team Approvals
          </button>
        </div>
      </div>
    </div>
  );
}