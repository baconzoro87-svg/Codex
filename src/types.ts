export interface Video {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
}

export interface PlaylistInfo {
  id: string;
  title: string | null;
  thumbnail: string | null;
  url: string;
  count?: number;
}
