import { createSuccessStory, getSuccessStories } from '@/lib/actions/story.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getSuccessStories,
  createSuccessStory,
});