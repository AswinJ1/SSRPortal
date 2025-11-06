'use client';
import { useEffect, useState } from 'react';
import { FileText, Edit3, Clock, CheckCircle, XCircle, MapPin, Timer } from 'lucide-react';
import Link from 'next/link';
import { formatDDMMYYYY,formatTimeInHours } from '@/utils/dateFormatter';

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
  author: { 
    firstName: string; 
    lastName: string;
    email: string;
  };
  Team?: {
    id: string;
    projectTitle: string;
    teamNumber: string;
    batch: string;
    mentor?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}



export default function StudentProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProposals() {
      try {
        const res = await fetch('/api/student/proposals');
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const proposalsList = data.data || data;
        
        // Parse metadata from content for each proposal
        const parsedProposals = (Array.isArray(proposalsList) ? proposalsList : []).map((proposal: Proposal) => {
          // Try to extract metadata from content
          const metadataMatch = proposal.content.match(/<!-- METADATA:(.*?) -->/);
          if (metadataMatch) {
            try {
              const parsedMetadata = JSON.parse(metadataMatch[1]);
              return {
                ...proposal,
                metadata: parsedMetadata
              };
            } catch (e) {
              console.error('Failed to parse metadata:', e);
            }
          }
          return proposal;
        });
        
        setProposals(parsedProposals);
      } catch (err) {
        console.error('Error fetching proposals', err);
        setError('Failed to load proposals. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProposals();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-600">
      <p>{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Retry
      </button>
    </div>
  );

  // If no proposals exist, show option to create one
  if (proposals.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">My Proposals</h1>
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
          <p className="text-gray-600 mb-6">You haven't submitted any proposals yet. Create your first proposal to get started.</p>
          <Link 
            href="/dashboard/student/proposals/form"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Proposal
          </Link>
        </div>
      </div>
    );
  }

  const proposal = proposals[0]; // Student should only have one proposal
  
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'DRAFT': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'APPROVED': return <CheckCircle className="h-5 w-5" />;
      case 'REJECTED': return <XCircle className="h-5 w-5" />;
      case 'DRAFT': return <Clock className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Proposal</h1>
        {proposal.state === 'REJECTED' && (
          <Link 
            href="/dashboard/student/proposals/form"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Proposal
          </Link>
        )}
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        {/* Header with status */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{proposal.title}</h2>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.state)}`}>
                  {getStatusIcon(proposal.state)}
                  <span className="ml-1 capitalize">{proposal.state === 'DRAFT' ? 'Pending' : proposal.state.toLowerCase()}</span>
                </span>
                <span className="ml-4 text-sm text-gray-500">
                  Submitted: {formatDDMMYYYY(proposal.created_at)}
                </span>
                {proposal.updated_at !== proposal.created_at && (
                  <span className="ml-4 text-sm text-gray-500">
                    Updated: {formatDDMMYYYY(proposal.updated_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Information */}
        {proposal.Team && (
          <div className="p-6 bg-blue-50 border-b">
            <h3 className="font-semibold text-blue-800 mb-2">Team Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Team Number:</span>
                <p className="font-medium">{proposal.Team.teamNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Project Title:</span>
                <p className="font-medium">{proposal.Team.projectTitle}</p>
              </div>
              <div>
                <span className="text-gray-500">Batch:</span>
                <p className="font-medium">{proposal.Team.batch}</p>
              </div>
              {proposal.Team.mentor && (
                <div className="md:col-span-3">
                  <span className="text-gray-500">Mentor:</span>
                  <p className="font-medium">
                    {proposal.Team.mentor.firstName} {proposal.Team.mentor.lastName} ({proposal.Team.mentor.email})
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proposal Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Metadata Section */}
            {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Project Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {proposal.metadata.category && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Category:</span>
                        <p className="font-medium break-words">{proposal.metadata.category}</p>
                      </div>
                    )}
                    {proposal.metadata.totalParticipants && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Total Participants:</span>
                        <p className="font-medium">{proposal.metadata.totalParticipants}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Location Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {proposal.metadata.locationMode && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Mode:</span>
                        <p className="font-medium">{proposal.metadata.locationMode}</p>
                      </div>
                    )}
                    {proposal.metadata.state && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">State:</span>
                        <p className="font-medium break-words">{proposal.metadata.state}</p>
                      </div>
                    )}
                    {proposal.metadata.district && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">District:</span>
                        <p className="font-medium break-words">{proposal.metadata.district}</p>
                      </div>
                    )}
                    {proposal.metadata.city && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">City:</span>
                        <p className="font-medium break-words">{proposal.metadata.city}</p>
                      </div>
                    )}
                    {proposal.metadata.placeVisited && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Place Visited:</span>
                        <p className="font-medium break-words">{proposal.metadata.placeVisited}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Timeline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {proposal.metadata.travelTime && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Travel Time:</span>
                        <p className="font-medium">{formatTimeInHours(proposal.metadata.travelTime)}</p>
                      </div>
                    )}
                    {proposal.metadata.executionTime && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Execution Time:</span>
                        <p className="font-medium">{formatTimeInHours(proposal.metadata.executionTime)}</p>
                      </div>
                    )}
                    {proposal.metadata.completionDate && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Completion Date:</span>
                   <p className="font-medium">{formatDDMMYYYY(proposal.metadata.completionDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 whitespace-pre-wrap break-words">{proposal.description}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Content</h4>
              <p className="text-gray-600 whitespace-pre-wrap break-words">{proposal.content.replace(/\n\n<!-- METADATA:.*? -->/, '')}</p>
            </div>

            {/* Links and attachments */}
            {(proposal.link || proposal.attachment || proposal.ppt_attachment || proposal.poster_attachment) && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Uploaded Files & Resources</h4>
                <div className="space-y-3">
                  {proposal.link && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      <a href={proposal.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        Google Drive Link
                      </a>
                    </div>
                  )}
                  {proposal.attachment && proposal.attachment.trim() && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">Supporting Files:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {proposal.attachment.split(',').filter(url => url.trim()).map((fileUrl, index) => {
                          const fileName = fileUrl.split('/').pop() || 'file';
                          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                          
                          return (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {fileName.replace(/^\d+-/, '')}
                                </p>
                                <p className="text-xs text-gray-500 uppercase">
                                  {fileExtension} file
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View
                                </a>
                                <a
                                  href={fileUrl}
                                  download
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {proposal.ppt_attachment && proposal.ppt_attachment.trim() && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">PPT Files:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {proposal.ppt_attachment.split(',').filter(url => url.trim()).map((fileUrl, index) => {
                          const fileName = fileUrl.split('/').pop() || 'file';
                          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                          
                          return (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {fileName.replace(/^\d+-/, '')}
                                </p>
                                <p className="text-xs text-gray-500 uppercase">
                                  {fileExtension} file
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View
                                </a>
                                <a
                                  href={fileUrl}
                                  download
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {proposal.poster_attachment && proposal.poster_attachment.trim() && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-700">Poster Files:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {proposal.poster_attachment.split(',').filter(url => url.trim()).map((fileUrl, index) => {
                          const fileName = fileUrl.split('/').pop() || 'file';
                          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                          
                          return (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {fileName.replace(/^\d+-/, '')}
                                </p>
                                <p className="text-xs text-gray-500 uppercase">
                                  {fileExtension} file
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View
                                </a>
                                <a
                                  href={fileUrl}
                                  download
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mentor Feedback */}
        {(proposal.remarks || proposal.state !== 'DRAFT') && (
          <div className={`p-6 border-t ${proposal.state === 'APPROVED' ? 'bg-green-50' : proposal.state === 'REJECTED' ? 'bg-red-50' : 'bg-gray-50'}`}>
            <h4 className="font-semibold text-gray-700 mb-2">Mentor Feedback</h4>
            <p className="text-gray-600">{proposal.remarks || 'No feedback provided yet.'}</p>
            {proposal.remark_updated_at && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {formatDDMMYYYY(proposal.remark_updated_at)}
              </p>
            )}
            {proposal.state === 'REJECTED' && (
              <div className="mt-4">
                <p className="text-sm text-red-700 font-medium">
                  Your proposal has been rejected. Please review the feedback above and edit your proposal accordingly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}