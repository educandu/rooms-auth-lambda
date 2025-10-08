import path from 'path';
import gulp from 'gulp';
import { deleteAsync } from 'del';
import Graceful from 'node-graceful';
import {
  cliArgs,
  createGithubRelease,
  createLabelInJiraIssues,
  createReleaseNotesFromCurrentTag,
  ensureIsValidSemverTag,
  esbuild,
  eslint,
  vitest,
  NodeProcess,
  writeZipFile
} from '@educandu/dev-tools';

let currentApp = null;
let isInWatchMode = false;
let currentAppBuildContext = null;

Graceful.on('exit', async () => {
  await currentAppBuildContext?.dispose();
  await currentApp?.waitForExit();
});

export async function clean() {
  await deleteAsync(['dist', 'pack', 'coverage']);
}

export async function lint() {
  await eslint.lint('**/*.js', { failOnError: !isInWatchMode });
}

export async function fix() {
  await eslint.fix('**/*.js');
}

export async function test() {
  await vitest.coverage();
}

export async function testWatch() {
  await vitest.watch();
}

export async function build() {
  if (currentAppBuildContext) {
    await currentAppBuildContext.rebuild();
  } else {
    // eslint-disable-next-line require-atomic-updates
    currentAppBuildContext = await esbuild.bundle({
      entryPoints: ['src/lambda/index.js'],
      target: ['node20'],
      platform: 'node',
      format: 'cjs',
      splitting: false,
      incremental: isInWatchMode,
      sourcemap: false,
      outfile: './dist/index.js'
    });
  }

  await writeZipFile('./pack/lambda.zip', {
    'index.js': './dist/index.js'
  });
}

export async function startServer() {
  currentApp = new NodeProcess({
    script: 'src/dev-server/run.js',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: 10000,
      CDN_BASE_URL: 'http://localhost:9000/dev-educandu-cdn',
      WEBSITE_BASE_URL: 'http://localhost:3000'
    }
  });

  await currentApp.start();
}

export async function restartServer() {
  await currentApp.restart();
}

export function verifySemverTag(done) {
  ensureIsValidSemverTag(cliArgs.tag);
  done();
}

export async function release() {
  const { currentTag, releaseNotes, jiraIssueKeys } = await createReleaseNotesFromCurrentTag({
    jiraBaseUrl: cliArgs.jiraBaseUrl,
    jiraProjectKeys: cliArgs.jiraProjectKeys.split(',')
  });

  await createGithubRelease({
    githubToken: cliArgs.githubToken,
    currentTag,
    releaseNotes,
    files: [path.resolve('./pack/lambda.zip')]
  });

  await createLabelInJiraIssues({
    jiraBaseUrl: cliArgs.jiraBaseUrl,
    jiraUser: cliArgs.jiraUser,
    jiraApiKey: cliArgs.jiraApiKey,
    jiraIssueKeys,
    label: currentTag
  });
}

export const serve = gulp.series(build, startServer);

export const verify = gulp.series(lint, test, build);

export function setupWatchMode(done) {
  isInWatchMode = true;
  done();
}

export function setupWatchers(done) {
  gulp.watch(['src/**/*.js'], gulp.series(build, restartServer));
  done();
}

export const watch = gulp.series(setupWatchMode, serve, setupWatchers);

export default watch;
