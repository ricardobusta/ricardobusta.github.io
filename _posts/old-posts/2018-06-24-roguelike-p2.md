---
title: Roguelike - Parte 2 - Pixel Perfection
time: '20:32'
tags: [GameDev, Roguelike]
---

This will be the first technical post about my game. On part 1 I talk about my motivations to create this project:

[(Roguelike - Part 1)](https://busta.dev/blog/2018/06/24/roguelike-p1/)

# Pixel Perfect

The first problem I had when I started making the test scene. I started the development with the character movement, but I noticed a pretty obvious problem:

![](/assets/blog/2018/rogue/01.png)

My screen has a certain amount of "**pixels**" (**texels**) that must be rendered in a screen with a different amount of **pixels**. If the number is not a multiple of the other one, in both directions, there will be an offset. 

If you turn on the filtering, the intermediary pixel will be filled with a blended color of the two texels. That's not desired in a pixel art game.

If you leave the filter off, it means the extra pixel will be filled with any neighbour texel, making some of them bigger or smaller than the others. 

The only way to ensure pixel perfection is, then, ensure each texel is represented by a fixed amount of pixels (1x1, 2x2, 3x3 etc).

# First Idea

Initially I would have a camera that renders the scene into a fixed size texture, setting it as it's target. This way, I have control over the "screen size", even if it's a virtual one.

Using the CommandBuffer, then, I can render a quad and set the previously rendered texture to it. All I needed to do was to mess either with the vertex position or the UV to position the texture inside the camera quad.

For the calculations, I did some considerations:

1. My game would be playable both in landscape and portrait mode. For that to work, my texture would have to be a square.
2. As the device screen is usually not a square, a portion of the texture must be cropped off. The other option would be add a bleeding area, but for my game that does not sound ideal.
3. Considering number 2, I had to do something to ensure a minimal playable area would be visible within any aspect ratio.

The following images illustrate what I am talking about. Note: Depending if you are seeing the pictures on the computer or the cellphone, some patterns might show up due to the browser scaling them. <https://en.wikipedia.org/wiki/Moir%C3%A9_pattern>.

![](/assets/blog/2018/rogue/02.png)

![](/assets/blog/2018/rogue/03.png)

This script was executed every time the device resolution changed:

```csharp
// Start()
mesh = new Mesh();
mesh.SetVertices(vertex);
mesh.SetIndices(index, MeshTopology.Quads, 0);
mesh.SetUVs(0, uvs);

var commands = new CommandBuffer();
commands.DrawMesh(mesh, Matrix4x4.identity, PixelMaterial, 0);

camera.AddCommandBuffer(CameraEvent.AfterEverything, commands);
```

```csharp
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

The downside of this technique is that I would have a limited game area, and a portion of it would be cropped out. This gava me a second idea, which would not require scaling the texture when rotating the device, and would not require cropping a huge portion of the rendered texture.

# Second Idea

After checing the previous implementation, I noticed this:
```csharp
camera.orthographicSize = Mathf.Ceil(screenHeight / 2.0f);
```

This was done to set the vertex positions in camera's pixels coordinates, and make my calculations easier (instead of using broken numbers, I could use "integers").

Then I noticed that was exactly what I needed. If I could keep the Camera *Pixel Per Unit* notion, that would be a good enough solution to my problem, and implementation would become a lot easier!

Then, after some testing, I came with the following result:

```csharp
var scale = Mathf.Floor(Mathf.Min(Screen.width, Screen.height) / Size);
cam.orthographicSize = Screen.height / (2.0f*scale);
```

Using the min value, I could use the smallest screen side as the base of my calculations, ignoring the biggest size and allowing whanever could fit in.

As the game haves a fog to cover the view, showing extra areas of the game will not give players with bigger screens any advantage.

# Trade off

What changed when I decided to go with the second solution?

Pros:
* Agora posso extender a câmera em uma direção infinitamente, já que não tenho mais uma textura de tamanho fixo me limitando.
* Só preciso de uma câmera para essa técnica! Com a primeira técnica eu não conseguia reaproveitar a câmera usada para o Render to Texture para jogar imagens no display também.
* Mais simples de implementar. O Código foi de várias linhas, e várias estruturas internas sendo criadas para poucas linhas!
* Não preciso criar assets de textura, shader e material por fora
* Suporta bem devices quadrados! 

Cons:
* Preciso movimentar o objeto em posições inteiras para não perder o pixel perfect.
* Rotacionar um objeto não causará aquele efeito retrô de rotação.
* Em resoluções ímpares, um artefato estranho aparece, já que não é possível dividir a resolução por 2. Uma saída para isso sera modificar o viewport pra ignorar o pixel ímpar, mas isso é um corner case que provavelmente nunca vai acontecer.

# Results

And the result of all this is:

![](/assets/blog/2018/rogue/04.png)

With the first technique I ensure the size alongside the biggest screen size, and lose some game area on the smallest side.

![](/assets/blog/2018/rogue/05.png)

With the second technique, I ensure a minimum game area in the smallest dimension, and let the game expand whanever it needs in the biggest dimension.

<video width="640" height="480" controls>
  <source src="/assets/blog/2018/rogue/v01.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>

In the above video, we can see the "retro rotation" obtained with the first technique. Cool, huh?

<video width="640" height="480" controls>
  <source src="/assets/blog/2018/rogue/v02.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>

And here we see the weird rotation. This is happening because texels are represented by many pixels, and each pixel moves independently. 😞 

But considering how the game will be played out, those design decisions make this the ideal solution for now.

# Conclusion

After testing everything, I noticed that my pixel perfect solution is better than the benchmark (CQ2 solution).

Using an Android emulator, I simulated arbitrary device aspect ratios and almost all of them made the game interface break weirdly.

![](/assets/blog/2018/rogue/06.png)

It's an extreme corner case, but it's nice to know that my solution covers even those cases.

That's it! I hope anyone having the same issues might find a little help by reading my post.

EDIT 1:

Made a solution for the cases where the size of the editor area is an odd number, avoiding some issues:

```csharp
var rect = camera.pixelRect;

rect.width = GetEvenPart(screenWidth);
rect.height = GetEvenPart(screenHeight);

camera.pixelRect = rect;

var scale = Mathf.Floor(Mathf.Min(rect.width, rect.height) / Size);
camera.orthographicSize = rect.height / (2.0f*scale);
```

```csharp
private static int GetEvenPart(int value) {
  if (value % 2 == 0) {
    return value;
  }

  return value - 1;
}
```

The only downside is that a blank line will be on the even sided portions of the screen. 🤷‍♂️