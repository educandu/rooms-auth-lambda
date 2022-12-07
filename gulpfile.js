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

let bundler = null;
let currentApp = null;

Graceful.on('exit', async () => {
  bundler?.rebuild?.dispose();
  await currentApp?.waitForExit();
});

export async function clean() {
  await deleteAsync(['dist', 'pack', 'coverage']);
}

export async function lint() {
  await eslint.lint(['*.js', 'src/**/*.js'], { failOnError: !currentApp });
}

export async function fix() {
  await eslint.fix(['*.js', 'src/**/*.js']);
}

export function test() {
  return vitest.coverage();
}

export function testWatch() {
  return vitest.watch();
}

export async function build() {
  if (bundler?.rebuild) {
    await bundler.rebuild();
  } else {
    bundler = await esbuild.bundle({
      entryPoints: ['src/lambda/index.js'],
      target: ['node16'],
      platform: 'node',
      format: 'cjs',
      splitting: false,
      incremental: !!currentApp,
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

export function setupWatchers(done) {
  gulp.watch(['src/**/*.js'], gulp.series(build, restartServer));
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export default startWatch;
