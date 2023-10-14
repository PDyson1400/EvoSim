# EvolutionSimulator

**Instructions**

Open the evosim.html file

Press space to progress step by step manually, or to pause a running simulation

Press LeftShift to progress step by step automatically

Use controller.play(x) in the console to change the automatic speed, default is 10

In the console it will say the step, the quantified traits of the survivors, and the generation

**Modifying settings**

`const controller = new Controller(500, 10, 1, 4, 300, 10, [0, 0], [0.1, 1]);` in the Controller in #region Running Code

The settings are: quantities, scale, neurons, connections, generationSteps, mutationRate, surviveCoords, surviveSize

quantities - The number of entities generated

scale - The size of each entity, and the map which is based on screen height and width

neurons - The amount of moves an entity can make

connections - The amount of stimuli and outputs a neuron can consider

generationSteps - The amount of time the simulation runs before creating a new generation

mutationRate - The amount of times /100 that a mutation occurs in the connections of a new generation

surviveCoords - The x and y offset of the survival zone, as a percentage of the map size

surviveSize - The size of the survival zone from the offset, as a percentage of the map size


**Fun placements**

`const controller = new Controller(500, 10, 2, 4, 300, 10, [0, 0], [0.02, 1]);`

`const controller = new Controller(500, 10, 2, 4, 300, 10, [0.4, 0.4], [0.2, 0.2]);`

`const controller = new Controller(2000, 1, 2, 4, 500, 10, [0.4, 0.4], [0.2, 0.2]);`

`const controller = new Controller(500, 10, 2, 4, 300, 10, [0.8, 0], [0.2, 0.2]);`

`const controller = new Controller(500, 10, 4, 8, 300, 20, [0.4, 0.4], [0.2, 0.2]);`

`const controller = new Controller(500, 10, 1, 3, 300, 10, [0, 0], [0.2, 1]);`
