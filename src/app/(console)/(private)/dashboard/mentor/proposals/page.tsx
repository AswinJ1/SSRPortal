'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, FileText, MapPin, Calendar, Timer } from 'lucide-react';

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
    totalParticipants?: number;
  };
  author: {
    firstName: string;
    lastName: string;
    email: string;
    rollno?: string;
  };
  Team?: {
    id: string;
    projectTitle: string;
    teamNumber: string;
    batch: string;
    members?: Array<{
      name: string;
      email: string;
      rollNumber: string;
      role: string;
    }>;
  };
}

export default function MentorProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    async function fetchProposals() {
      try {
        const res = await fetch('/api/mentor/proposals');
        if (res.ok) {
          const data = await res.json();
          setProposals(data.data || []);
        } else {
          console.error('Failed to fetch proposals');
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProposals();
  }, []);

  const handleAction = async (id: number, action: "APPROVED" | "REJECTED") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/mentor/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: action, remarks }),
      });

      if (res.ok) {
        setProposals(props => 
          props.map(p => 
            p.id === id 
              ? { ...p, state: action, remarks, remark_updated_at: new Date().toISOString() }
              : p
          )
        );
        setSelectedProposal(null);
        setRemarks('');
      } else {
        console.error('Failed to update proposal');
        const errorData = await res.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
    } finally {
      setActionLoading(null);
    }
  };

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // If already in DD/MM/YYYY format, return as is
    if (dateString.includes('/')) {
      return dateString;
    }
    
    // Otherwise, assume ISO format and convert
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Proposals</h1>
      
      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
          <p className="text-gray-600">No students have submitted proposals yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-white border rounded-lg shadow-sm">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{proposal.title}</h3>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.state)}`}>
                        {getStatusIcon(proposal.state)}
                        <span className="ml-1 capitalize">{proposal.state === 'DRAFT' ? 'Pending' : proposal.state.toLowerCase()}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        Submitted: {new Date(proposal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {proposal.state === 'DRAFT' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedProposal(proposal)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Student & Team Info */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Student Information</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Name:</span> {proposal.author.firstName} {proposal.author.lastName}</p>
                      <p><span className="text-gray-500">Email:</span> {proposal.author.email}</p>
                      {proposal.author.rollno && (
                        <p><span className="text-gray-500">Roll No:</span> {proposal.author.rollno}</p>
                      )}
                    </div>
                  </div>
                  {proposal.Team && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Team Information</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Team:</span> {proposal.Team.teamNumber}</p>
                        <p><span className="text-gray-500">Project:</span> {proposal.Team.projectTitle}</p>
                        <p><span className="text-gray-500">Batch:</span> {proposal.Team.batch}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details - Show ALL form fields */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Project Category
                      </h4>
                      <p className="text-gray-600 break-words">{proposal.metadata?.category || 'Not specified'}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                      <p className="text-gray-600 text-sm break-words whitespace-pre-wrap">{proposal.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Content</h4>
                      <p className="text-gray-600 text-sm break-words whitespace-pre-wrap">{proposal.content.replace(/\n\n<!-- METADATA:.*? -->/, '')}</p>
                    </div>
                  </div>

                  {/* Location & Execution Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Location Details
                      </h4>
                      <div className="text-sm space-y-1">
                        <p className="break-words"><span className="text-gray-500">Mode:</span> {proposal.metadata?.locationMode || 'Not specified'}</p>
                        {proposal.metadata?.state && (
                          <p className="break-words"><span className="text-gray-500">State:</span> {proposal.metadata.state}</p>
                        )}
                        {proposal.metadata?.district && (
                          <p className="break-words"><span className="text-gray-500">District:</span> {proposal.metadata.district}</p>
                        )}
                        {proposal.metadata?.city && (
                          <p className="break-words"><span className="text-gray-500">City:</span> {proposal.metadata.city}</p>
                        )}
                        {proposal.metadata?.placeVisited && (
                          <p className="break-words"><span className="text-gray-500">Place Visited:</span> {proposal.metadata.placeVisited}</p>
                        )}
                         {proposal.metadata?.totalParticipants && (
                          <p className="break-words"><span className="text-gray-500">Total Participants:</span> {proposal.metadata.totalParticipants}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <Timer className="h-4 w-4 mr-2" />
                        Time & Schedule
                      </h4>
                      <div className="text-sm space-y-1">
                        {proposal.metadata?.travelTime && (
                          <p className="break-words"><span className="text-gray-500">Travel Time:</span> {proposal.metadata.travelTime}</p>
                        )}
                        {proposal.metadata?.executionTime && (
                          <p className="break-words"><span className="text-gray-500">Execution Time:</span> {proposal.metadata.executionTime}</p>
                        )}
                        {proposal.metadata?.completionDate && (
                          <p className="break-words"><span className="text-gray-500">Completion Date:</span> {formatDate(proposal.metadata.completionDate)}</p>
                        )}
                      </div>
                    </div>

                    {/* Resources */}
                    {(proposal.link || proposal.attachment) && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Uploaded Files & Resources</h4>
                        <div className="space-y-3">
                          {proposal.link && proposal.link.trim() && !proposal.link.startsWith('{') && (
                            <div className="flex items-center space-x-2">
                              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" />
                                <path d="M8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H9z" />
                              </svg>
                              <span className="text-gray-500">Google Drive (Photos & Videos):</span>
                              <a href={proposal.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View Google Drive Folder
                              </a>
                            </div>
                          )}
                          {proposal.attachment && proposal.attachment.trim() && (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-500">Uploaded Files:</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {proposal.attachment.split(',').filter(url => url.trim()).map((fileUrl, index) => {
                                  const fileName = fileUrl.split('/').pop() || 'file';
                                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                                  
                                  const getFileIcon = (ext: string) => {
                                    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (ext === 'pdf') {
                                      return (
                                        <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (['mp4', 'mov', 'avi'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                      );
                                    }
                                    if (['doc', 'docx'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (['ppt', 'pptx'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    return (
                                      <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    );
                                  };

                                  return (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                                      {getFileIcon(fileExtension)}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {fileName.replace(/^\d+-/, '')} {/* Remove timestamp prefix */}
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
                                <span className="text-gray-500">PPT Files:</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {proposal.ppt_attachment.split(',').filter(url => url.trim()).map((fileUrl, index) => {
                                  const fileName = fileUrl.split('/').pop() || 'file';
                                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                                  
                                  const getFileIcon = (ext: string) => {
                                    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (ext === 'pdf') {
                                      return (
                                        <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (['mp4', 'mov', 'avi'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                      );
                                    }
                                    if (['doc', 'docx'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (['ppt', 'pptx'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    return (
                                      <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    );
                                  };

                                  return (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                                      {getFileIcon(fileExtension)}
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
                                <span className="text-gray-500">Poster Files:</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {proposal.poster_attachment.split(',').filter(url => url.trim()).map((fileUrl, index) => {
                                  const fileName = fileUrl.split('/').pop() || 'file';
                                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                                  
                                  const getFileIcon = (ext: string) => {
                                    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (ext === 'pdf') {
                                      return (
                                        <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (['mp4', 'mov', 'avi'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                      );
                                    }
                                    if (['doc', 'docx'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    if (['ppt', 'pptx'].includes(ext)) {
                                      return (
                                        <svg className="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      );
                                    }
                                    return (
                                      <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    );
                                  };

                                  return (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                                      {getFileIcon(fileExtension)}
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
              </div>

              {/* Mentor Feedback */}
              {proposal.remarks && (
                <div className={`p-6 border-t ${proposal.state === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <h4 className="font-semibold text-gray-700 mb-2">Your Feedback</h4>
                  <p className="text-gray-600">{proposal.remarks}</p>
                  {proposal.remark_updated_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Updated: {new Date(proposal.remark_updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Review Proposal: {selectedProposal.title}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Provide feedback to the student..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleAction(selectedProposal.id, 'APPROVED')}
                disabled={actionLoading === selectedProposal.id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === selectedProposal.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction(selectedProposal.id, 'REJECTED')}
                disabled={actionLoading === selectedProposal.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === selectedProposal.id ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setRemarks('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}