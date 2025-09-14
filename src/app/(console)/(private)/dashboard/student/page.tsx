'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ProjectStats {
  teamName: string;
  projectTitle: string;
  status: string;
  completedMilestones: number;
  batch: string; // Add batch information
  totalMilestones: number;
  nextDeadline: string;
  mentorName: string;
  lastUpdate: string;
  members: Array<{
    name: string;
    email: string;
    rollNumber: string;
    isLeader: boolean;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
}

export default function StudentDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjectStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) return;

      console.log('Fetching stats with session:', session);
      const response = await fetch(`/api/teams/user/${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project stats');
      }
      
      const teamData = await response.json();
      
      if (teamData) {
        // Transform the team data to match your ProjectStats interface
        const transformedStats = {
          teamName: teamData.teamNumber || `Team ${teamData.teamNumber}`,
          projectTitle: teamData.projectTitle,
          status: teamData.status,
          completedMilestones: 0,
          totalMilestones: 10,
          nextDeadline: 'TBD',
          mentorName: teamData.mentor ? 
            `${teamData.mentor.firstName} ${teamData.mentor.lastName}` : 
            'Not assigned',
          lastUpdate: 'Recently',
          members: teamData.members, // This should already be correctly formatted
          recentActivities: [],
          batch: teamData.batch // Add batch information
        };
        
        setProjectStats(transformedStats);
      }
    } catch (error) {
      console.error('Error fetching project stats:', error);
      setError('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchProjectStats();
    }
  }, [session]);

  // Refresh data when the component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user) {
        fetchProjectStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session]);

  // Show loading state while session is loading
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!session?.user) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">Please log in to view your dashboard.</p>
      </div>
    );
  }

  // Show error message if there was an error
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchProjectStats}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Try Again
          </button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Having trouble loading your dashboard?</h2>
          <div className="space-x-4">
            <Link
              href="/dashboard/student/team"
              className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
            >
              Go to Team Management
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {session.user.firstName || session.user.email}!</h1>
        <p className="text-gray-600">Here's an overview of your project progress</p>
      </div>

      {projectStats ? (
        <>
          {/* Project Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Team</h3>
              <p className="text-2xl font-bold text-primary">{projectStats.teamName}</p>
              <p className="text-sm text-gray-500 mt-2">{projectStats.projectTitle}</p>
              <p className="text-xs text-gray-400 mt-1">Batch: {projectStats.batch}</p> {/* Add this line */}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Project Status</h3>
              <p className="text-2xl font-bold text-primary">{projectStats.status}</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2" 
                  style={{ width: `${(projectStats.completedMilestones / projectStats.totalMilestones) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Next Deadline</h3>
              <p className="text-2xl font-bold text-primary">{projectStats.nextDeadline}</p>
              <p className="text-sm text-gray-500 mt-2">Mentor: {projectStats.mentorName}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Last Update</h3>
              <p className="text-2xl font-bold text-primary">{projectStats.lastUpdate}</p>
              <p className="text-sm text-gray-500 mt-2">Regular updates recommended</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectStats.members && projectStats.members.length > 0 ? (
                projectStats.members.map((member, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-sm text-gray-500">{member.rollNumber}</p>
                    {member.isLeader && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary text-white rounded">
                        Team Leader
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="col-span-3 text-center text-gray-500">No team members found</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link 
              href="/dashboard/student/team"
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-lg font-semibold">Team Management</h3>
                <p className="text-gray-600">View and manage your team</p>
              </div>
            </Link>

            <Link 
              href="/dashboard/student/proposals"
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-lg font-semibold">Project Proposal</h3>
                <p className="text-gray-600">Submit or update proposal</p>
              </div>
            </Link>

            <Link 
              href="/dashboard/student/project"
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-lg font-semibold">Project Details</h3>
                <p className="text-gray-600">Update project progress</p>
              </div>
            </Link>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {projectStats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary">📝</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-gray-600">{activity.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No Project Data Available</h2>
          <p className="text-gray-600 mb-6">Start by creating your team and submitting a project proposal.</p>
          <div className="space-x-4">
            <Link 
              href="/dashboard/student/team"
              className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
            >
              Create Team
            </Link>
            <Link 
              href="/dashboard/student/proposals"
              className="inline-block bg-white text-primary px-6 py-2 rounded-md border border-primary hover:bg-gray-50 transition-colors"
            >
              Submit Proposal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}