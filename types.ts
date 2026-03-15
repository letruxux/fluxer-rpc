export interface Timestamp {
  start: string;
  end: string;
}

export interface Activity {
  name: string;
  type: number;
  typeName: string;
  details: string;
  state: string;
  timestamps: Timestamp;
  applicationId?: any;
  url?: any;
  artist: string;
  song: string;
  album: string;
  albumArt: string;
}

export interface RawUserPresenceResponse {
  username: string;
  displayName: string;
  tag: string;
  id: string;
  status: string;
  avatarUrl: string;
  customStatus?: any;
  activities: Activity[];
  createdAt: number;
  flags: any[];
  premiumSince?: any;
}
