---
title: Roguelike Part 3 - Fog/Vision Algorithm
tags: [Game Dev, Unity, Roguelike]
---

During my earliest prototypes, back in 2017, I decided to use raycasting as the way to go for the fog or vision algorithm.

It was quite simple: You get a "bounding area" around the player character, cast one ray to each tile in the grid, and wall tiles, that required a collider, and if the ray did hit something, it meant the tile was not visible.

<!--more-->

*insert raycasting image here*

Since I intended to add more options to tiles, like allowing them to block light but not movement and vice versa, and avoid having a mesh to the grid, I decided to bake the vision information in a simpler structure.

![](/assets/blog/2020/rogue/raycasting_grid.png)

I assumed the vision will always be relative to the character position. Since light travels in a straight line, it should always come from one adjacent block. If that block is blocked already, by another block, then the current block is blocked as well.

*insert image of a single ray being cast and hitting a single tile*

To calculate the adjacency structure, I created a complete mesh, with all tiles blocking light, and launched a ray from each tile towards the central position. The first hit corresponds to the tile that can block the other tile. This "light spread information" was added in reverse to the hit tile, meaning that it can lit the tiles that cast a ray to it.

The result is the following structure:

```csharp
public struct FogState
{
    public bool visible;
    public bool calculated;
    public bool blocksLight;
    public int[] spread;
}
```

And the data generated with the parameters I set is the following:

```csharp
FogState[12].spread = new[] {0};
FogState[23].spread = new[] {11, 22};
FogState[34].spread = new[] {33};
FogState[45].spread = new[] {44};
FogState[56].spread = new[] {55};
FogState[67].spread = new[] {66};
FogState[78].spread = new[] {77};
FogState[89].spread = new[] {88, 99};
FogState[100].spread = new[] {110};
FogState[13].spread = new[] {1, 2};
FogState[24].spread = new[] {12};
FogState[35].spread = new[] {23, 34};
FogState[46].spread = new[] {45};
FogState[57].spread = new[] {56};
FogState[68].spread = new[] {67};
FogState[79].spread = new[] {78, 89};
FogState[90].spread = new[] {100};
FogState[101].spread = new[] {111, 112};
FogState[25].spread = new[] {13, 14};
FogState[36].spread = new[] {24};
FogState[47].spread = new[] {35, 46};
FogState[58].spread = new[] {57};
FogState[69].spread = new[] {68, 79};
FogState[80].spread = new[] {90};
FogState[91].spread = new[] {101, 102};
FogState[14].spread = new[] {3};
FogState[37].spread = new[] {25, 26};
FogState[48].spread = new[] {36, 47, 37};
FogState[59].spread = new[] {58};
FogState[70].spread = new[] {69, 80, 81};
FogState[81].spread = new[] {91, 92};
FogState[102].spread = new[] {113};
FogState[15].spread = new[] {4};
FogState[26].spread = new[] {15};
FogState[60].spread = new[] {48, 59, 70, 49, 71, 50, 61, 72};
FogState[92].spread = new[] {103};
FogState[103].spread = new[] {114};
FogState[16].spread = new[] {5};
FogState[27].spread = new[] {16};
FogState[38].spread = new[] {27};
FogState[49].spread = new[] {38};
FogState[71].spread = new[] {82};
FogState[82].spread = new[] {93};
FogState[93].spread = new[] {104};
FogState[104].spread = new[] {115};
FogState[17].spread = new[] {6};
FogState[28].spread = new[] {17};
FogState[39].spread = new[] {28, 29};
FogState[50].spread = new[] {39, 40, 51};
FogState[72].spread = new[] {83, 73, 84};
FogState[83].spread = new[] {94, 95};
FogState[94].spread = new[] {105};
FogState[105].spread = new[] {116};
FogState[18].spread = new[] {7};
FogState[29].spread = new[] {18, 19};
FogState[61].spread = new[] {62};
FogState[95].spread = new[] {106, 107};
FogState[106].spread = new[] {117};
FogState[19].spread = new[] {8, 9};
FogState[40].spread = new[] {30};
FogState[51].spread = new[] {41, 52};
FogState[62].spread = new[] {63};
FogState[73].spread = new[] {74, 85};
FogState[84].spread = new[] {96};
FogState[107].spread = new[] {118, 119};
FogState[30].spread = new[] {20};
FogState[41].spread = new[] {31, 42};
FogState[52].spread = new[] {53};
FogState[63].spread = new[] {64};
FogState[74].spread = new[] {75};
FogState[85].spread = new[] {86, 97};
FogState[96].spread = new[] {108};
FogState[20].spread = new[] {10};
FogState[31].spread = new[] {21, 32};
FogState[42].spread = new[] {43};
FogState[53].spread = new[] {54};
FogState[64].spread = new[] {65};
FogState[75].spread = new[] {76};
FogState[86].spread = new[] {87};
FogState[97].spread = new[] {98, 109};
FogState[108].spread = new[] {120};
```

The grid I used was a 11x11 grid, and the tiles indexes are calculated as `(x + y*11)`. 

The algorithm then works as follows: You start with the central position, as an always visible tile. Then light spreads to adjacency tiles. Each not-calculated adjacency is then added to the calculation queue. By the end, you have sort of a "flooding" algorithm that will fill all tiles connected to the central tiles by visibility. 

```csharp
private void CalculateFog(int index)
{
    FogState[index].calculated = true;
    // Walls are visible as well
    FogState[index].visible = true;

    if (FogState[index].blocksLight)
    {
        // Will not spread light
        return;
    }

    // Spread light to neighbors.
    for (var i = 0; i < FogState[index].spread.Length; i++)
    {
        if (!FogState[i].calculated)
        {
            fogQueue.Enqueue(FogState[index].spread[i]);
        }
    }
}
```

And the result is as follows:

![](/assets/blog/2020/rogue/raycasting_result.png)

I created an interactive version of that algorithm. You can check it here:
*add interactive version*

Check the previous posts about the roguelike game:

[(Roguelike - Part 1)](https://busta.dev/blog/2018/06/24/roguelike-p1/)

[(Roguelike - Part 2)](https://busta.dev/blog/2018/06/24/roguelike-p2/)