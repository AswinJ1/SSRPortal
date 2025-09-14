'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export type TeamStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ProjectPillar = 
  'DRUG_AWARENESS' | 
  'CYBERSECURITY_AWARENESS' | 
  'HEALTH_AND_WELLBEING' | 
  'INDIAN_CULTURE_AND_HERITAGE' | 
  'SKILL_BUILDING' | 
  'ENVIRONMENTAL_INITIATIVES' | 
  'WOMEN_EMPOWERMENT' | 
  'PEER_MENTORSHIP' | 
  'TECHNICAL_PROJECTS' | 
  'FINANCIAL_LITERACY';

interface UpdateTeamFormProps {
  id: string;
  currentStatus: TeamStatus;
  currentProjectTitle: string;
  currentProjectPillar: ProjectPillar;
  currentTeamNumber: string;
  currentMembers: Array<{
    id: string;
    name: string;
    email: string;
    rollNumber: string;
  }>;
}

interface BatchOption {
  label: string;
  value: string;
  range: [number, number]; // ✅ Add range property
}

export default function UpdateTeamForm({ 
  id, 
  currentStatus, 
  currentProjectTitle, 
  currentProjectPillar,
  currentTeamNumber,
  currentMembers
}: UpdateTeamFormProps) {
  const [status, setStatus] = useState<TeamStatus>(currentStatus);
  const [projectTitle, setProjectTitle] = useState(currentProjectTitle);
  const [projectPillar, setProjectPillar] = useState(currentProjectPillar);
  const [batch, setBatch] = useState('');
  const [teamNumber, setTeamNumber] = useState(currentTeamNumber);
  const [members, setMembers] = useState(currentMembers);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // ✅ FIXED: Use the same batch options with ranges as in form.tsx
  const [batches] = useState<BatchOption[]>([
    { label: 'AI A', value: 'AI_A', range: [1, 12] },
    { label: 'AI B', value: 'AI_B', range: [13, 23] },
    { label: 'AI-DS', value: 'AI_DS', range: [24, 34] },
    { label: 'CYS', value: 'CYS', range: [35, 41] },
    { label: 'CSE A', value: 'CSE_A', range: [42, 52] },
    { label: 'CSE B', value: 'CSE_B', range: [53, 64] },
    { label: 'CSE C', value: 'CSE_C', range: [65, 77] },
    { label: 'CSE D', value: 'CSE_D', range: [78, 89] },
    { label: 'ECE A', value: 'ECE_A', range: [90, 99] },
    { label: 'ECE B', value: 'ECE_B', range: [100, 112] },
    { label: 'EAC', value: 'EAC', range: [113, 123] },
    { label: 'ELC', value: 'ELC', range: [124, 132] },
    { label: 'EEE', value: 'EEE', range: [133, 140] },
    { label: 'ME', value: 'ME', range: [141, 150] },
    { label: 'RAE', value: 'RAE', range: [151, 160] }
  ]);
  
  const [availableTeamNumbers, setAvailableTeamNumbers] = useState<string[]>([]);
  const [occupiedNumbers, setOccupiedNumbers] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  
  const router = useRouter();

  // ✅ FIXED: Generate team numbers based on batch-specific ranges
  const generateTeamNumbers = (batchValue: string): string[] => {
    const numbers: string[] = [];
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Find the batch configuration
    const batchConfig = batches.find(b => b.value === batchValue);
    if (!batchConfig) {
      console.error(`Batch configuration not found for: ${batchValue}`);
      return [];
    }
    
    const [start, end] = batchConfig.range;
    
    // Generate numbers based on the specific batch range
    for (let i = start; i <= end; i++) {
      const paddedNumber = i.toString().padStart(3, '0');
      numbers.push(`SSR ${year}-${paddedNumber}`);
    }
    
    return numbers;
  };

  // Fetch current team data
  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch(`/api/mentor/teams/${id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data); // Debug log
          
          setBatch(data.batch || '');
          setOccupiedNumbers(data.occupiedTeamNumbers || []);
          
          console.log('Set batch:', data.batch);
          console.log('Occupied numbers:', data.occupiedTeamNumbers);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchTeamData();
  }, [id]);

  // ✅ FIXED: Update available team numbers when batch changes
  useEffect(() => {
    if (batch) {
      console.log('Generating team numbers for batch:', batch);
      const allNumbers = generateTeamNumbers(batch);
      console.log('Generated numbers:', allNumbers);
      setAvailableTeamNumbers(allNumbers);
    } else {
      setAvailableTeamNumbers([]);
    }
  }, [batch, batches]);

  const handleBatchChange = (selectedBatch: string) => {
    console.log('Batch changed to:', selectedBatch);
    setBatch(selectedBatch);
    setTeamNumber('');
    setShowWarning(false);
  };

  const handleTeamNumberChange = (selectedNumber: string) => {
    setTeamNumber(selectedNumber);
    
    // Check if the selected number is occupied (excluding current team)
    const isOccupied = occupiedNumbers.includes(selectedNumber) && selectedNumber !== currentTeamNumber;
    setShowWarning(isOccupied);
    
    console.log('Team number changed to:', selectedNumber);
    console.log('Is occupied:', isOccupied);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if team number is occupied by another team
    if (showWarning) {
      toast.error('Cannot assign team number that is already occupied by another team');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`/api/mentor/teams/${id}`, {
        method: 'PATCH', // ✅ Changed from PUT to PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          projectTitle,
          projectPillar,
          teamNumber,
          batch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update team');
      }

      toast.success('Team updated successfully!');
      router.push(`/dashboard/mentor/teams/${id}`);
      router.refresh();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-600">Loading team data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Update Team</h2>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Selection */}
            <div>
              <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-1">
                Batch
              </label>
              <select
                id="batch"
                value={batch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a batch</option>
                {batches.map(batchOption => (
                  <option key={batchOption.value} value={batchOption.value}>
                    {batchOption.label} 
                  </option>
                ))}
              </select>
            </div>

            {/* Team Number Selection */}
            <div>
              <label htmlFor="teamNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Team Number
              </label>
              <select
                id="teamNumber"
                value={teamNumber}
                onChange={(e) => handleTeamNumberChange(e.target.value)}
                disabled={!batch}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
              >
                <option value="">
                  {!batch ? 'Select batch first' : 'Select team number'}
                </option>
                {availableTeamNumbers.map(number => {
                  const isOccupied = occupiedNumbers.includes(number);
                  const isCurrent = number === currentTeamNumber;
                  const isDisabled = isOccupied && !isCurrent;
                  
                  return (
                    <option 
                      key={number} 
                      value={number}
                      disabled={isDisabled}
                      className={isDisabled ? 'text-gray-400' : ''}
                    >
                      {number} 
                      {isCurrent ? ' (current)' : 
                       isOccupied ? ' (occupied)' : ' (available)'}
                    </option>
                  );
                })}
              </select>
              
              {/* Debug info */}
              {batch && (
                <p className="mt-1 text-xs text-gray-500">
                  Showing {availableTeamNumbers.length} numbers for {batch}
                  {occupiedNumbers.length > 0 && ` (${occupiedNumbers.length} occupied)`}
                </p>
              )}
              
              {/* Warning message */}
              {showWarning && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-yellow-700">
                      Warning: This team number is already occupied by another team!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Project Title
            </label>
            <input
              type="text"
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="projectPillar" className="block text-sm font-medium text-gray-700 mb-1">
              Project Pillar
            </label>
            <select
              id="projectPillar"
              value={projectPillar}
              onChange={(e) => setProjectPillar(e.target.value as ProjectPillar)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DRUG_AWARENESS">Drug Awareness</option>
              <option value="CYBERSECURITY_AWARENESS">Cybersecurity Awareness</option>
              <option value="HEALTH_AND_WELLBEING">Health and Wellbeing</option>
              <option value="INDIAN_CULTURE_AND_HERITAGE">Indian Culture and Heritage</option>
              <option value="SKILL_BUILDING">Skill Building</option>
              <option value="ENVIRONMENTAL_INITIATIVES">Environmental Initiatives</option>
              <option value="WOMEN_EMPOWERMENT">Women Empowerment</option>
              <option value="PEER_MENTORSHIP">Peer Mentorship</option>
              <option value="TECHNICAL_PROJECTS">Technical Projects</option>
              <option value="FINANCIAL_LITERACY">Financial Literacy</option>
            </select>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between">
              <button
                type="submit"
                disabled={isLoading || showWarning}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Team'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}