import { z } from 'zod';

// Metadata schema for validation
export const proposalMetadataSchema = z.object({
  category: z.string().min(1, 'Project category is required'),
  locationMode: z.literal('Offline'),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  placeVisited: z.string().min(1, 'Place visited is required'),
  travelTime: z.string()
    .min(1, 'Travel time is required')
    .regex(/^[0-9]+(\.[0-9]+)?$/, 'Travel time must be a valid number in hours (e.g., "2", "2.5", "1.75")'),
  executionTime: z.string()
    .min(1, 'Execution time is required')
    .regex(/^[0-9]+(\.[0-9]+)?$/, 'Execution time must be a valid number in hours (e.g., "1", "1.5", "0.5")'),
  completionDate: z.string().min(1, 'Completion date is required'),
  totalParticipants: z.string()
    .min(1, 'Total participants is required')
    .regex(/^[0-9]+$/, 'Total participants must be a valid number'),
});

export const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  attachment: z.string().optional(), // Allow any string for file URLs (comma-separated)
  ppt_attachment: z.string().optional(), // Allow any string for PPT file URLs
  poster_attachment: z.string().optional(), // Allow any string for Poster file URLs
  link: z.string().optional(), // Allow any string for links
  // Validate metadata structure if provided
  _metadata: proposalMetadataSchema.optional(),
});

export type ProposalInput = z.infer<typeof proposalSchema>;
export type ProposalMetadata = z.infer<typeof proposalMetadataSchema>;