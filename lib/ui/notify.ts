import { sileo, type SileoOptions } from 'sileo';

type NotifyOpts = {
  title: string;
  description?: SileoOptions['description'];
  duration?: number | null;
};

const DEFAULT_DURATION = 3500;

export const notify = {
  success: ({ title, description, duration = DEFAULT_DURATION }: NotifyOpts) =>
    sileo.success({ title, description, duration }),
  error: ({ title, description, duration = DEFAULT_DURATION }: NotifyOpts) =>
    sileo.error({ title, description, duration }),
  info: ({ title, description, duration = DEFAULT_DURATION }: NotifyOpts) =>
    sileo.info({ title, description, duration }),
  warning: ({ title, description, duration = DEFAULT_DURATION }: NotifyOpts) =>
    sileo.warning({ title, description, duration }),
  promise: sileo.promise,
};
