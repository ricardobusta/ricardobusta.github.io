My personal blog. 
Posts about technology and stuff.

# Setup

Needs to install Ruby in order to execute bundle commands

On MacOS make sure you are not using system's Ruby. 
Install brew, then ruby, and add everything to appropriate .profile

# Commands

## Publish
```sh
bundle exec jekyll serve
```

## Update
```sh
bundle
bundle update
```

## Just Build, not serve
```sh
bundle exec jekyll build
```

## Serve with drafts
Enable draft posts in order to preview them
```sh
bundle exec jekyll serve --drafts
```

## UiKit setup

```
npm install -g yarn
yarn
yarn compile
yarn watch
```

## Update project pictures

place source images under `_srcassets/projects`
then run 
```shell
node .\generateAssets.js 
```

## Check Gem versions
https://pages.github.com/versions/