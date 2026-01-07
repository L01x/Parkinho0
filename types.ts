
export type Point = {
  x: number;
  y: number;
};

export type ShapeType = 'path' | 'rectangle' | 'circle' | 'text';

export interface BaseShape {
  id: string;
  type: ShapeType;
  color: string;
  thickness: number;
}

export interface PathShape extends BaseShape {
  type: 'path';
  points: Point[];
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export type Shape = PathShape | RectangleShape | CircleShape | TextShape;

export type Tool = 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'hand' | 'select';

// Added 'parkinho' as a status
export type IdeaStatus = 'draft' | 'parkinho' | 'backlog' | 'analyzing' | 'approved' | 'rejected';

export interface Idea {
  __backendId?: string;
  idea_name: string;
  idea_author: string;
  idea_tags?: string;
  idea_status: IdeaStatus;
  idea_folder_id?: string;
  idea_is_favorite: boolean;
  idea_drawing_data: string; // JSON string of Shape[]
  idea_thumbnail_data: string;
  idea_order: number;
  idea_created_at: string;
}

export interface Folder {
  __backendId?: string;
  folder_name: string;
  folder_created_at: string;
}

declare global {
  interface Window {
    dataSdk: {
      init: (cb: (data: any[]) => void) => void;
      create: (item: any) => Promise<{ isOk: boolean; data?: any; error?: any }>;
      update: (item: any) => Promise<{ isOk: boolean; error?: any }>;
      delete: (id: string) => Promise<{ isOk: boolean; error?: any }>;
    }
  }
}
