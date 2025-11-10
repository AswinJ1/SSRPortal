'use client';

import { useEffect, useState, cloneElement } from 'react';
import { useRouter } from 'next/navigation';

interface ProposalFormGuardProps {
  children: React.ReactNode;
}

interface ExistingProposal {
  id: number;
  title: string;
  description: string;
  content: string;
  attachment?: string;
  ppt_attachment?: string;
  poster_attachment?: string;
  link?: string;
  state: string;
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
    linkedin?: string;
  };
}

export default function ProposalFormGuard({ children }: ProposalFormGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [existingProposal, setExistingProposal] = useState<ExistingProposal | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      try {
        // Check if user has existing proposal
        const response = await fetch('/api/student/proposals');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.proposals && data.proposals.length > 0) {
            const proposal = data.proposals[0];
            
            // Only allow access if proposal is rejected
            if (proposal.state === 'REJECTED') {
              setExistingProposal({
                id: proposal.id,
                title: proposal.title,
                description: proposal.description,
                content: proposal.content,
                attachment: proposal.attachment,
                link: proposal.link,
                state: proposal.state,
                // Extract metadata from the stored fields or default values
                metadata: {
                  category: proposal.category || '',
                  locationMode: 'Offline',
                  state: proposal.state_location || '',
                  district: proposal.district || '',
                  city: proposal.city || '',
                  placeVisited: proposal.placeVisited || '',
                  travelTime: proposal.travelTime || '',
                  executionTime: proposal.executionTime || '',
                  completionDate: proposal.completionDate || '',
                  linkedin: proposal.linkedin || '',
                }
              });
              setCanAccess(true);
            } else {
              // Redirect to proposals page if already has a non-rejected proposal
              router.push('/dashboard/student/proposals');
              return;
            }
          } else {
            // No existing proposal, allow access
            setCanAccess(true);
          }
        } else if (response.status === 404) {
          // No proposals found, allow access
          setCanAccess(true);
        } else {
          // Other error, still allow access but let the form handle it
          setCanAccess(true);
        }
      } catch (error) {
        console.error('Error checking proposal access:', error);
        // On error, allow access and let the form handle the error
        setCanAccess(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Checking access...</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    );
  }

  // Clone children and pass existingProposal as prop
  const childrenWithProps = cloneElement(children as React.ReactElement, {
    existingProposal
  });

  return <>{childrenWithProps}</>;
}
