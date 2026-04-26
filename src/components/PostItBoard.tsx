import type { CSSProperties } from "react";
import { Trash2 } from "lucide-react";
import { getStanceLabel } from "../lib/stats";
import type { DebatePost } from "../types";

type PostItBoardProps = {
  posts: DebatePost[];
  canDelete?: boolean;
  onDelete?: (postId: string) => void;
};

export function PostItBoard({ posts, canDelete = false, onDelete }: PostItBoardProps) {
  if (posts.length === 0) {
    return (
      <section className="board board--empty" aria-label="토론 의견 보드">
        <p>아직 제출된 의견이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="board" aria-label="토론 의견 보드">
      {posts.map((post, index) => (
        <article
          className={`postit postit--${post.stance}`}
          key={post.id}
          style={{ "--tilt": `${(index % 5) - 2}deg` } as CSSProperties}
        >
          <header>
            <span>{getStanceLabel(post.stance)}</span>
            {canDelete ? (
              <button
                className="icon-button icon-button--small"
                type="button"
                aria-label={`${post.studentName} 의견 삭제`}
                onClick={() => onDelete?.(post.id)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            ) : null}
          </header>
          <p>{post.reason}</p>
          <footer>{post.studentName}</footer>
        </article>
      ))}
    </section>
  );
}
