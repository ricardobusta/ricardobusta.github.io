My personal blog. 
Posts about technology and stuff.

# Setup

Needs to install Ruby in order to execute bundle commands

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
Enables drafts posts in order to preview them
```sh
bundle exec jekyll serve --drafts
```

## Preprocessors

Due to security reasons, Jekyll custom plugins are disabled. For that reason, any pre-processing has to be executed locally and commited to the repository.

```sh
# run prebuild
python .\prebuild.py
```

python dependency management
```sh
# save dependencies to file
pip freeze > .\python_requirements.txt  
# install dependencies
pip install -r .\python_requirements.txt
```