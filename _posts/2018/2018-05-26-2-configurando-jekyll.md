---
layout: post
title: Configurando o Jekyll
time: '11:20'
tags: [Blog]
---

Como resolvi voltar a mexer no meu blog depois de muito tempo, resolvi começar pelo problema que estou tendo agora:
Como rodar o **Jekyll** localmente para testar as mudanças no blog?

Primeiro, tem que ter o ruby + devkit instalado (peguei a versão 2.5.1-1_x64)
<https://rubyinstaller.org/downloads/>

Depois, precisa instalar o *bundler*. Se o ruby estiver setado no path, basta executar o comando a seguir:
```
gem install bundler
```

Depois, precisa instalar as dependencias do seu projeto (Que estão no arquivo GemFile) usando o comando:
```
bundle install
```

Caso seu projeto já tenha instalado as dependencias, você pode atualizar elas com 
```
bundle update
```

E por fim você executa um comando para gerar e hostear sua página:
```
bundle exec jekyll serve
```

Vale lembrar que a página ficará no endereço `localhost:4000`

Minha postagem foi só um TL;DR do que eu tive que fazer. Para mais detalhes, ver a página do github que tem um tutorial mais detalhado:
<https://help.github.com/articles/setting-up-your-github-pages-site-locally-with-jekyll/>

Espero ter ajudado alguém!