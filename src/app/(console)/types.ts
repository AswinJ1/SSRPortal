// eslint-disable-next-line import/no-unused-modules
export interface IPaginatedData<Type> {
  results: Type[];
  count: number;
  next: string | null;
  previous: string | null;
}

// eslint-disable-next-line import/no-unused-modules
export interface IUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarURL?: string | null;
  avatarID?: string | null;
}

// eslint-disable-next-line import/no-unused-modules
export enum PROPOSAL_STATUS {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',

}

// eslint-disable-next-line import/no-unused-modules
export interface IProposal {
  id: number;
  title: string;
  description: string;
  content: string;
  attachment?: string | null;
  ppt_attachment?: string | null;
  poster_attachment?: string | null;
  link?: string | null;
  state: string; // or use PROPOSAL_STATUS enum
  remarks?: string | null;
  created_at: Date;
  updated_at: Date;
  remark_updated_at?: Date | null;
  authorId: string;
  teamCode?: string | null;
  author?: {
    firstName: string;
    lastName: string;
    email: string;
    rollno?: string | null;
  };
}

// eslint-disable-next-line import/no-unused-modules
export interface IProject {
  id: number;
  title: string;
  description: string;
  team: ITeam;
}

// eslint-disable-next-line import/no-unused-modules
export enum TEAM_STATUS {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROPOSAL_SUBMISSION = 'PROPOSAL_SUBMISSION',
  PROPOSAL_ACCEPTED = 'PROPOSAL_ACCEPTED',
  PROJECT_IN_PROGRESS = 'PROJECT_IN_PROGRESS',
  PROJECT_REVIEW = 'PROJECT_REVIEW',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
}

// eslint-disable-next-line import/no-unused-modules
export interface ITeam {
  id: string;
  teamNumber: string;
  code: string;
  mentor: IUser;
  members: Array<{
    id: string;
    name: string;
    email: string;
    rollno?: string;
    role?: 'LEADER' | 'MEMBER';
  }>;
  proposals: IProposal[];
  project: IProject | null;
  stats: {
    proposals: number;
    teamNumber: string;
    members: number;
    status: TEAM_STATUS | string;
  };
}