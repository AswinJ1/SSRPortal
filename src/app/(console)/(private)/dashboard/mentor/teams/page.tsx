// import { redirect } from 'next/navigation';
// import { auth } from '@/lib/auth';
// import prisma from '@/lib/db/prisma';
// import Link from 'next/link';

// async function getTeams() {
//   const session = await auth();
//   if (!session?.user) redirect('/auth/signin');

//   return await prisma.team.findMany({
//     where: {
//       mentorId: session.user.id,
//     },
//     include: {
//       members: {
//         include: {
//           user: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true,
//               mID: true
//             }
//           }
//         }
//       },
//       lead: {
//         select: {
//           firstName: true,
//           lastName: true,
//           email: true
//         }
//       },
//       project: {
//         include: {
//           theme: true
//         }
//       }
//     },
//     orderBy: {
//       createdAt: 'desc'
//     }
//   });
// }

// export default async function TeamsPage() {
//   const teams = await getTeams();

//   const getStatusStyle = (status: string) => {
//     switch (status) {
//       case 'APPROVED':
//         return 'bg-green-100 text-green-800';
//       case 'REJECTED':
//         return 'bg-red-100 text-red-800';
//       case 'PENDING':
//         return 'bg-yellow-100 text-yellow-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-6">My Teams</h1>
      
//       <div className="grid gap-6">
//         {teams.map((team) => (
//           <div key={team.id} className="bg-white p-6 rounded-lg shadow">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h2 className="text-xl font-semibold">Team {team.teamNumber}</h2>
//                 <p className="text-gray-500">{team.members.length + 1} members</p>
//               </div>
//               <div className="flex items-center gap-4">
//                 <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(team.status)}`}>
//                   {team.status}
//                 </span>
//                 <Link 
//                   href={`/dashboard/mentor/teams/${team.id}`}
//                   className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
//                 >
//                   View Details
//                 </Link>
//               </div>
//             </div>

//             <div className="grid md:grid-cols-2 gap-6">
//               {/* Team Members */}
//               <div>
//                 <h3 className="font-medium mb-3">Team Members</h3>
//                 <div className="space-y-3">
//                   {/* Leader */}
//                   <div className="p-3 bg-gray-50 rounded-lg">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <p className="font-medium">
//                           {team.lead.firstName} {team.lead.lastName}
//                           <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
//                             Leader
//                           </span>
//                         </p>
//                         <p className="text-sm text-gray-600">{team.lead.email}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Other Members */}
//                   {team.members
//                     .filter(member => member.role === 'MEMBER')
//                     .map((member) => (
//                       <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
//                         <p className="font-medium">
//                           {member.user.firstName} {member.user.lastName}
//                         </p>
//                         <p className="text-sm text-gray-600">{member.user.email}</p>
//                       </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Project Details */}
//               {team.project ? (
//                 <div>
//                   <h3 className="font-medium mb-3">Project Details</h3>
//                   <div className="p-4 bg-gray-50 rounded-lg">
//                     <p className="font-medium">{team.project.name}</p>
//                     {team.project.theme && (
//                       <p className="text-sm text-gray-600 mt-1">
//                         Theme: {team.project.theme.name}
//                       </p>
//                     )}
//                     {team.project.description && (
//                       <p className="text-sm text-gray-700 mt-2">
//                         {team.project.description}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex items-center justify-center h-full">
//                   <p className="text-gray-500">No project details available yet</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';

async function getTeams() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  // Updated to remove user and rely on TeamMember fields directly
  const teams = await prisma.team.findMany({
    where: {
      mentorId: session.user.id,
    },
    include: {
      members: true, // no user include
      lead: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      project: {
        include: {
          theme: true
        }
      },
      proposals: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return teams;
}

export default async function TeamsPage() {
  const teams = await getTeams();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Teams</h1>
      
      <div className="grid gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Team {team.teamNumber}</h2>
                <p className="text-gray-500">{team.members.length + 1} members</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(team.status)}`}>
                  {team.status}
                </span>
                <Link 
                  href={`/dashboard/mentor/teams/${team.id}`}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Team Members */}
              <div>
                <h3 className="font-medium mb-3">Team Members</h3>
                <div className="space-y-3">
                  {/* Leader */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {team.lead.firstName} {team.lead.lastName}
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Leader
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">{team.lead.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Other Members */}
                  {team.members
                    .filter(member => member.role === 'MEMBER')
                    .map((member) => (
                      <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                  ))}
                </div>
              </div>

              {/* Project Details */}
              {team.proposals && team.proposals.length > 0 ? (
                <div>
                  <h3 className="font-medium mb-3">Project Details</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{team.proposals[0].title}</p>
                    {team.proposals[0].state && (
                      <p className="text-sm text-gray-600 mt-1">
                        Status: 
                        <span className={`px-2 py-1 rounded ${getStatusStyle(team.proposals[0].state)}`}>
                          {team.proposals[0].state}
                        </span>
                      </p>
                    )}
                   
                    {team.proposals[0].description && (
                      <p className="text-sm text-gray-700 mt-2">
                        {team.proposals[0].description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No project details available yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
