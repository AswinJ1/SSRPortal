'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ITeam, TEAM_STATUS } from '@/app/(console)/types';
import Link from 'next/link';
import {
  Loader2,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 2;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchTeamsWithProposals = async () => {
      try {
        const response = await fetch('/api/mentor/teams');
        if (response.ok) {
          const teamsData = await response.json();
          const teamsWithProposals = await Promise.all(
            teamsData.map(async (team: ITeam) => {
              try {
                const proposalsRes = await fetch(`/api/mentor/teams/${team.id}/proposals`);
                if (proposalsRes.ok) {
                  const proposals = await proposalsRes.json();
                  return { ...team, proposals };
                }
              } catch (error) {
                console.error(`Error fetching proposals for team ${team.id}:`, error);
              }
              return team;
            })
          );
          setTeams(teamsWithProposals);
        }
      } catch (error) {
        console.error('Error fetching mentor teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsWithProposals();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!session?.user) return null;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEW: 'bg-blue-100 text-blue-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Get mentor name from firstName or fallback
  const mentorName = session.user?.firstName || 'Mentor';

  // Pagination logic
  const totalPages = Math.ceil(teams.length / teamsPerPage);
  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = teams.slice(indexOfFirstTeam, indexOfLastTeam);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-primary" />
            Mentor Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {mentorName} 👋
          </p>
        </div>
      </div>

      {/* Teams Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Your Teams
          </h2>
          {teams.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstTeam + 1}-{Math.min(indexOfLastTeam, teams.length)} of {teams.length} teams
            </p>
          )}
        </div>

        {teams.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {currentTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6"
                >
                  {/* Team Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Team {team.teamNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {team.stats.members} members • {team.stats.proposals} proposals
                      </p>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700 font-medium min-w-[120px]">
                        Team Status:
                      </p>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          team.stats.status
                        )}`}
                      >
                        {team.stats.status}
                      </span>
                    </div>

                    {team.proposals && team.proposals.length > 0 && (
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-gray-700 font-medium min-w-[120px]">
                          Proposal Status:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {team.proposals.map((proposal) => (
                            <span
                              key={proposal.id}
                              className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                                proposal.state
                              )}`}
                            >
                              {proposal.state}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      href={`/dashboard/mentor/teams/${team.id}`}
                      className="flex-1 text-center py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition"
                    >
                      View Team
                    </Link>
                    {team.stats.proposals > 0 && team.proposals?.length > 0 && (
                      <Link
                        href={`/dashboard/mentor/proposals/${team.proposals[0].id}`}
                        className="flex-1 text-center py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition"
                      >
                        Approve Proposal
                      </Link>
                    )}
                   
                    {team.stats.status === TEAM_STATUS.APPROVED && (
                      <Link
                        href={`/dashboard/mentor/teams/evaluate/${team.id}`}
                        className="flex-1 text-center py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition"
                      >
                        Evaluate Team
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No teams assigned yet.</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" /> Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Proposal List View', path: '/dashboard/mentor/proposals', icon: FileText },
            { title: 'Teams List View', path: '/dashboard/mentor/teams', icon: Users },
            { title: 'Team Approvals List View', path: '/dashboard/mentor/approval', icon: Clock },
          ].map(({ title, path, icon: Icon }) => (
            <button
              key={title}
              onClick={() => router.push(path)}
              className="p-5 bg-white border border-gray-100 rounded-xl flex items-center gap-3 hover:shadow-md transition-all duration-200"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-medium text-gray-800">{title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
