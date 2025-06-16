'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import prisma from '@/lib/db/prisma';

// Validation functions
function validateAmritaStudentEmail(email: string): boolean {
  if (!email.endsWith('@am.students.amrita.edu')) return false;
  const username = email.split('@')[0];
  const parts = username.split('.');
  if (parts.length !== 3) return false;
  const [campus, school, program] = parts;
  const validCampuses = ['am', 'cb', 'bl', 'ch'];
  const validSchools = ['en', 'sc', 'ai', 'bt'];
  const programPattern = /^[a-z]\d[a-z]{2,}(\d{5})?$/;
  return validCampuses.includes(campus) &&
         validSchools.includes(school) &&
         programPattern.test(program);
}

function extractStudentRollNo(email: string): string | null {
  if (!validateAmritaStudentEmail(email)) return null;
  return email.split('@')[0].toUpperCase();
}

// Enhanced team member schema with validation
const teamMemberSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .refine((email) => email.endsWith('@am.students.amrita.edu'), {
      message: 'Must be an Amrita student email (@am.students.amrita.edu)'
    })
    .refine((email) => validateAmritaStudentEmail(email), {
      message: 'Invalid Amrita student email format. Use: campus.school.program@am.students.amrita.edu'
    }),
  rollNumber: z.string()
    .min(5, 'Invalid roll number')
    .transform((val) => val.toUpperCase()),
}).refine((data) => {
  const extractedRoll = extractStudentRollNo(data.email);
  return extractedRoll === data.rollNumber;
}, {
  message: 'Roll number must match the email address',
  path: ['rollNumber']
});

type ProjectPillar = 'DRUG_AWARENESS' | 'CYBERSECURITY_AWARENESS' | 'HEALTH_AND_WELLBEING' | 
  'INDIAN_CULTURE_AND_HERITAGE' | 'SKILL_BUILDING' | 'ENVIRONMENTAL_INITIATIVES' | 
  'WOMEN_EMPOWERMENT' | 'PEER_MENTORSHIP' | 'TECHNICAL_PROJECTS' | 'FINANCIAL_LITERACY';

