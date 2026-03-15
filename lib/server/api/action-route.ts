import { NextResponse } from 'next/server';

type ActionHandler = (...args: any[]) => Promise<any>;

export type ActionMap = Record<string, ActionHandler>;

type ActionRequestBody = {
  action?: string;
  args?: unknown[];
};

export function createActionRoute(actionMap: ActionMap) {
  return async function POST(request: Request) {
    try {
      const body = (await request.json()) as ActionRequestBody;
      const actionName = body?.action;
      const args = Array.isArray(body?.args) ? body.args : [];

      if (!actionName) {
        return NextResponse.json(
          { success: false, error: 'Missing action name' },
          { status: 400 }
        );
      }

      const handler = actionMap[actionName];
      if (!handler) {
        return NextResponse.json(
          { success: false, error: `Unsupported action: ${actionName}` },
          { status: 400 }
        );
      }

      const result = await handler(...args);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected API error';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  };
}