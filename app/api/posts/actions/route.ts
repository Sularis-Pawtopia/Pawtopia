import {
  createComment,
  createFeedPost,
  deleteComment,
  deletePost,
  getEventPostByEventId,
  getFeedPosts,
  getPostWithComments,
  getSavedPosts,
  likePost,
  savePost,
  updatePost,
} from '@/lib/actions/post.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  likePost,
  createComment,
  deleteComment,
  getFeedPosts,
  getPostWithComments,
  deletePost,
  updatePost,
  getEventPostByEventId,
  createFeedPost,
  savePost,
  getSavedPosts,
});