const teamSchema = z.object({
  projectTitle: z.string()
    .min(5, 'Project title must be at least 5 characters')
    .max(100, 'Project title must be less than 100 characters'),
  projectPillar: z.enum([
    'DRUG_AWARENESS',
    'CYBERSECURITY_AWARENESS',
    'HEALTH_AND_WELLBEING',
    'INDIAN_CULTURE_AND_HERITAGE',
    'SKILL_BUILDING',
    'ENVIRONMENTAL_INITIATIVES',
    'WOMEN_EMPOWERMENT',
    'PEER_MENTORSHIP',
    'TECHNICAL_PROJECTS',
    'FINANCIAL_LITERACY'
  ] as const, {
    required_error: "Project pillar is required",
    invalid_type_error: "Invalid project pillar selected"
  }),
  mentorId: z.string().min(1, 'Mentor selection is required'),
  batch: z.string().min(1, 'Batch selection is required'),
  teamNumber: z.string().min(1, 'Team number selection is required'),
  members: z.array(teamMemberSchema)
    .min(3, 'At least 3 team members are required')
    .max(5, 'Maximum 5 team members allowed')
    .refine((members) => {
      const emails = members.map(m => m.email.toLowerCase());
      return new Set(emails).size === emails.length;
    }, { message: 'Duplicate email addresses are not allowed' })
    .refine((members) => {
      const rollNumbers = members.map(m => m.rollNumber.toUpperCase());
      return new Set(rollNumbers).size === rollNumbers.length;
    }, { message: 'Duplicate roll numbers are not allowed' })
    .refine((members) => {
      const names = members.map(m => m.name.toLowerCase().trim());
      return new Set(names).size === names.length;
    }, { message: 'Duplicate names are not allowed' }),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  initialData?: {
    projectTitle: string;
    projectPillar: ProjectPillar;
    mentorId: string;
    batch: string;
    teamNumber: string;
    isRejected?: boolean;
    members: Array<{
      name: string;
      email: string;
      rollNumber: string;
      isLeader?: boolean;
    }>;
  };
  isEditing?: boolean;
}

interface Mentor {
  id: string;
  name: string;
}

interface BatchOption {
  label: string;
  value: string;
  range: [number, number];
}

// Constants
const BATCH_OPTIONS: BatchOption[] = [
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
];

const PROJECT_PILLAR_LABELS = {
  DRUG_AWARENESS: 'Drug Awareness',
  CYBERSECURITY_AWARENESS: 'Cybersecurity Awareness',
  HEALTH_AND_WELLBEING: 'Health and Wellbeing',
  INDIAN_CULTURE_AND_HERITAGE: 'Indian Culture and Heritage',
  SKILL_BUILDING: 'Skill Building',
  ENVIRONMENTAL_INITIATIVES: 'Environmental Initiatives',
  WOMEN_EMPOWERMENT: 'Women Empowerment',
  PEER_MENTORSHIP: 'Peer Mentorship',
  TECHNICAL_PROJECTS: 'Technical Projects',
  FINANCIAL_LITERACY: 'Financial Literacy'
} as const;

export default function TeamForm({ initialData, isEditing = false }: TeamFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [availableTeamNumbers, setAvailableTeamNumbers] = useState<string[]>([]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    control,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: initialData || {
      projectTitle: '',
      projectPillar: 'DRUG_AWARENESS',
      mentorId: '',
      batch: '',
      teamNumber: '',
      members: [{ name: '', email: '', rollNumber: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  // Fetch mentors
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('/api/mentors');
        if (response.ok) {
          const data = await response.json();
          setMentors(data.map((mentor: any) => ({
            id: mentor.id,
            name: `${mentor.firstName} ${mentor.lastName}`
          })));
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
        toast.error('Failed to load mentors');
      }
    };

    fetchMentors();
  }, []);

  // Initialize form with editing data
  useEffect(() => {
    if (initialData && isEditing) {
      const nonLeaderMembers = initialData.members.filter(m => !m.isLeader);
      
      reset({
        projectTitle: initialData.projectTitle,
        projectPillar: initialData.projectPillar,
        batch: initialData.batch,
        teamNumber: initialData.teamNumber,
        mentorId: initialData.mentorId,
        members: nonLeaderMembers
      });
      
      setSelectedBatch(initialData.batch);
    }
  }, [initialData, isEditing, reset]);

  // Generate team numbers based on selected batch
  useEffect(() => {
    if (!selectedBatch) {
      setAvailableTeamNumbers([]);
      return;
    }

    const batch = BATCH_OPTIONS.find(b => b.label === selectedBatch);
    if (!batch) return;

    const [start, end] = batch.range;
    const teamNumbers = Array.from({ length: end - start + 1 }, (_, i) => {
      const num = (start + i).toString().padStart(3, '0');
      return `SSR 25-${num}`;
    });
    
    setAvailableTeamNumbers(teamNumbers);
  }, [selectedBatch]);

  // API calls
  const checkExistingUser = useCallback(async (email: string) => {
    try {
      const response = await fetch(`/api/users/check?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data.exists ? data.user : null;
    } catch (error) {
      console.error('Error checking existing user:', error);
      return null;
    }
  }, []);

  const checkUniqueTeamMember = useCallback(async (email: string, rollNumber: string) => {
    try {
      const response = await fetch('/api/teams/check-unique-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, rollNumber })
      });
      const data = await response.json();
      
      if (!data.isUnique) {
        toast.error(`This member is already part of team: ${data.existingTeam}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking unique team member:', error);
      return true;
    }
  }, []);

  // Event handlers
  const handleEmailChange = useCallback((index: number, email: string) => {
    setValue(`members.${index}.email`, email.toLowerCase());
    
    if (validateAmritaStudentEmail(email)) {
      const extractedRoll = extractStudentRollNo(email);
      if (extractedRoll) {
        setValue(`members.${index}.rollNumber`, extractedRoll);
      }
    }
  }, [setValue]);

  const handleEmailBlur = useCallback(async (index: number, email: string) => {
    if (!validateAmritaStudentEmail(email)) return;

    const rollNumber = extractStudentRollNo(email);
    if (!rollNumber) return;

    // Check uniqueness
    const isUnique = await checkUniqueTeamMember(email, rollNumber);
    if (!isUnique) {
      setValue(`members.${index}.email`, '');
      setValue(`members.${index}.rollNumber`, '');
      setValue(`members.${index}.name`, '');
      return;
    }

    // Check existing user
    const existingUser = await checkExistingUser(email);
    if (existingUser) {
      setValue(`members.${index}.name`, `${existingUser.firstName} ${existingUser.lastName}`.trim());
      setValue(`members.${index}.rollNumber`, existingUser.rollno || rollNumber);
    }
  }, [checkUniqueTeamMember, checkExistingUser, setValue]);

  const handleBatchChange = useCallback((batchValue: string) => {
    setSelectedBatch(batchValue);
    setValue('batch', batchValue);
    setValue('teamNumber', ''); // Reset team number when batch changes
  }, [setValue]);

  const addMember = useCallback(() => {
    if (fields.length < 5) {
      append({ name: '', email: '', rollNumber: '' });
    }
  }, [append, fields.length]);

  const removeMember = useCallback((index: number) => {
    if (fields.length > 3) {
      remove(index);
    }
  }, [remove, fields.length]);

  // Form submission
  const onSubmit = async (data: TeamFormData) => {
    try {
      setIsLoading(true);

      const endpoint = isEditing ? '/api/teams/update' : '/api/teams/create';
      const method = isEditing ? 'PUT' : 'POST';

      const submissionData = {
        projectTitle: data.projectTitle,
        projectPillar: data.projectPillar,
        batch: data.batch,
        teamNumber: isEditing ? initialData?.teamNumber : data.teamNumber,
        mentorId: data.mentorId,
        members: data.members.map(member => ({
          name: member.name,
          email: member.email,
          rollNumber: member.rollNumber.toUpperCase()
        }))
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit team');
      }

      setIsSubmitted(true);
      toast.success(isEditing ? 'Team updated successfully!' : 'Team created successfully!');
      router.push('/dashboard/student');

    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit team');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading states and auth checks
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700">Please log in to manage your team.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-6">
        <h2 className="text-xl font-semibold text-green-800 mb-4">Team Request Submitted!</h2>
        <div className="space-y-2 text-green-700">
          <p>Your team request has been submitted successfully.</p>
          <p>Team Number: {watch('teamNumber')}</p>
          <p>Status: Awaiting mentor approval</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/student')}
          className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Team Leader Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-blue-700 font-medium">
            Team Leader: {session?.user?.email}
          </p>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              {...register('projectTitle')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="Enter your project title"
            />
            {errors.projectTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.projectTitle.message}</p>
            )}
          </div>

          {/* Project Pillar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Pillar *
            </label>
            <select
              {...register('projectPillar')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              {Object.entries(PROJECT_PILLAR_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.projectPillar && (
              <p className="mt-1 text-sm text-red-600">{errors.projectPillar.message}</p>
            )}
          </div>

          {/* Mentor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentor *
            </label>
            <select
              {...register('mentorId')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="">Select a mentor</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name}
                </option>
              ))}
            </select>
            {errors.mentorId && (
              <p className="mt-1 text-sm text-red-600">{errors.mentorId.message}</p>
            )}
          </div>

          {/* Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch *
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={selectedBatch}
              disabled={isEditing}
              onChange={(e) => handleBatchChange(e.target.value)}
            >
              <option value="">Select a batch</option>
              {BATCH_OPTIONS.map(batch => (
                <option key={batch.label} value={batch.label}>{batch.label}</option>
              ))}
            </select>
            {errors.batch && (
              <p className="mt-1 text-sm text-red-600">{errors.batch.message}</p>
            )}
          </div>

          {/* Team Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Number *
            </label>
            <select
              {...register('teamNumber')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              disabled={!selectedBatch || isEditing}
            >
              <option value="">
                {selectedBatch ? 'Select a team number' : 'Select a batch first'}
              </option>
              {availableTeamNumbers.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            {errors.teamNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.teamNumber.message}</p>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Team Members * (excluding you as leader)
            </label>
            <span className="text-sm text-gray-500">
              {fields.length}/6 members ({Math.max(0, 3 - fields.length)} more required)
            </span>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    {...register(`members.${index}.name`)}
                    placeholder="Full name"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                  {errors.members?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.members[index]?.name?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    {...register(`members.${index}.email`, {
                      onChange: (e) => handleEmailChange(index, e.target.value),
                      onBlur: (e) => handleEmailBlur(index, e.target.value)
                    })}
                    placeholder="campus.school.program@am.students.amrita.edu"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                  {errors.members?.[index]?.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.members[index]?.email?.message}</p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Roll Number</label>
                  <input
                    type="text"
                    {...register(`members.${index}.rollNumber`)}
                    placeholder="Auto-filled from email"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                  {errors.members?.[index]?.rollNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.members[index]?.rollNumber?.message}</p>
                  )}
                  
                  {fields.length > 3 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {fields.length < 5 && (
            <button
              type="button"
              onClick={addMember}
              className="mt-4 px-4 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
            >
              + Add Member
            </button>
          )}
        </div>

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="space-y-1">
              {Object.entries(errors).map(([key, error]: [string, any]) => (
                <li key={key} className="text-sm text-red-600">
                  • {error.message || `Invalid ${key}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !session?.user || Object.keys(errors).length > 0}
          className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-dark 
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2 font-medium"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : isEditing ? (
            'Update Team'
          ) : (
            'Create Team'
          )}
        </button>
      </form>
    </div>
  );
}

// Type declarations
declare module "next-auth" {
  interface User {
    id: string;
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    emailVerified: Date;
    image: string;
    isAdmin: boolean;
    isStaff: boolean;
    isRegistered: boolean;
    canLogin: boolean;
    mID: string;
    role: string;
    rollNumber?: string;
  }
}