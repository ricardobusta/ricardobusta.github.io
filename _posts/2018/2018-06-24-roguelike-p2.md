---
layout: post
title: Roguelike - Parte 2 - Pixel Perfection
time: '20:32'
tags: [GameDev, Roguelike]
---

Aqui começarei a falar de aspectos mais técnicos e decisões de design do jogo. Caso não tenha visto, na parte 1 explico como nasceu a ideia do projeto: 

[(Roguelike - Part 1)](http://busta.com.br/post/2018/06/24/roguelike-p1/)

# Pixel Perfect

Um problema que tive logo de cara quando comecei a fazer o projeto foi montar a cena de testes. Eu ia começar o desenvolvimento pela movimentação do personagem, mas logo de cara me deparei com um problema bem óbvio. A renderização estava zoadissima. 

![]({{ site.img }}/2018/rogue/p2/01.png)

Por que isso acontece? Porque A minha cena tem um número de **pixels** (que como estão medidos em espaço de textura irei me referenciar a eles como "**texels**" daqui pra frente) que precisam ser desenhados em uma tela que tem um número diferente de **pixels**. Se meu número de **pixels** não for um múltiplo do meu número de texels nas duas direções (*x* e *y*), só duas coisas podem acontecer, dependendo da escolha da técnica de amostragem:

1) Point Filter: A cor do pixel será a cor do texel mais próximo de sua coordenada. Se minha cena tem 2 texels, e minha tela tem 3 pixels, o pixel do meio terá de ser colorido com a cor do pixel da esquerda ou o pixel da direita. O resultado disso é que alguns texels vão ser vistos com tamanhos diferentes na hora que forem renderizados.

2) Interpolação (Bilinear, Trilinear etc): Dada a mesma situação de 2 texels e 3 pixels, o algoritmo irá usar uma combinação das duas cores dos pixels da esquerda e da direita para gerar uma terceira cor que será usada para pintar o pixel do meio. De todos os casos, esse é o pior para o nosso jogo de pixel art, pois isso vai borrar toda a imagem!

Então a única saída é garantir que cada texel seja desenhado na tela com o mesmo número de pixels (1x1, 2x2, 3x3 etc).

Depois de quebrar muito a cabeça, e ver várias soluções feitas pelas pessoas nas internets, resolvi conversar com meu amigo Felipe Lira. Ele é um dos caras que eu conheço que manja mais de Unity e de Computação Gráfica em geral (Valeu Felipe!) e me ajudou a ter um insight de como resolver o problema.

# Primeira Técnica

A ideia inicialmente era ter uma câmera que iria renderizar a cena em uma textura com tamanho fixo usando a técnica Render to Texture, onde em vez da câmera jogar a imagem direto no buffer que vai para o video, ele vai para uma região de memória separada (Uma Textura! :v).

Dessa forma, eu consegui mapear 1 pixel do meu jogo para 1 pixel dessa textura.

A segunda parte dessa técnica envolve usar o CommandBuffer. O CommandBuffer basicamente é uma estrutura que me permite passar uma sequência de comandos para uma câmera da Unity. O que meu CommandBuffer estava fazendo era renderizando um quad, que é uma malha poligonal contendo quatro vértices, formando um quadrado. E nesse quadrado, o que estava sendo desenhado era a textura que veio do passo anterior.

Então tudo que precisava ser feito era algumas contas que iriam determinar as posições dos vértices do retângulo contendo a cena, para que os texels ficassem alinhados com a câmera.

Para determinar a conta, eu tive de tomar algumas decisões:

1. Meu jogo será jogável tanto em landscape mode como em portrait mode. Para que isso seja possível, minha textura tinha de ser quadrada.
2. Como a tela do device normalmente não é quadrada, ou uma parte da janela ficaria com tarjas pretas ao longo da maior dimensão, ou uma parte da minha cena teria de ser cortada fora, ficando para fora da janela (bleeding). Eu optei pela segunda opção.
3. Como uma parte da área de jogo seria cortada fora, eu teria que garantir que pelo menos uma porção mínima da minha área de jogo seria visível em qualquer *aspect ratio*. Spoiler: Foi isso que me fez desistir dessa técnica.

