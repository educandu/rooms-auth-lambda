/* eslint-disable no-console, no-process-env, require-atomic-updates, no-await-in-loop */
import del from 'del';
import gulp from 'gulp';
import { EOL } from 'os';
import axios from 'axios';
import JSZip from 'jszip';
import fse from 'fs-extra';
import semver from 'semver';
import gulpif from 'gulp-if';
import esbuild from 'esbuild';
import eslint from 'gulp-eslint';
import { promisify } from 'util';
import ghreleases from 'ghreleases';
import Graceful from 'node-graceful';
import axiosRetry from 'axios-retry';
import { cleanEnv, str } from 'envalid';
import gitSemverTags from 'git-semver-tags';
import commitsBetween from 'commits-between';
import { cliArgs, jest, NodeProcess } from './dev/index.js';

const JIRA_ISSUE_PATTERN = '(EDU|OMA|ELMU)-\\d+';
const JIRA_BASE_URL = 'https://educandu.atlassian.net';

let bundler = null;
let currentApp = null;

Graceful.on('exit', async () => {
  bundler?.rebuild?.dispose();
  await currentApp?.waitForExit();
});

export async function clean() {
  await del(['dist', 'pack', 'coverage']);
}

export function lint() {
  return gulp.src(['*.js', 'src/**/*.js'], { base: './' })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!currentApp, eslint.failAfterError()));
}

export function fix() {
  return gulp.src(['*.js', 'src/**/*.js'], { base: './' })
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(gulpif(file => file.eslint?.fixed, gulp.dest('./')))
    .pipe(eslint.failAfterError());
}

export function test() {
  return jest.coverage();
}

export function testChanged() {
  return jest.changed();
}

export function testWatch() {
  return jest.watch();
}

export async function build() {
  if (bundler?.rebuild) {
    await bundler.rebuild();
  } else {
    bundler = await esbuild.build({
      entryPoints: ['src/index.js'],
      target: ['node14'],
      platform: 'node',
      format: 'cjs',
      bundle: true,
      incremental: !!currentApp,
      sourcemap: false,
      outfile: './dist/index.js'
    });
  }
}

export async function pack() {
  const archive = new JSZip();
  archive.file('index.js', await fse.readFile('./dist/index.js'));
  const buffer = await archive.generateAsync({ type: 'nodebuffer' });
  await fse.ensureDir('./pack');
  await fse.writeFile('./pack/lambda.zip', buffer);
}

export async function startServer() {
  currentApp = new NodeProcess({
    script: 'test-app/index.js',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  await currentApp.start();
}

export async function restartServer() {
  await currentApp.restart();
}

export function verifySemverTag(done) {
  if (!semver.valid(cliArgs.tag)) {
    throw new Error(`Tag ${cliArgs.tag} is not a valid semver string`);
  }
  done();
}

export async function release() {
  const { GITHUB_REPOSITORY, GITHUB_SERVER_URL, GITHUB_ACTOR, GITHUB_TOKEN } = cleanEnv(process.env, {
    GITHUB_REPOSITORY: str(),
    GITHUB_SERVER_URL: str(),
    GITHUB_ACTOR: str(),
    GITHUB_TOKEN: str()
  });

  const [githubOrgaName, githubRepoName] = GITHUB_REPOSITORY.split('/');
  const githubBaseUrl = `${GITHUB_SERVER_URL}/${githubOrgaName}/${githubRepoName}`;

  const [currentTag, previousTag] = await promisify(gitSemverTags)();

  const commits = previousTag
    ? await commitsBetween({ from: previousTag, to: currentTag })
    : await commitsBetween();

  const commitListMarkdown = commits.map(commit => {
    const message = commit.subject
      .replace(/#\d+/g, num => `[\\${num}](${githubBaseUrl}/pull/${num.replace(/^#/, '')})`)
      .replace(new RegExp(JIRA_ISSUE_PATTERN, 'g'), num => `[${num}](${JIRA_BASE_URL}/browse/${num})`);
    const sha = `[${commit.commit.short}](${githubBaseUrl}/tree/${commit.commit.short})`;
    return `* ${message} (${sha})${EOL}`;
  }).join('');

  const releaseNotes = previousTag
    ? `${commitListMarkdown}${EOL}[View all changes](${githubBaseUrl}/compare/${previousTag}...${currentTag})${EOL}`
    : commitListMarkdown;

  console.log(`Creating Github release ${currentTag}`);
  await promisify(ghreleases.create)({ user: GITHUB_ACTOR, token: GITHUB_TOKEN }, githubOrgaName, githubRepoName, {
    // eslint-disable-next-line camelcase
    tag_name: currentTag,
    name: currentTag,
    body: releaseNotes,
    prerelease: !!semver.prerelease(currentTag)
  });

  const client = axios.create({ baseURL: JIRA_BASE_URL });
  axiosRetry(client, { retries: 3 });

  const issueKeys = [...new Set(releaseNotes.match(new RegExp(JIRA_ISSUE_PATTERN, 'g')) || [])].sort();
  for (const issueKey of issueKeys) {
    console.log(`Setting label ${currentTag} on JIRA issue ${issueKey}`);
    try {
      await client.put(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}`,
        { update: { labels: [{ add: currentTag }] } },
        { responseType: 'json', auth: { username: cliArgs.jiraUser, password: cliArgs.jiraApiKey } }
      );
    } catch (error) {
      console.log(error);
    }
  }
}

export const serve = gulp.series(build, startServer);

export const verify = gulp.series(lint, test, build);

export function setupWatchers(done) {
  gulp.watch(['src/**/*.js', 'test-app/**/*.js'], gulp.series(build, restartServer));
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export default startWatch;
