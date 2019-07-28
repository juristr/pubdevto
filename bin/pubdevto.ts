#!/usr/bin/env node

'use strict';
import * as fs from 'fs';
import * as yargs from 'yargs';
import * as axios from 'axios';
import * as matter from 'gray-matter';

interface CommandOptions {
  postfile: string;
  options: {
    dryRun: boolean;
    excerptOnly: boolean;
    includeBlogLink: boolean;
  };
}

function submitToDevTo(content: any) {
  const json = JSON.parse(
    fs.readFileSync('config.json', { encoding: 'utf-8' })
  );

  const devtoArticlesUrl = `https://dev.to/api/articles`;
  axios.default
    .post(devtoArticlesUrl, content, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': json.token
      }
    })
    .then(res => {
      if (res.status === 200 || res.status === 201) {
        console.log('success 🔥');
      } else {
        console.log('error 🚨');
        console.log(res);
      }
    })
    .catch((err: axios.AxiosError) => {
      console.log('error 🚨');
      console.log(err.message);
      console.log(err.response);
    });
}

function cleanedContent(body: string): string {
  // replace ads, intro etc...
  body = body.replace(/{{.*<.*intro.*>.*}}/, '');
  body = body.replace(/{{.*<\/.*intro.*>.*}}/, '');
  body = body.replace(/{{.*<.*postad.*>.*}}/, '');
  body = body.replace(/{{.*<.*toc.*>.*}}/, '');

  // replace images
  body = body.replace(/{{.*<.*figure url="(.*)" size=".*".*>.*}}/g, '![]($1)');
  body = body.replace(
    /<figure.*>[\s\r].*src="(.*)">[\s\r]*<figcaption>.*<\/figcaption>[\s\r]*<\/figure>/g,
    '![]($1)'
  );
  body = body.replace(
    /<figure.*>[\s\r].*src="(.*)">[\s\r]*<\/figure>/g,
    '![]($1)'
  );

  // replace vimeo
  body = body.replace(/{{.*vimeo\s*([0-9]*).*}}/g, '{% vimeo $1 %}');

  // replace youtube
  body = body.replace(/{{.*youtube\s*([\w*0-9]*).*}}/g, '{% youtube $1 %}');

  // replace stackblitz
  body = body.replace(/{{.*stackblitz uid="(.*)">}}/g, '{% stackblitz $1 %}');

  // replace article-link
  body = body.replace(
    /{{.*<.*article-link[\s\S\r]*.*url="(.*)"[\s\S\r]*.*title="(.*)"[\s\S\r]*.*>}}/gm,
    '> Check out my related post about "[$2]($1)"'
  );

  // replace Egghead embeds

  body = body.replace(
    /{{.*egghead-lesson uid="(.*)".*}}/g,
    '[(Click to open Egghead lesson)](https://egghead.io/$1)'
  );

  // fix local relative links
  body = body.replace(/(\[.*\])\((\/.*)\)/g, '$1(https://juristr.com$2)');

  return body;
}

async function main(command: CommandOptions) {
  const postContent = matter.read(command.postfile);

  const orgFrontMatter = postContent.data;

  const frontMatter = {
    title: orgFrontMatter['title'],
    canonical_url: `https://juristr.com${orgFrontMatter['url']}`,
    published: false,
    description: orgFrontMatter['lead'].replace(/`/g, ''),
    cover_image: `https://juristr.com${orgFrontMatter['image']}`
  };

  if (orgFrontMatter['tags']) {
    if (orgFrontMatter['tags'].length > 4) {
      frontMatter['tags'] = orgFrontMatter['tags'].splice(0, 4);
    } else {
      frontMatter['tags'] = orgFrontMatter['tags'];
    }
  }

  let cleanContent = cleanedContent(postContent.content);

  if (command.options.excerptOnly) {
    cleanContent = cleanContent.substr(0, (cleanContent.length * 50) / 100);
    cleanContent += '...';

    cleanContent += `\n\n[Read more &raquo;](${
      frontMatter.canonical_url
    }?utm_source=devto&utm_medium=crosspost)`;
  }

  if (command.options.includeBlogLink) {
    cleanContent = `
_This post has originally been published on [${frontMatter.canonical_url}](${
      frontMatter.canonical_url
    }). Go to [juristr.com/blog](https://juristr.com/blog) for more content_

---
    
${cleanContent}`;
  }

  const content = matter.stringify(cleanContent, frontMatter);

  // dry-run
  if (command.options.dryRun) {
    console.log(content);

    console.log('Dry run completed ✅');
  } else {
    submitToDevTo({
      article: {
        body_markdown: content
      }
    });
  }
}

const commandsObj = yargs
  .usage('Publish markdown based blogpost to dev.to')
  .command(
    'pub [postfile]',
    'publish to dev.to',
    yargs => {
      yargs
        .positional('postfile', {
          type: 'string',
          default: '',
          describe: 'the path to the markdown file'
        })
        .options('dry-run', {
          alias: 'd',
          default: false,
          type: 'boolean'
        })
        .options('excerpt-only', {
          alias: 'e',
          default: false,
          type: 'boolean'
        })
        .options('include-blog-link', {
          alias: 'il',
          default: false,
          type: 'boolean'
        });
    },
    function(argv) {
      main({
        postfile: argv.postfile,
        options: {
          dryRun: argv['dry-run'],
          excerptOnly: argv['excerpt-only'],
          includeBlogLink: argv['include-blog-link']
        }
      }).catch(err => {
        console.error(err);
        process.exit(1);
      });
    }
  )
  .help().argv;