As imagens a seguir são para ilustrar o que estou falando sobre as margens. É importante notar que dependendo do dispositivo que você estiver olhando meu blog, a imagem pode ser redimensionada, e vai impossibilitar de ver o pixel perfect funcionando (Provavelmente vão formar padrões. <https://pt.wikipedia.org/wiki/Padr%C3%A3o_moir%C3%A9>).

![]({{ site.img }}/2018/rogue/p2/02.png)

Uma margem pode ser adicionada nas duas direções, mas toda a textura é visível.

![]({{ site.img }}/2018/rogue/p2/03.png)

A textura original está cortada, perdendo informação nas duas direções.

Esse era o trecho do protótipo do algoritmo que era executado sempre que a resolução ou orientação da tela mudasse:

```c#
// Start()
mesh = new Mesh();
mesh.SetVertices(vertex);
mesh.SetIndices(index, MeshTopology.Quads, 0);
mesh.SetUVs(0, uvs);

var commands = new CommandBuffer();
commands.DrawMesh(mesh, Matrix4x4.identity, PixelMaterial, 0);

camera.AddCommandBuffer(CameraEvent.AfterEverything, commands);
```

```c#
// When resolution changes
camera.orthographicSize = Mathf.Ceil(screenHeight / 2.0f);

int scaleFactor = Mathf.Ceil(Mathf.Max(screenWidth, screenHeight) / (float)BaseResolution);
int scale = BaseResolution * scaleFactor;
Vector3 offset = Vector2.one * (BaseResolution / 2.0f * scaleFactor);

vertex[0] = new Vector3(0, 0, 0) * scale - offset;
vertex[1] = new Vector3(1, 0, 0) * scale - offset;
vertex[2] = new Vector3(1, 1, 0) * scale - offset;
vertex[3] = new Vector3(0, 1, 0) * scale - offset;

mesh.SetVertices(vertex);
```

E pronto! Isso simplesmente funcionava. Mas como eu citei no ponto #3, isso limitava minha área de jogo, já que eu tinha um tamanho máximo, e boa parte disso seria cortado.

Eu precisava garantir um mínimo de visualização, e não queria ter de me preocupar com o máximo (estou de olho em vocês, devices com aspect ratios bizarros.). Ficar redimensionando a textura me parecia uma péssima ideia.

# Segunda Técnica

Olhando para a implementação anterior, dá para ver um trecho interessante:
```c#
camera.orthographicSize = Mathf.Ceil(screenHeight / 2.0f);
```

Isso foi feito para que eu pudesse setar a posição dos vértices em coordenadas de pixels da câmera, e simplificar minhas contas (em vez de ter de trabalhar com floats quebradissimos, poderia trabalhar no domínio dos inteiros).

Mas aí eu percebi que era exatamente isso que eu precisava. Se eu conseguia mudar a noção de *Pixels Per Unit* da câmera, já seria uma solução relativamente boa para o meu problema, e a implementação ficaria bem mais simples!

Então, depois de alguns testes, cheguei ao seguinte resultado:

```c#
var scale = Mathf.Floor(Mathf.Min(Screen.width, Screen.height) / Size);
cam.orthographicSize = Screen.height / (2.0f*scale);
```

E pronto! Veja que eu optei por usar Mathf.Min, o que me fez usar o menor lado da tela como base para meus cálculos, enquanto eu vou ignorar o maior lado da tela, e deixar caber o que couber.

Como o jogo terá fog, mostrar mais áreas do jogo não trará muita vantagem ao jogador, e não prejudicará jogadores que com a técnica anterior teriam seu campo de visão reduzido.

# Trade off

O que eu ganhei e o que eu perdi ao trocar uma técnica pela outra?

Vantagens:
* Agora posso extender a câmera em uma direção infinitamente, já que não tenho mais uma textura de tamanho fixo me limitando.
* Só preciso de uma câmera para essa técnica! Com a primeira técnica eu não conseguia reaproveitar a câmera usada para o Render to Texture para jogar imagens no display também.
* Mais simples de implementar. O Código foi de várias linhas, e várias estruturas internas sendo criadas para poucas linhas!
* Não preciso criar assets de textura, shader e material por fora
* Suporta bem devices quadrados! 

Desvantagens:
* Preciso movimentar o objeto em posições inteiras para não perder o pixel perfect.
* Rotacionar um objeto não causará aquele efeito retrô de rotação.
* Em resoluções ímpares, um artefato estranho aparece, já que não é possível dividir a resolução por 2. Uma saída para isso sera modificar o viewport pra ignorar o pixel ímpar, mas isso é um corner case que provavelmente nunca vai acontecer.

# Resultados

E o resultado disso tudo é esse:

![]({{ site.img }}/2018/rogue/p2/04.png)

Com a primeira técnica eu garanto um tamanho ao longo da maior dimensão da tela, e perco área de jogo na menor dimensão da tela.

![]({{ site.img }}/2018/rogue/p2/05.png)

Com a segunda técnica, eu garanto uma área mínima de jogo na menor dimensão, e deixando o jogo livre para expandir o quanto for necessário na maior dimensão.

<video width="640" height="480" controls>
  <source src="{{ site.img }}/2018/rogue/p2/v01.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>

No video acima vemos a "rotação retrô" com a primeira técnica. Fica bem maneiro, né?

<video width="640" height="480" controls>
  <source src="{{ site.img }}/2018/rogue/p2/v02.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>

E aqui vemos a rotação esquisitona. Isso tá acontecendo porque os texels são compostos por vários pixels, e quando você rotaciona, cada pixel que compõe ele se move independentemente. :( 

É importante notar que essa solução é ideal para o tipo de jogo que eu desejo projetar, considerando todas as decisões de design que eu devo ter citado no texto acima.

# Conclusão

Após testar tudo, eu percebi que minha implementação de pixel perfect acabou ficando melhor que a do Cardinal Quest 2, que eu estava usando como parâmetro de qualidade! XD

Eu peguei um emulador para executar o jogo simulando devices arbitrários, e percebi que o CQ2 não se comporta muito bem com devices quadrados e com algumas resoluções específicas, comendo quase toda a área de jogo e fazendo a interface ficar maluca.

![]({{ site.img }}/2018/rogue/p2/06.png)

Sei que é um corner case extremo que nunca vai acontecer, mas no CQ2 você perde quase toda sua área de jogo quando está na resolução 800x800. XD

Bom, é isso! Espero ter ajudado alguém que tenha passado pelo mesmo problema que eu.
Se alguém tiver percebido algum equivoco ou tiver uma sugestão melhor de como contornar esse problema, pode entrar em contato comigo! :D 

EDIT (21:54):

Tive uma ideia pra resolver o problema de telas com tamanho impar (isso tava me incomodando no editor):

```c#
var rect = camera.pixelRect;

rect.width = GetEvenPart(screenWidth);
rect.height = GetEvenPart(screenHeight);

camera.pixelRect = rect;

var scale = Mathf.Floor(Mathf.Min(rect.width, rect.height) / Size);
camera.orthographicSize = rect.height / (2.0f*scale);
```

```c#
private static int GetEvenPart(int value) {
  if (value % 2 == 0) {
    return value;
  }

  return value - 1;
}
```

O unico side effect é que vai ficar uma linha preta se a resolução for impar. \*shrug\*