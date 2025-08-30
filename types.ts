export interface Track {
  id: string;
  file: File | null; // Can be null when a session is loaded without files
  name: string;
  fileName: string; // Persisted to help re-link files
  fileType?: string; // Persisted MIME type
  duration: number; // in seconds
  type: 'music' | 'spoken' | 'jingle';
  vocalStartTime?: number; // in seconds
  smartTrimStart?: number; // Time in seconds where content starts
  smartTrimEnd?: number;   // Time in seconds where content ends
  fileBuffer?: ArrayBuffer; // In-memory buffer of the file content
  normalizationGain?: number; // Gain applied for volume leveling
}

export interface SavedProject {
  id?: number;
  name: string;
  createdAt: string;
  projectData: {
    tracks: Omit<Track, 'file'>[];
    underlayTrack: Omit<Track, 'file'> | null;
    mixerSettings: any;
  }
}