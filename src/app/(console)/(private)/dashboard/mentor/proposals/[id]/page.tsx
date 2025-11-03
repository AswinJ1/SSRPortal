'use client';

import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation';

interface ProposalAuthor {
  firstName: string;
  lastName: string;
  email: string;
  rollno: string;
}

interface TeamMember {
  name: string;
  email: string;
  rollNumber: string;
  role: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    rollno: string;
  };
}

interface Team {
  id: string;
  projectTitle: string;
  teamNumber: string;
  batch: string;
  members: TeamMember[];
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  content: string;
  attachment?: string;
  ppt_attachment?: string;
  poster_attachment?: string;
  link?: string;
  state: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  remark_updated_at?: string;
  metadata?: {
    category?: string;
    locationMode?: string;
    state?: string;
    district?: string;
    city?: string;
    placeVisited?: string;
    travelTime?: string;
    executionTime?: string;
    completionDate?: string;
    totalParticipants?: string;
  };
  author: ProposalAuthor;
  Team: Team;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  useEffect(() => {
    fetchProposal();
  }, [params.id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mentor/proposals/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        if (response.status === 404) {
          router.push('/dashboard/mentor/proposals');
          return;
        }
        throw new Error('Failed to fetch proposal');
      }

      const data = await response.json();
      setProposal(data.data);
      setRemarks(data.data.remarks || '');
    } catch (error) {
      console.error('Error fetching proposal:', error);
      alert('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    setActionType(action);
    setShowRemarkModal(true);
  };

  const confirmAction = async () => {
    if (!actionType) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/mentor/proposals/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: actionType, remarks }),
      });

      if (res.ok) {
        alert(`Proposal ${actionType.toLowerCase()} successfully!`);
        setShowRemarkModal(false);
        await fetchProposal();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update proposal');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      alert('Failed to update proposal');
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-6">
        <p>Proposal not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team details
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Team {proposal.Team.teamNumber}</span>
              <span>•</span>
              <span>{proposal.Team.batch}</span>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(proposal.state)}`}>
            {getStatusIcon(proposal.state)}
            <span className="font-medium">{proposal.state}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Proposal Details</h2>
            
            {/* Metadata Section */}
            {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold text-gray-700 mb-3">Project Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposal.metadata.category && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Category</span>
                      <p className="font-medium">{proposal.metadata.category}</p>
                    </div>
                  )}
                  {proposal.metadata.locationMode && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Location Mode</span>
                      <p className="font-medium">{proposal.metadata.locationMode}</p>
                    </div>
                  )}
                  {proposal.metadata.state && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">State</span>
                      <p className="font-medium">{proposal.metadata.state}</p>
                    </div>
                  )}
                  {proposal.metadata.district && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">District</span>
                      <p className="font-medium">{proposal.metadata.district}</p>
                    </div>
                  )}
                  {proposal.metadata.city && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">City</span>
                      <p className="font-medium">{proposal.metadata.city}</p>
                    </div>
                  )}
                  {proposal.metadata.placeVisited && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Place Visited</span>
                      <p className="font-medium">{proposal.metadata.placeVisited}</p>
                    </div>
                  )}
                  {proposal.metadata.totalParticipants && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Total Participants</span>
                      <p className="font-medium">{proposal.metadata.totalParticipants}</p>
                    </div>
                  )}
                  {proposal.metadata.travelTime && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Travel Time</span>
                      <p className="font-medium">{proposal.metadata.travelTime} hours</p>
                    </div>
                  )}
                  {proposal.metadata.executionTime && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Execution Time</span>
                      <p className="font-medium">{proposal.metadata.executionTime} hours</p>
                    </div>
                  )}
                  {proposal.metadata.completionDate && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-500 block">Completion Date</span>
                      <p className="font-medium">{new Date(proposal.metadata.completionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap break-words">{proposal.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Content</h3>
                <p className="text-gray-600 whitespace-pre-wrap break-words">
                  {proposal.content.replace(/\n\n<!-- METADATA:.*? -->/, '')}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {(proposal.link || proposal.attachment || proposal.ppt_attachment || proposal.poster_attachment) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-700 mb-3">Attachments & Links</h3>
                <div className="space-y-2">
                  {proposal.link && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      <a href={proposal.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        Project Link
                      </a>
                    </div>
                  )}
                  {proposal.attachment && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      <a href={proposal.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Attachment
                      </a>
                    </div>
                  )}
                  {proposal.ppt_attachment && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <a href={proposal.ppt_attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View PPT
                      </a>
                    </div>
                  )}
                  {proposal.poster_attachment && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <a href={proposal.poster_attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Poster
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Remarks */}
          {proposal.remarks && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Current Feedback</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-700 whitespace-pre-wrap">{proposal.remarks}</p>
                {proposal.remark_updated_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date(proposal.remark_updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Author</h2>
            </div>
            <div>
              <p className="font-medium">{proposal.author.firstName} {proposal.author.lastName}</p>
              <p className="text-sm text-gray-600">{proposal.author.email}</p>
              <p className="text-sm text-gray-600">Roll No: {proposal.author.rollno}</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Team Members</h2>
            </div>
            <div className="space-y-3">
              {proposal.Team.members.map((member, index) => (
                <div key={index} className="pb-3 border-b last:border-0">
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {proposal.state === 'PENDING' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('APPROVED')}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Approve Proposal</span>
                </button>
                <button
                  onClick={() => handleAction('REJECTED')}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-5 w-5" />
                  <span>Request Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">{new Date(proposal.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(proposal.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {actionType === 'APPROVED' ? 'Approve Proposal' : 'Request Changes'}
            </h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your feedback (optional)"
              className="w-full px-3 py-2 border rounded-lg h-32 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRemarkModal(false);
                  setActionType(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  actionType === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}