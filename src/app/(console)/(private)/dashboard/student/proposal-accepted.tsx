'use client';

import { ITeam, PROPOSAL_STATUS } from '@/app/(console)/types';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

const ProposalAccepted = ({ team } : { team: ITeam }) => {
    
  const proposal = team?.proposals.filter(item => item.state === 'APPROVED')[0];
    
  return (
      <div className="flex flex-col h-full p-4">
        {proposal ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Proposal Approved! 🎉
            </h3>
            <p className="text-green-700 mb-4">
              Your proposal &quot;{proposal.title}&quot; has been approved by your mentor.
            </p>
            <Link
              href={`/dashboard/student/proposals/${proposal.id}`}
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              View Proposal Details
            </Link>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              No approved proposals yet. Keep working on your submissions!
            </p>
          </div>
        )}
      </div>
  );
};

export default ProposalAccepted;