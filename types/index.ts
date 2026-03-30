export type AnnotationType =
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'highlight'
  | 'freehand'
  | 'text';

export type AccessType = 'VIEW' | 'COMMENT' | 'EDIT';

export interface AnnotationStyle {
  stroke: string;
  strokeWidth: number;
  fill?: string;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface AnnotationGeometry {
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  radius?: number;
  endX?: number;
  endY?: number;
  rotation?: number;
}

export interface Annotation {
  id: string;
  documentId: string;
  pageNumber: number;
  type: AnnotationType;
  geometry: AnnotationGeometry;
  style: AnnotationStyle;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  documentId: string;
  annotationId?: string;
  authorUserId?: string;
  authorName?: string;
  pageNumber: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  isVisible?: boolean;
  projectId: string;
  annotations: Annotation[];
  comments: Comment[];
  shareLinks?: ShareLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  workspaceId?: string | null;
  documents: Document[];
  shareLinks: ShareLink[];
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  projectId: string;
  documentId?: string;
  access: AccessType;
  createdAt: string;
  expiresAt?: string;
}

export interface PlanFeatures {
  canAnnotate: boolean;
  canComment: boolean;
  hasCommentStatus: boolean;
  hasDocumentStatus: boolean;
  hasEmailNotifications: boolean;
  hasSlackIntegration: boolean;
  hasBranding: boolean;
  hasTeamOnlyComments: boolean;
  hasPasswordProtectedLinks: boolean;
  hasAnalytics: boolean;
}

export interface PlanLimits {
  maxActiveProjects: number | null;
  maxActiveDocuments: number | null;
  softMonthlyNewDocumentsLimit: number | null;
}

export interface PricingPlan {
  id: 'free' | 'pro' | 'team';
  name: string;
  description: string;
  monthlyPriceInPaise: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

export interface Workspace {
  id: string;
  name: string;
  ownerUserId: string;
  currentPlanId: 'free' | 'pro' | 'team';
  subscriptionStatus: 'none' | 'pending' | 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused';
  currentPlanStartedAt?: string | null;
  currentPlanRenewsAt?: string | null;
  razorpayCustomerId?: string | null;
  razorpaySubscriptionId?: string | null;
  currentPlan: PricingPlan;
  usage: {
    activeProjectsCount: number;
    activeDocumentsCount: number;
  };
}

export type Tool =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'highlight'
  | 'freehand'
  | 'text';

export interface EditorState {
  activeTool: Tool;
  selectedAnnotationIds: string[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  opacity: number;
  zoom: number;
  currentPage: number;
  totalPages: number;
  isDrawing: boolean;
  isDirty: boolean;
}
