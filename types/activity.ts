export type ActivityEventType =
  | "ADDED_GAME"
  | "REVIEWED"
  | "COMPLETED"
  | "STARTED_PLAYING"
  | "THREAD_CREATED";

export type GameEventMetadata = {
  gameId: string;
  gameTitle: string;
  gameSlug: string;
  gameCoverUrl: string | null;
};

export type ReviewEventMetadata = GameEventMetadata & {
  reviewTitle: string;
  reviewRating: number;
};

export type ThreadEventMetadata = {
  threadTitle: string;
  threadSlug: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
};
