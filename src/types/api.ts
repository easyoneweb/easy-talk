export interface OCSMeta {
  status: string;
  statuscode: number;
  message: string;
}

export interface OCSResponse<T> {
  ocs: {
    meta: OCSMeta;
    data: T;
  };
}

export enum ConversationType {
  ONE_TO_ONE = 1,
  GROUP = 2,
  PUBLIC = 3,
  CHANGELOG = 4,
  ONE_TO_ONE_FORMER = 5,
  NOTE_TO_SELF = 6,
}

export enum ParticipantType {
  OWNER = 1,
  MODERATOR = 2,
  USER = 3,
  GUEST = 4,
  USER_SELF_JOINED = 5,
  GUEST_MODERATOR = 6,
}

export enum MessageType {
  COMMENT = 'comment',
  SYSTEM = 'system',
  COMMAND = 'command',
  COMMENT_DELETED = 'comment_deleted',
}

export interface Conversation {
  id: number;
  token: string;
  type: ConversationType;
  name: string;
  displayName: string;
  description: string;
  participantType: ParticipantType;
  attendeeId: number;
  attendeePin: string;
  actorType: string;
  actorId: string;
  lastPing: number;
  sessionId: string;
  hasPassword: boolean;
  hasCall: boolean;
  canStartCall: boolean;
  lastActivity: number;
  lastReadMessage: number;
  unreadMessages: number;
  unreadMention: boolean;
  unreadMentionDirect: boolean;
  isFavorite: boolean;
  notificationLevel: number;
  lobbyState: number;
  lobbyTimer: number;
  readOnly: number;
  lastMessage: Message | null;
  canDeleteConversation: boolean;
  canLeaveConversation: boolean;
  status: string;
  statusIcon: string | null;
  statusMessage: string | null;
}

export interface MessageParameter {
  type: string;
  id: string;
  name: string;
  mimetype?: string;
  link?: string;
  size?: number;
  path?: string;
  'preview-available'?: string;
  [key: string]: unknown;
}

export interface Message {
  id: number;
  token: string;
  actorType: string;
  actorId: string;
  actorDisplayName: string;
  timestamp: number;
  message: string;
  messageParameters: Record<string, MessageParameter>;
  systemMessage: string;
  messageType: MessageType;
  isReplyable: boolean;
  referenceId: string;
  replyTo?: Message;
  reactions?: Record<string, number>;
  expirationTimestamp: number;
}

export interface Participant {
  attendeeId: number;
  actorType: string;
  actorId: string;
  displayName: string;
  participantType: ParticipantType;
  lastPing: number;
  inCall: number;
  sessionIds: string[];
  status: string;
  statusIcon: string | null;
  statusMessage: string | null;
}

export interface LoginFlowV2Init {
  poll: {
    token: string;
    endpoint: string;
  };
  login: string;
}

export interface LoginFlowV2Credentials {
  server: string;
  loginName: string;
  appPassword: string;
}

export interface AutocompleteResult {
  id: string;
  label: string;
  icon: string;
  source: string;
  status: string;
  subline: string;
  shareWithDisplayNameUnique: string;
}
