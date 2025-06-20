'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProposalForm from '../../form';
import toast from 'react-hot-toast';

interface Proposal {
  id: number;
  title: string;
  description: string;
  content: string;
  attachment?: string;
  state: string;
}

export default function EditProposalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const response = await fetch(`/api/student/proposals/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch proposal');
        }
        const data = await response.json();
        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to load proposal');
        router.push('/dashboard/student/proposals');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchProposal();
    }
  }, [params.id, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Proposal not found</div>
      </div>
    );
  }

  // Extract form data from content
  const contentSections = proposal.content.split('\n\n');
  const initialData = {
    title: proposal.title,
    description: proposal.description,
    objectives: contentSections[0]?.replace('Objectives:\n', '') || '',
    methodology: contentSections[1]?.replace('Methodology:\n', '') || '',
    expectedOutcomes: contentSections[2]?.replace('Expected Outcomes:\n', '') || '',
    timeline: contentSections[3]?.replace('Timeline:\n', '') || '',
    references: contentSections[4]?.replace('References:\n', '') || '',
    attachment: proposal.attachment
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Proposal</h1>
        <div className="text-sm text-gray-500">
          Status: <span className="font-semibold">{proposal.state}</span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <ProposalForm initialData={initialData} proposalId={params.id} />
      </div>
    </div>
  );
} 