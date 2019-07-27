## Publish to Dev.to

Very simple ts-node based script to publish my blog posts to dev.to. This library is not something generic (although it could be transformed to a npm package) and just made for **for my own purpose**. Use it at your own risk, but feel free to take the code & adjust it to your own needs (and PR back).

### Usage

First of all, grab a token [from dev.to](https://dev.to/api), create a `config.json` that looks as follows:

```
{
  "token": "<your-token>"
}

```

Make sure you do not publish this of course.

Next to use it, exec an `npm install` and then..

```
$ npx ts-node bin/pubdevto.ts pub ~/blog/content/blog/2019-07-10-testing-cypress-intro.md
```

There are a couple of options

- `--dry-run` to only simulate the transformation of the original post and prints it to the stdout
- `--excerpt-only` creates only 50% of the post and then a "Read more..." with a link to the original post
- `--include-blog-link` adds a preface to the post with a note that this post has been cross posted
