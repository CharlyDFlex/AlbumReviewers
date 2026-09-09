// Hand-written to match supabase/schema.sql, in the same shape the Supabase
// CLI produces (`npx supabase gen types typescript`) so PostgREST embedded
// selects (e.g. `.select("*, artist:artists(*)")`) type-check correctly.
// If you evolve the schema, prefer regenerating this file with that command.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: "user" | "discjockey";
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "user" | "discjockey";
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "user" | "discjockey";
        };
        Relationships: [];
      };
      artists: {
        Row: {
          id: string;
          name: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          image_url?: string | null;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          artist_id: string;
          title: string;
          cover_url: string | null;
          release_date: string | null;
          description: string | null;
          genre: string | null;
          // Denormalized by the update_album_rating_stats trigger — never
          // set these from application code.
          ratings_count: number;
          avg_rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          title: string;
          cover_url?: string | null;
          release_date?: string | null;
          description?: string | null;
          genre?: string | null;
          created_at?: string;
        };
        Update: {
          artist_id?: string;
          title?: string;
          cover_url?: string | null;
          release_date?: string | null;
          description?: string | null;
          genre?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      tracks: {
        Row: {
          id: string;
          album_id: string;
          track_number: number;
          title: string;
          duration_seconds: number | null;
        };
        Insert: {
          id?: string;
          album_id: string;
          track_number: number;
          title: string;
          duration_seconds?: number | null;
        };
        Update: {
          track_number?: number;
          title?: string;
          duration_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
        ];
      };
      album_ratings: {
        Row: {
          id: string;
          user_id: string;
          album_id: string;
          rating: number | null;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          album_id: string;
          rating?: number | null;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: number | null;
          review?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "album_ratings_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "album_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      track_ratings: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "track_ratings_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "track_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listens: {
        Row: {
          id: string;
          user_id: string;
          album_id: string;
          listened_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          album_id: string;
          listened_at?: string;
          created_at?: string;
        };
        Update: {
          listened_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listens_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          platform: "spotify" | "deezer" | "itunes";
          url: string;
          title: string | null;
          external_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: "spotify" | "deezer" | "itunes";
          url: string;
          title?: string | null;
          external_id?: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      spotify_connections: {
        Row: {
          user_id: string;
          spotify_user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          spotify_user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          spotify_user_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spotify_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          album_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          album_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "watchlist_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "watchlist_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      discjockey_requests: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "approved" | "rejected";
          message: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "approved" | "rejected";
          message?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        // Approving/rejecting is left to the dashboard (service role) —
        // there's no RLS policy letting application code update this row.
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "discjockey_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      distinct_album_genres: {
        Args: Record<string, never>;
        Returns: { genre: string }[];
      };
      distinct_album_years: {
        Args: Record<string, never>;
        Returns: { year: number }[];
      };
      random_unlistened_albums: {
        Args: { target_user_id: string; result_limit?: number };
        Returns: Database["public"]["Tables"]["albums"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Artist = Database["public"]["Tables"]["artists"]["Row"];
export type Album = Database["public"]["Tables"]["albums"]["Row"];
export type Track = Database["public"]["Tables"]["tracks"]["Row"];
export type AlbumRating = Database["public"]["Tables"]["album_ratings"]["Row"];
export type TrackRating = Database["public"]["Tables"]["track_ratings"]["Row"];
export type Listen = Database["public"]["Tables"]["listens"]["Row"];
export type WatchlistEntry = Database["public"]["Tables"]["watchlist"]["Row"];
export type Playlist = Database["public"]["Tables"]["playlists"]["Row"];
export type DiscjockeyRequest = Database["public"]["Tables"]["discjockey_requests"]["Row"];

export type AlbumWithArtist = Album & { artist: Artist };
