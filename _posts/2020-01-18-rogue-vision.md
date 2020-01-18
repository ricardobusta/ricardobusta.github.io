---
title: Roguelike Fog/Vision algorithm
tags: [Game Dev, Unity, Roguelike]
---

During my earliest prototypes, back in 2017, I decided to use raycasting as the way to go for the fog or vision algorithm.

It was quite simple: You get a "bounding area" around the player character, cast one ray to each tile in the grid, and wall tiles, that required a collider, and if the ray did hit something, it meant the tile was not visible.

<!--more-->

*insert raycasting image here*

Since I intended to add more options to tiles, like allowing them to block light but not movement and vice versa, and avoid having a mesh to the grid, I decided to bake the vision information in a simpler structure.

*insert collider mesh image here*

I assumed the vision will always be relative to the character position. Since light travels in a straight line, it should always come from one adjacent block. If that block is blocked already, by another block, then the current block is blocked as well.

*insert image of a single ray being cast and hitting a single tile*

To calculate the adjacency structure, I created a complete mesh, with all tiles blocking light, and launched a ray from each tile towards the central position. The first hit corresponds to the tile that can block the other tile. This "light spread information" was added in reverse to the hit tile, meaning that it can lit the tiles that cast a ray to it.

The result is the following structure:

*insert struct code*

And the data generated with the parameters I set is the following:

*insert the generated data*

The algorithm then works as follows: You start with the central position, as an always visible tile. Then light spreads to adjacency tiles. Each not-calculated adjacency is then added to the calculation queue. By the end, you have sort of a "flooding" algorithm that will fill all tiles connected to the central tiles by visibility. And the result is as follows:

*insert result image*