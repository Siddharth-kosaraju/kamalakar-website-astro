import { CodeBuildClient, StartBuildCommand, BatchGetBuildsCommand } from '@aws-sdk/client-codebuild';

const codebuild = new CodeBuildClient({});
const PROJECT_NAME = process.env.CODEBUILD_PROJECT_NAME;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.rawPath || event.path;

  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };

  try {
    if (method === 'POST' && path.endsWith('/publish')) {
      const out = await codebuild.send(new StartBuildCommand({ projectName: PROJECT_NAME }));
      return json(202, {
        buildId: out.build.id,
        buildStatus: out.build.buildStatus,
        startedAt: out.build.startTime,
      });
    }

    const buildId = event.pathParameters?.buildId;
    if (method === 'GET' && buildId) {
      const out = await codebuild.send(new BatchGetBuildsCommand({ ids: [buildId] }));
      const build = out.builds?.[0];
      if (!build) return json(404, { error: 'Build not found' });
      return json(200, {
        buildId: build.id,
        buildStatus: build.buildStatus,
        currentPhase: build.currentPhase,
        startTime: build.startTime,
        endTime: build.endTime,
      });
    }

    return json(404, { error: 'Route not found' });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Internal error', message: err.message });
  }
};
