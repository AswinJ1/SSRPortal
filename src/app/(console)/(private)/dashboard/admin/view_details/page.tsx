'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Mail, 
  User, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Award,
  Link as LinkIcon,
  Paperclip,
  Star
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  state: string;
  link: string | null;
  attachment: string | null;
  pptAttachment: string | null;
  posterAttachment: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IndividualEvaluation {
  id: string;
  memberName: string;
  memberEmail: string;
  // Mentor's individual assessment (3 marks)
  individualScore: number;
  // External evaluator criteria (2+2+2=6 marks)
  learningContribution: number;
  presentationSkill: number;
  contributionToProject: number;
  externalEvaluatorMarks: number; // Sum of above 3 = 6 marks
  totalIndividualMarks: number; // 20 marks total
  teamMember: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Evaluation {
  id: string;
  status: string;
  // Group marks (11 marks)
  posterMarks: number;
  videoMarks: number;
  reportMarks: number;
  pptMarks: number;
  groupScore: number;
  externalEvaluatorName: string | null;
  externalEvaluatorEmail: string | null;
  individualEvaluations: IndividualEvaluation[];
  remarks: string | null;
  evaluatedAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  teamNumber: string;
  projectTitle: string;
  status: string;
  mentor: {
    id: string;
    name: string;
    email: string;
  } | null;
  lead: {
    name: string;
    email: string;
  } | null;
  members: TeamMember[];
  project: {
    id: string;
    name: string;
    description: string;
    theme: {
      name: string;
    };
    code: string;
  } | null;
  proposals: Proposal[];
  evaluation: Evaluation | null;
}

const ViewDetailsPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    filterTeams();
  }, [searchTerm, statusFilter, teams]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/teams');
      
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data);
      setFilteredTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTeams = () => {
    let filtered = teams;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(team => 
        team.teamNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.mentor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(team => team.status === statusFilter);
    }

    setFilteredTeams(filtered);
  };

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      DRAFT: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FileText },
      SUBMITTED: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateMentorMarks = (evaluation: Evaluation, individualScore: number) => {
    return evaluation.groupScore + individualScore;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchTeams}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Details</h1>
          <p className="mt-2 text-gray-600">
            View comprehensive information about all teams, members, proposals, and evaluations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Evaluated</p>
                <p className="text-2xl font-bold text-green-600">
                  {teams.filter(t => t.evaluation?.status === 'SUBMITTED').length}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Proposals</p>
                <p className="text-2xl font-bold text-purple-600">
                  {teams.filter(t => t.proposals && t.proposals.length > 0).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teams.reduce((sum, team) => sum + team.members.length, 0)}
                </p>
              </div>
              <User className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by team number, project, mentor, or lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-4">
          {filteredTeams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No teams found matching your criteria</p>
            </div>
          ) : (
            filteredTeams.map((team) => {
              const isExpanded = expandedTeams.has(team.id);
              
              return (
                <div key={team.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Team Header */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleTeamExpansion(team.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {team.teamNumber || 'No Team Number'}
                          </h3>
                          {getStatusBadge(team.status)}
                          {team.evaluation && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Award className="w-3 h-3 mr-1" />
                              Evaluated
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">
                          {team.projectTitle || 'No Project Title'}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {team.members.length} members
                          </div>
                          {team.mentor && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              Mentor: {team.mentor.name}
                            </div>
                          )}
                          {team.proposals && team.proposals.length > 0 && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {team.proposals.length} proposal{team.proposals.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="grid grid-cols-1 gap-6">
                        {/* Mentor & Lead Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <User className="h-5 w-5 mr-2 text-blue-600" />
                              Mentor & Lead
                            </h4>
                            <div className="space-y-3 bg-white rounded-lg p-4">
                              {team.mentor ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Mentor</p>
                                  <p className="text-gray-900">{team.mentor.name}</p>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {team.mentor.email}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No mentor assigned</p>
                              )}
                              
                              {team.lead && (
                                <div className="pt-3 border-t">
                                  <p className="text-sm font-medium text-gray-700">Team Lead</p>
                                  <p className="text-gray-900">{team.lead.name}</p>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {team.lead.email}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Project Info */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-green-600" />
                              Project Information
                            </h4>
                            <div className="bg-white rounded-lg p-4">
                              {team.project ? (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Project Name</p>
                                    <p className="text-gray-900">{team.project.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Code</p>
                                    <p className="text-gray-900">{team.project.code}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Theme</p>
                                    <p className="text-gray-900">{team.project.theme?.name || 'N/A'}</p>
                                  </div>
                                  {team.project.description && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">Description</p>
                                      <p className="text-sm text-gray-600">{team.project.description}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No project assigned</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Team Members */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Users className="h-5 w-5 mr-2 text-purple-600" />
                            Team Members ({team.members.length})
                          </h4>
                          <div className="bg-white rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {team.members.length > 0 ? (
                                  team.members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {member.name}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {member.email}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                          {member.role}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                                      No members in this team
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Proposals */}
                        {team.proposals && team.proposals.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                              Proposals ({team.proposals.length})
                            </h4>
                            <div className="space-y-4">
                              {team.proposals.map((proposal) => (
                                <div key={proposal.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{proposal.title}</h5>
                                      <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                                    </div>
                                    {getStatusBadge(proposal.state)}
                                  </div>
                                  
                                  <div className="mt-3 space-y-2">
                                    {proposal.link && (
                                      <div className="flex items-center text-sm text-blue-600">
                                        <LinkIcon className="h-4 w-4 mr-2" />
                                        <a href={proposal.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                          Video Link
                                        </a>
                                      </div>
                                    )}
                                    
                                    <div className="flex flex-wrap gap-3 text-sm">
                                      {proposal.attachment && (
                                        <div className="flex items-center text-gray-600">
                                          <Paperclip className="h-4 w-4 mr-1" />
                                          Report Attached
                                        </div>
                                      )}
                                      {proposal.pptAttachment && (
                                        <div className="flex items-center text-gray-600">
                                          <Paperclip className="h-4 w-4 mr-1" />
                                          PPT Attached
                                        </div>
                                      )}
                                      {proposal.posterAttachment && (
                                        <div className="flex items-center text-gray-600">
                                          <Paperclip className="h-4 w-4 mr-1" />
                                          Poster Attached
                                        </div>
                                      )}
                                    </div>

                                    {proposal.remarks && (
                                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                        <p className="text-xs font-medium text-yellow-800">Remarks:</p>
                                        <p className="text-sm text-yellow-900">{proposal.remarks}</p>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                      <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Created: {formatDate(proposal.createdAt)}
                                      </div>
                                      <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Updated: {formatDate(proposal.updatedAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Evaluation */}
                        {team.evaluation && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Award className="h-5 w-5 mr-2 text-yellow-600" />
                              Evaluation Results
                            </h4>
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                              {/* Status and External Evaluator */}
                              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                                {getStatusBadge(team.evaluation.status)}
                                {team.evaluation.externalEvaluatorName && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">External Evaluator:</span> {team.evaluation.externalEvaluatorName}
                                    {team.evaluation.externalEvaluatorEmail && (
                                      <span className="text-gray-500 ml-2">({team.evaluation.externalEvaluatorEmail})</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Marking Structure Info */}
                              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2">INFO</span>
                                  Marking Structure
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="bg-blue-100 rounded p-2">
                                    <p className="font-semibold text-blue-900">Group: 11 marks</p>
                                    <p className="text-xs text-blue-800">Same for all members</p>
                                  </div>
                                  <div className="bg-purple-100 rounded p-2">
                                    <p className="font-semibold text-purple-900">Mentor: 14 marks</p>
                                    <p className="text-xs text-purple-800">Group (11) + Individual (3)</p>
                                  </div>
                                  <div className="bg-green-100 rounded p-2">
                                    <p className="font-semibold text-green-900">External: 6 marks</p>
                                    <p className="text-xs text-green-800">3 criteria × 2 marks</p>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-blue-300 text-center">
                                  <p className="font-bold text-gray-900">Total: <span className="text-purple-600">20 marks</span></p>
                                </div>
                              </div>

                              {/* Group Marks (11 marks) */}
                              <div className="mb-6">
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2">GROUP</span>
                                  Group Marks (11 marks - Same for all members)
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div className="bg-blue-50 p-3 rounded border-2 border-blue-200">
                                    <p className="text-xs text-blue-600 font-medium">Poster</p>
                                    <p className="text-lg font-bold text-blue-900">{team.evaluation.posterMarks}/2</p>
                                  </div>
                                  <div className="bg-green-50 p-3 rounded border-2 border-green-200">
                                    <p className="text-xs text-green-600 font-medium">Video</p>
                                    <p className="text-lg font-bold text-green-900">{team.evaluation.videoMarks}/3</p>
                                  </div>
                                  <div className="bg-purple-50 p-3 rounded border-2 border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium">Report</p>
                                    <p className="text-lg font-bold text-purple-900">{team.evaluation.reportMarks}/3</p>
                                  </div>
                                  <div className="bg-orange-50 p-3 rounded border-2 border-orange-200">
                                    <p className="text-xs text-orange-600 font-medium">PPT</p>
                                    <p className="text-lg font-bold text-orange-900">{team.evaluation.pptMarks}/3</p>
                                  </div>
                                  <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-200">
                                    <p className="text-xs text-yellow-600 font-medium">Total</p>
                                    <p className="text-lg font-bold text-yellow-900">{team.evaluation.groupScore}/11</p>
                                  </div>
                                </div>
                              </div>

                              {/* Individual Marks */}
                              {team.evaluation.individualEvaluations && team.evaluation.individualEvaluations.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-3">Individual Evaluation Details</h5>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">
                                            Member
                                          </th>
                                          <th colSpan={2} className="px-3 py-2 text-center text-xs font-medium text-blue-700 uppercase bg-blue-50 border-r">
                                            Mentor (14 marks)
                                          </th>
                                          <th colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-green-700 uppercase bg-green-50 border-r">
                                            External Evaluator (6 marks)
                                          </th>
                                          <th rowSpan={2} className="px-3 py-3 text-center text-xs font-medium text-purple-700 uppercase bg-purple-50">
                                            Total<br/>(20)
                                          </th>
                                        </tr>
                                        <tr>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
                                            Individual<br/>(3)
                                          </th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 border-r">
                                            Total<br/>(14)
                                          </th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
                                            Philosophy<br/>(2)
                                          </th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
                                            Presentation<br/>(2)
                                          </th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
                                            Learnings<br/>(2)
                                          </th>
                                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50 border-r">
                                            Total<br/>(6)
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {team.evaluation.individualEvaluations.map((evalItem) => {
                                          const mentorTotal = calculateMentorMarks(team.evaluation!, evalItem.individualScore);
                                          
                                          return (
                                            <tr key={evalItem.id} className="hover:bg-gray-50">
                                              <td className="px-3 py-3 text-sm border-r">
                                                <div>
                                                  <p className="font-medium text-gray-900">{evalItem.memberName}</p>
                                                  <p className="text-xs text-gray-500">{evalItem.teamMember.role}</p>
                                                </div>
                                              </td>
                                              {/* Mentor Marks */}
                                              <td className="px-3 py-3 text-center text-sm bg-blue-50">
                                                <span className="font-semibold text-blue-900">{evalItem.individualScore}</span>
                                              </td>
                                              <td className="px-3 py-3 text-center text-sm bg-blue-50 border-r">
                                                <span className="font-bold text-blue-900">{mentorTotal}</span>
                                                <p className="text-xs text-blue-600">({team.evaluation.groupScore} + {evalItem.individualScore})</p>
                                              </td>
                                              {/* External Evaluator Marks */}
                                              <td className="px-3 py-3 text-center text-sm bg-green-50 text-green-900">
                                                {evalItem.learningContribution}
                                              </td>
                                              <td className="px-3 py-3 text-center text-sm bg-green-50 text-green-900">
                                                {evalItem.presentationSkill}
                                              </td>
                                              <td className="px-3 py-3 text-center text-sm bg-green-50 text-green-900">
                                                {evalItem.contributionToProject}
                                              </td>
                                              <td className="px-3 py-3 text-center text-sm bg-green-50 border-r">
                                                <span className="font-bold text-green-900">{evalItem.externalEvaluatorMarks}</span>
                                              </td>
                                              {/* Total */}
                                              <td className="px-3 py-3 text-center text-sm bg-purple-50">
                                                <span className="text-xl font-bold text-purple-900">{evalItem.totalIndividualMarks}</span>
                                                <p className="text-xs text-purple-600">({mentorTotal} + {evalItem.externalEvaluatorMarks})</p>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Evaluation Remarks */}
                              {team.evaluation.remarks && (
                                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Evaluation Remarks:</p>
                                  <p className="text-sm text-gray-900">{team.evaluation.remarks}</p>
                                </div>
                              )}

                              {/* Evaluation Dates */}
                              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Evaluated: {formatDate(team.evaluation.evaluatedAt)}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Updated: {formatDate(team.evaluation.updatedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsPage;