'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Edit, CheckCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  teamMemberId: string;
  name: string;
  email: string;
  rollNumber: string;
}

interface IndividualMarks {
  teamMemberId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  individualScore: number;
  learningContribution: number;
  presentationSkill: number;
  contributionToProject: number;
}

interface EvaluationFormProps {
  teamId: string;
}

const EvaluateForm: React.FC<EvaluationFormProps> = ({ teamId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ✅ ADD: Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState<{
    posterMarks: number;
    videoMarks: number;
    reportMarks: number;
    pptMarks: number;
    externalEvaluatorName: string;
    externalEvaluatorEmail: string;
    remarks: string;
    individualMarks: Map<string, IndividualMarks>;
  } | null>(null);

  // Group marks
  const [posterMarks, setPosterMarks] = useState(0);
  const [videoMarks, setVideoMarks] = useState(0);
  const [reportMarks, setReportMarks] = useState(0);
  const [pptMarks, setPptMarks] = useState(0);

  // External evaluator
  const [externalEvaluatorName, setExternalEvaluatorName] = useState('');
  const [externalEvaluatorEmail, setExternalEvaluatorEmail] = useState('');
  const [remarks, setRemarks] = useState('');

  // Team data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamNumber, setTeamNumber] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [batch, setBatch] = useState('');

  // Individual marks for each member
  const [individualMarks, setIndividualMarks] = useState<Map<string, IndividualMarks>>(new Map());

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setFetching(true);
      setError(null);
      
      const response = await fetch(`/api/mentor/teams/evaluate?teamId=${teamId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch team data');
      }

      if (result.data.id) {
        setIsUpdate(true);
        loadExistingEvaluation(result.data);
        
        if (result.data.status === 'SUBMITTED') {
          setIsSubmitted(true);
          setShowForm(false);
        } else {
          setShowForm(true);
        }
      } else {
        loadTeamData(result.data.team);
        setShowForm(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team data');
      console.error('Error fetching team data:', err);
    } finally {
      setFetching(false);
    }
  };

  const loadExistingEvaluation = (evaluation: any) => {
    setPosterMarks(evaluation.posterMarks);
    setVideoMarks(evaluation.videoMarks);
    setReportMarks(evaluation.reportMarks);
    setPptMarks(evaluation.pptMarks);
    setExternalEvaluatorName(evaluation.externalEvaluatorName || '');
    setExternalEvaluatorEmail(evaluation.externalEvaluatorEmail || '');
    setRemarks(evaluation.remarks || '');

    const marksMap = new Map<string, IndividualMarks>();
    const members: TeamMember[] = [];

    evaluation.individualEvaluations.forEach((ie: any) => {
      marksMap.set(ie.teamMemberId, {
        teamMemberId: ie.teamMemberId,
        memberId: ie.memberId,
        memberName: ie.memberName,
        memberEmail: ie.memberEmail,
        individualScore: ie.individualScore,
        learningContribution: ie.learningContribution,
        presentationSkill: ie.presentationSkill,
        contributionToProject: ie.contributionToProject
      });
      
      members.push({
        id: ie.memberId,
        teamMemberId: ie.teamMemberId,
        name: ie.memberName,
        email: ie.memberEmail,
        rollNumber: ''
      });
    });

    setTeamMembers(members);
    setIndividualMarks(marksMap);

    // ✅ SAVE ORIGINAL VALUES
    saveOriginalValues(
      evaluation.posterMarks,
      evaluation.videoMarks,
      evaluation.reportMarks,
      evaluation.pptMarks,
      evaluation.externalEvaluatorName || '',
      evaluation.externalEvaluatorEmail || '',
      evaluation.remarks || '',
      marksMap
    );
  };

  const loadTeamData = (team: any) => {
    setTeamNumber(team.teamNumber);
    setProjectTitle(team.projectTitle);
    setBatch(team.batch);
    setTeamMembers(team.members);

    const marksMap = new Map<string, IndividualMarks>();
    team.members.forEach((member: TeamMember) => {
      marksMap.set(member.teamMemberId, {
        teamMemberId: member.teamMemberId,
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        individualScore: 0,
        learningContribution: 0,
        presentationSkill: 0,
        contributionToProject: 0
      });
    });
    setIndividualMarks(marksMap);

    // ✅ SAVE ORIGINAL VALUES (all zeros for new evaluation)
    saveOriginalValues(0, 0, 0, 0, '', '', '', marksMap);
  };

  // ✅ NEW FUNCTION: Save original values
  const saveOriginalValues = (
    poster: number,
    video: number,
    report: number,
    ppt: number,
    evalName: string,
    evalEmail: string,
    rem: string,
    marks: Map<string, IndividualMarks>
  ) => {
    setOriginalValues({
      posterMarks: poster,
      videoMarks: video,
      reportMarks: report,
      pptMarks: ppt,
      externalEvaluatorName: evalName,
      externalEvaluatorEmail: evalEmail,
      remarks: rem,
      individualMarks: new Map(marks) // Create a copy
    });
  };

  // ✅ NEW FUNCTION: Restore original values
  const restoreOriginalValues = () => {
    if (originalValues) {
      setPosterMarks(originalValues.posterMarks);
      setVideoMarks(originalValues.videoMarks);
      setReportMarks(originalValues.reportMarks);
      setPptMarks(originalValues.pptMarks);
      setExternalEvaluatorName(originalValues.externalEvaluatorName);
      setExternalEvaluatorEmail(originalValues.externalEvaluatorEmail);
      setRemarks(originalValues.remarks);
      setIndividualMarks(new Map(originalValues.individualMarks));
    }
  };

  const updateIndividualMarks = (teamMemberId: string, field: keyof IndividualMarks, value: number, max: number) => {
    const clampedValue = clampValue(value, 0, max);
    setIndividualMarks(prev => {
      const newMap = new Map(prev);
      const marks = newMap.get(teamMemberId);
      if (marks) {
        newMap.set(teamMemberId, { ...marks, [field]: clampedValue });
      }
      return newMap;
    });
  };

  const calculateGroupScore = () => posterMarks + videoMarks + reportMarks + pptMarks;

  const calculateExternalEvaluatorMarks = (marks: IndividualMarks) => {
    return marks.learningContribution + marks.presentationSkill + marks.contributionToProject;
  };

  const calculateMentorMarks = (marks: IndividualMarks) => {
    return calculateGroupScore() + marks.individualScore;
  };

  const calculateTotalMarks = (marks: IndividualMarks) => {
    return calculateMentorMarks(marks) + calculateExternalEvaluatorMarks(marks);
  };

  const validateForm = () => {
    if (posterMarks < 0 || posterMarks > 2) {
      alert('Poster marks must be between 0 and 2');
      return false;
    }
    if (videoMarks < 0 || videoMarks > 3) {
      alert('Video marks must be between 0 and 3');
      return false;
    }
    if (reportMarks < 0 || reportMarks > 3) {
      alert('Report marks must be between 0 and 3');
      return false;
    }
    if (pptMarks < 0 || pptMarks > 3) {
      alert('PPT marks must be between 0 and 3');
      return false;
    }

    for (const [_, marks] of Array.from(individualMarks)) {
      if (marks.individualScore < 0 || marks.individualScore > 3) {
        alert(`Individual score for ${marks.memberName} must be between 0 and 3`);
        return false;
      }
      if (marks.learningContribution < 0 || marks.learningContribution > 2) {
        alert(`Philosophy/idea about SSR for ${marks.memberName} must be between 0 and 2`);
        return false;
      }
      if (marks.presentationSkill < 0 || marks.presentationSkill > 2) {
        alert(`Presentation skill for ${marks.memberName} must be between 0 and 2`);
        return false;
      }
      if (marks.contributionToProject < 0 || marks.contributionToProject > 2) {
        alert(`Learnings for ${marks.memberName} must be between 0 and 2`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const individualEvaluations = Array.from(individualMarks.values());

      const payload = {
        teamId,
        posterMarks,
        videoMarks,
        reportMarks,
        pptMarks,
        individualEvaluations,
        externalEvaluatorName,
        externalEvaluatorEmail,
        status: 'SUBMITTED',
        remarks
      };

      const response = await fetch('/api/mentor/teams/evaluate', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save evaluation');
      }

      alert('Evaluation submitted successfully!');
      
      setIsSubmitted(true);
      setShowForm(false);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      fetchTeamData();
    } catch (err: any) {
      setError(err.message || 'Failed to save evaluation');
      console.error('Error saving evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowForm(true);
    setShowSuccessMessage(false);
  };

  // ✅ UPDATED: Handle cancel with restore
  const handleCancel = () => {
    restoreOriginalValues();
    if (isSubmitted) {
      setShowForm(false);
    } else {
      router.back();
    }
  };

  const clampValue = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  // ✅ REMOVED: handleNumberInput function (causing immediate clamping)

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <button
            onClick={fetchTeamData}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Details View (unchanged - showing .toFixed(1) for decimals)
  if (isSubmitted && !showForm) {
    return (
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team Details
        </button>

        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center animate-fade-in">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Evaluation Submitted Successfully</h3>
              <p className="text-sm text-green-700">The evaluation has been submitted and saved.</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-4 text-green-600 hover:text-green-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex justify-end mb-6">
          <button
            onClick={handleEdit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Evaluation</span>
          </button>
        </div>

        {/* Group Marks Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Group Marks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Poster Marks:</span>
              <span className="text-blue-600 font-semibold">{posterMarks.toFixed(1)} / 2</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Video Marks:</span>
              <span className="text-blue-600 font-semibold">{videoMarks.toFixed(1)} / 3</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Report Marks:</span>
              <span className="text-blue-600 font-semibold">{reportMarks.toFixed(1)} / 3</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">PPT Marks:</span>
              <span className="text-blue-600 font-semibold">{pptMarks.toFixed(1)} / 3</span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-blue-900">
              Total Group Score: {calculateGroupScore().toFixed(1)} / 11
            </p>
          </div>
        </div>

        {/* Individual Marks Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Individual Evaluations</h2>
          <div className="space-y-6">
            {teamMembers.map((member) => {
              const marks = individualMarks.get(member.teamMemberId);
              if (!marks) return null;

              const mentorMarks = calculateMentorMarks(marks);
              const externalMarks = calculateExternalEvaluatorMarks(marks);
              const totalMarks = calculateTotalMarks(marks);

              return (
                <div key={member.teamMemberId} className="border rounded-lg p-6 bg-gradient-to-br from-white to-gray-50">
                  <h3 className="font-semibold text-lg mb-2">{member.name}</h3>
                  <p className="text-sm text-gray-600 mb-6">{member.email}</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mentor Marks Section */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2">MENTOR</span>
                        Mentor Marks
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Group Marks:</span>
                          <span className="font-semibold text-blue-700">{calculateGroupScore().toFixed(1)} / 11</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Individual Score:</span>
                          <span className="font-semibold text-blue-700">{marks.individualScore.toFixed(1)} / 3</span>
                        </div>
                        <div className="border-t-2 border-blue-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-blue-900">Mentor Total:</span>
                            <span className="text-2xl font-bold text-blue-700">{mentorMarks.toFixed(1)} / 14</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* External Evaluator Marks Section */}
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs mr-2">EXTERNAL</span>
                        External Evaluator Marks
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">What's your philosophy/idea about SSR:</span>
                          <span className="font-semibold text-green-700">{marks.learningContribution.toFixed(1)} / 2</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Presentation Skill:</span>
                          <span className="font-semibold text-green-700">{marks.presentationSkill.toFixed(1)} / 2</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Learnings:</span>
                          <span className="font-semibold text-green-700">{marks.contributionToProject.toFixed(1)} / 2</span>
                        </div>
                        <div className="border-t-2 border-green-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-900">External Total:</span>
                            <span className="text-2xl font-bold text-green-700">{externalMarks.toFixed(1)} / 6</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Score */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Final Total Score</p>
                        <p className="text-xs text-gray-500">Mentor ({mentorMarks.toFixed(1)}) + External ({externalMarks.toFixed(1)})</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {totalMarks.toFixed(1)}
                        </span>
                        <span className="text-xl text-gray-500"> / 20</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Information */}
        {(externalEvaluatorName || externalEvaluatorEmail || remarks) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            {externalEvaluatorName && (
              <div className="mb-3">
                <span className="font-medium text-gray-700">External Evaluator Name: </span>
                <span className="text-gray-900">{externalEvaluatorName}</span>
              </div>
            )}
            {externalEvaluatorEmail && (
              <div className="mb-3">
                <span className="font-medium text-gray-700">External Evaluator Email: </span>
                <span className="text-gray-900">{externalEvaluatorEmail}</span>
              </div>
            )}
            {remarks && (
              <div>
                <span className="font-medium text-gray-700 block mb-2">Remarks:</span>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">{remarks}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Form View - ✅ UPDATED INPUT HANDLING
  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={handleCancel}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {isSubmitted ? 'Back to Details' : 'Back to Team Details'}
      </button>

      {/* Group Marks Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Group Marks (Total: 11 marks)</h2>
        <p className="text-sm text-gray-600 mb-4">These marks are same for all team members</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poster Marks (Max: 2)
            </label>
            {/* ✅ FIXED: Only update state, let user type freely */}
            <input
              type="number"
              min="0"
              max="2"
              step="0.5"
              value={posterMarks}
              onChange={(e) => setPosterMarks(parseFloat(e.target.value) || 0)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setPosterMarks(clampValue(val, 0, 2));
              }}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Marks (Max: 3)
            </label>
            <input
              type="number"
              min="0"
              max="3"
              step="0.5"
              value={videoMarks}
              onChange={(e) => setVideoMarks(parseFloat(e.target.value) || 0)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setVideoMarks(clampValue(val, 0, 3));
              }}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Marks (Max: 3)
            </label>
            <input
              type="number"
              min="0"
              max="3"
              step="0.5"
              value={reportMarks}
              onChange={(e) => setReportMarks(parseFloat(e.target.value) || 0)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setReportMarks(clampValue(val, 0, 3));
              }}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PPT Marks (Max: 3)
            </label>
            <input
              type="number"
              min="0"
              max="3"
              step="0.5"
              value={pptMarks}
              onChange={(e) => setPptMarks(parseFloat(e.target.value) || 0)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setPptMarks(clampValue(val, 0, 3));
              }}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold text-blue-900">
            Group Score: {calculateGroupScore().toFixed(1)} / 11
          </p>
        </div>
      </div>

      {/* Individual Marks Section - Apply same fix to all individual inputs */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Individual Evaluations</h2>
        
        <div className="space-y-6">
          {teamMembers.map((member) => {
            const marks = individualMarks.get(member.teamMemberId);
            if (!marks) return null;

            const mentorMarks = calculateMentorMarks(marks);
            const externalMarks = calculateExternalEvaluatorMarks(marks);
            const totalMarks = calculateTotalMarks(marks);

            return (
              <div key={member.teamMemberId} className="border-2 rounded-lg p-6 bg-gradient-to-br from-white to-gray-50">
                <h3 className="font-semibold text-lg mb-2">{member.name}</h3>
                <p className="text-sm text-gray-600 mb-6">{member.email}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Mentor's Individual Score Input */}
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2">MENTOR</span>
                      Individual Score
                    </h4>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Individual Assessment (Max: 3 marks)
                    </label>
                    {/* ✅ FIXED: Let user type, clamp only on blur */}
                    <input
                      type="number"
                      min="0"
                      max="3"
                      step="0.5"
                      value={marks.individualScore}
                      onChange={(e) => updateIndividualMarks(
                        member.teamMemberId, 
                        'individualScore', 
                        parseFloat(e.target.value) || 0,
                        3
                      )}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateIndividualMarks(member.teamMemberId, 'individualScore', val, 3);
                      }}
                      className="w-full border-2 border-blue-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <div className="mt-4 pt-4 border-t-2 border-blue-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">Mentor Total:</span>
                        <span className="text-xl font-bold text-blue-700">{mentorMarks.toFixed(1)} / 14</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Group ({calculateGroupScore().toFixed(1)}) + Individual ({marks.individualScore.toFixed(1)})
                      </p>
                    </div>
                  </div>

                  {/* External Evaluator Criteria Inputs */}
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs mr-2">EXTERNAL</span>
                      External Evaluator Criteria
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          What's your philosophy/idea about SSR: (Max: 2)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="2"
                          step="0.5"
                          value={marks.learningContribution}
                          onChange={(e) => updateIndividualMarks(
                            member.teamMemberId, 
                            'learningContribution', 
                            parseFloat(e.target.value) || 0,
                            2
                          )}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateIndividualMarks(member.teamMemberId, 'learningContribution', val, 2);
                          }}
                          className="w-full border-2 border-green-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presentation Skill (Max: 2)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="2"
                          step="0.5"
                          value={marks.presentationSkill}
                          onChange={(e) => updateIndividualMarks(
                            member.teamMemberId, 
                            'presentationSkill', 
                            parseFloat(e.target.value) || 0,
                            2
                          )}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateIndividualMarks(member.teamMemberId, 'presentationSkill', val, 2);
                          }}
                          className="w-full border-2 border-green-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Learnings: (Max: 2)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="2"
                          step="0.5"
                          value={marks.contributionToProject}
                          onChange={(e) => updateIndividualMarks(
                            member.teamMemberId, 
                            'contributionToProject', 
                            parseFloat(e.target.value) || 0,
                            2
                          )}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateIndividualMarks(member.teamMemberId, 'contributionToProject', val, 2);
                          }}
                          className="w-full border-2 border-green-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 bg-white"
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-green-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-900">External Total:</span>
                        <span className="text-xl font-bold text-green-700">{externalMarks.toFixed(1)} / 6</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Score Display */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Total Score</p>
                      <p className="text-xs text-gray-500">
                        Mentor ({mentorMarks.toFixed(1)}) + External ({externalMarks.toFixed(1)})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {totalMarks.toFixed(1)}
                      </span>
                      <span className="text-xl text-gray-500"> / 20</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* External Evaluator & Remarks - unchanged */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Additional Information (Optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Evaluator Name
            </label>
            <input
              type="text"
              value={externalEvaluatorName}
              onChange={(e) => setExternalEvaluatorName(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter evaluator name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Evaluator Email
            </label>
            <input
              type="email"
              value={externalEvaluatorEmail}
              onChange={(e) => setExternalEvaluatorEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter evaluator email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Add any additional comments or feedback..."
          />
        </div>
      </div>

      {/* Action Buttons - ✅ UPDATED Cancel button */}
      <div className="flex justify-end space-x-4 mb-6">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
          <span>{loading ? 'Submitting...' : 'Submit Evaluation'}</span>
        </button>
      </div>
    </div>
  );
};

export default EvaluateForm;