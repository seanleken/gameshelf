"use client";

import { useState, useEffect } from "react";
import { ReplyCard } from "./reply-card";
import { ReplyComposer } from "./reply-composer";
import type { ReplyWithAuthor } from "@/lib/services/forum";

interface ReplyTreeProps {
  initialReplies: ReplyWithAuthor[];
  threadId: string;
  currentUserId?: string;
  isThreadAuthor: boolean;
}

type ReplyNode = ReplyWithAuthor & { children: ReplyNode[] };

function buildTree(replies: ReplyWithAuthor[]): ReplyNode[] {
  const map = new Map<string, ReplyNode>();
  const roots: ReplyNode[] = [];

  for (const reply of replies) {
    map.set(reply.id, { ...reply, children: [] });
  }

  for (const reply of replies) {
    const node = map.get(reply.id)!;
    if (reply.parentId && map.has(reply.parentId)) {
      map.get(reply.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function renderNode(
  node: ReplyNode,
  props: Omit<ReplyTreeProps, "initialReplies">,
  handlers: {
    onReplyCreated: (reply: ReplyWithAuthor) => void;
    onDeleted: (id: string) => void;
    onUpdated: (reply: ReplyWithAuthor) => void;
  },
  depth = 0,
) {
  return (
    <div key={node.id} className="space-y-3">
      <ReplyCard
        reply={node}
        currentUserId={props.currentUserId}
        isThreadAuthor={props.isThreadAuthor}
        threadId={props.threadId}
        onReplyCreated={handlers.onReplyCreated}
        onDeleted={handlers.onDeleted}
        onUpdated={handlers.onUpdated}
        depth={depth}
      />
      {node.children.length > 0 && (
        <div className="ml-8 space-y-3">
          {node.children.map((child) =>
            renderNode(child, props, handlers, Math.min(depth + 1, 3)),
          )}
        </div>
      )}
    </div>
  );
}

export function ReplyTree({
  initialReplies,
  threadId,
  currentUserId,
  isThreadAuthor,
}: ReplyTreeProps) {
  const [replies, setReplies] = useState<ReplyWithAuthor[]>(initialReplies);
  const [tree, setTree] = useState<ReplyNode[]>(() => buildTree(initialReplies));

  useEffect(() => {
    setTree(buildTree(replies));
  }, [replies]);

  function handleReplyCreated(reply: ReplyWithAuthor) {
    setReplies((prev) => [...prev, reply]);
  }

  function handleDeleted(id: string) {
    setReplies((prev) => prev.filter((r) => r.id !== id));
  }

  function handleUpdated(updated: ReplyWithAuthor) {
    setReplies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const handlers = { onReplyCreated: handleReplyCreated, onDeleted: handleDeleted, onUpdated: handleUpdated };
  const treeProps = { threadId, currentUserId, isThreadAuthor };

  return (
    <div className="space-y-6">
      {/* Reply count header */}
      <div className="flex items-center gap-3 border-b border-subtle pb-4">
        <h2 className="text-text-primary font-semibold">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </h2>
      </div>

      {/* Reply list */}
      {tree.length === 0 ? (
        <p className="text-text-tertiary text-sm py-4">
          No replies yet. Be the first to respond!
        </p>
      ) : (
        <div className="space-y-4">
          {tree.map((node) => renderNode(node, treeProps, handlers, 0))}
        </div>
      )}

      {/* Bottom composer */}
      {currentUserId ? (
        <div className="border-t border-subtle pt-6">
          <ReplyComposer
            threadId={threadId}
            onSuccess={handleReplyCreated}
            placeholder="Share your thoughts… (Markdown supported)"
          />
        </div>
      ) : (
        <div className="border-t border-subtle pt-6 text-center">
          <p className="text-text-secondary text-sm">
            <a href="/login" className="text-accent hover:underline">
              Sign in
            </a>{" "}
            to post a reply.
          </p>
        </div>
      )}
    </div>
  );
}
