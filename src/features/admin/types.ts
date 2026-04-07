export interface AdminStats {
  totalUsers: number;
  totalAlbums: number;
  totalMedia: number;
  totalPhotos: number;
  totalVideos: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
}

export interface UserStat {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  albumCount: number;
  uploadCount: number;
}

export interface AlbumStat {
  id: string;
  name: string;
  createdBy: string;
  creatorName: string;
  createdAt: Date;
  mediaCount: number;
  memberCount: number;
  storageBytes: number;
}
