// #region Functions
function randInt(max)
{
    return Math.floor(Math.random() * max)
}

function choose(array)
{
    return array[randInt(array.length)]
}

function copyArr(array)
{
    newArr = [];
    for(var i = 0; i < array.length; i++)
    {
        newArr.push(array[i]);
    }
    return newArr;
}
//#endregion

// #region Classes
class Neuron
{
    constructor(parent, connections, neuronNumber, entity1 = false, entity2 = false)
    {
        this.stimuli = copyArr(parent.stimuli);
        this.output = copyArr(parent.output);
        this.parent = parent;
        
        this.connections = [];
        this.neuronNumber = neuronNumber;

        for(var i = 0; i < connections; i++)
        {
            if(!entity1 || !entity2)
            {
                this.createRandConnection();
            } else {
                this.inheritConnection(entity1, entity2, i);
            }
        }
    }

    createConnection(stimulus, output)
    {
        const connection = {"stimulus": stimulus, "output": output};
        this.connections.push(connection);
    }

    createRandConnection()
    {
        const stimulus = choose(this.stimuli);
        const result = choose(this.output);

        this.createConnection(stimulus, able, result);
    }

    inheritConnection(entity1, entity2, i)
    {
        const mutation = this.parent.parent.mutationRate;

        const rand = Math.floor(Math.random() * 101);
        const parentRate = (100 - mutation)/2;

        if(rand <= mutation)
        {
            this.createRandConnection();
        } else if (rand > mutation && rand <= mutation + parentRate)
        {
            const entity1NeuronConnection = entity1.neurons[this.neuronNumber].connections[i];
            this.createConnection(entity1NeuronConnection.stimulus, entity1NeuronConnection.output);
        } else {
            const entity2NeuronConnection = entity2.neurons[this.neuronNumber].connections[i];
            this.createConnection(entity2NeuronConnection.stimulus, entity2NeuronConnection.output);
        }
    }

    moveOutput(dir, num)
    {
        return () => {
            if(!this.parent.checkAdjacent(dir, num) && this.parent.withinBounds(dir, num))
            {
                this.parent[dir] += num;
            }
        }
    }

    swapOutput(dir, num)
    {
        return () => {
            const adj = this.parent.checkAdjacent(dir, num);
            if(adj)
            {
                [adj.x, this.parent.x] = [this.parent.x, adj.x];
                [adj.y, this.parent.y] = [this.parent.y, adj.y];
            }
        }
    }

    neuronOutput(num)
    {
        return () => {this.parent.activateNeuron(num)};
    }

    breakdownInput(str)
    {
        let axis, num;
        const split = str.split(/[xy]/i);
        const type = split[0];

        if(split.length > 1)
        {
            axis = str.slice(type.length, type.length + 1).toLowerCase();
            num = Number(split[1]);
        }

        return [type, axis, num];
    }

    stimulate(connectionOutput)
    {
        if(typeof connectionOutput == "number")
        {
            return this.neuronOutput(connectionOutput);
        }

        let outputFunction, type, axis, num;
        [type, axis, num] = this.breakdownInput(connectionOutput);
        const randDir = choose(["x", "y"]);
        const randNum = choose([1, -1]);

        switch(type)
        {
            case "moveRand":
                outputFunction = this.moveOutput(randDir, randNum);
                break;
            case "move":
                outputFunction = this.moveOutput(axis, num);
                break;
            case "swapRand":
                outputFunction = this.swapOutput(randDir, randNum);
                break;
            case "swap":
                outputFunction = this.moveOutput(axis, num);
                break;
            default:
                outputFunction = () => { return false; };
                break;
        }
        return outputFunction
    }

    decCalc(num)
    {
        let calc = 0;

        if(num < 0.5)
        {
            calc = Math.min((4 * (num - 0.5) * (num - 0.5) + 0.1), 1);
        } else {
            calc = 0;
        }

        return calc;
    }

    edgeDetect(dir, num)
    {
        const parentAxis = this.parent[dir];
        const mapAxis = this.parent.parent[`map${dir.toUpperCase()}`];

        if(num < 0)
        {
            return this.decCalc(parentAxis/mapAxis);
        } else {
            return this.decCalc((mapAxis - parentAxis)/mapAxis);
        }
    }

    entityDetect(dir, num)
    {
        let otherAxis, lowestDistance;
        dir == "x" ? otherAxis = "y" : otherAxis = "x";
        const entArray = this.parent.parent[`${otherAxis}Entities`];
        const parentAxis = this.parent[dir];
        const mapAxis =this.parent.parent[`map${dir.toUpperCase()}`];

        (num > 0) ? lowestDistance = mapAxis - parentAxis : lowestDistance = parentAxis;
        const greatestDistance = lowestDistance;

        for(var i = 0; i < entArray.length; i++)
        {
            if(num < 0 && entArray[i][dir] < parentAxis && (parentAxis - entArray[i][dir]) < lowestDistance)
            {
                lowestDistance = parentAxis - entArray[i][dir];
            } else if (num > 0 && entArray[i][dir] > parentAxis && (entArray[i][dir] - parentAxis) < lowestDistance)
            {
                lowestDistance = entArray[i][dir] - parentAxis;
            }
        }

        return this.decCalc(lowestDistance/greatestDistance);  
    }

    spaceDetect(dir, num)
    {
        let otherAxis, lowestDistance;
        dir == "x" ? otherAxis = "y" : otherAxis = "x";
        const entArray = this.parent.parent[`${otherAxis}Entities`];
        const parentAxis = this.parent[dir];
        const mapAxis =this.parent.parent[`map${dir.toUpperCase()}`];

        (num > 0) ? lowestDistance = mapAxis - parentAxis : lowestDistance = parentAxis;
        const greatestDistance = lowestDistance;

        for(var i = 0; i < entArray.length; i++)
        {
            if(num < 0 && entArray[i][dir] < parentAxis && (parentAxis - entArray[i].y) < lowestDistance)
            {
                lowestDistance = parentAxis - entArray[i].y;
            } else if(num > 0 && entArray[i][dir] > parentAxis && (entArray[i][dir] - parentAxis) < lowestDistance)
            {
                lowestDistance = entArray[i].x - parentAxis;
            }
        }

        return this.decCalc((greatestDistance - lowestDistance)/greatestDistance);
    }

    detect(connectionStimulus)
    {
        let value = 0;
        let type, axis, num;
        [type, axis, num] = this.breakdownInput(connectionStimulus);
 
        switch(type)
        {
            case "edge":
                value = this.edgeDetect(axis, num);
                break;
            case "entity":
                value = this.entityDetect(axis, num);
                break;
            case "space":
                value = this.spaceDetect(axis, num);
                break;
        }
        return value;
    }

    evaluate()
    {
        let greatestValue = -1;
        let greatestIndex = -1;
        for(var i = 0; i < this.connections.length; i++)
        {
            const connection = this.connections[i];
            const stimuliValue = this.detect(connection.stimulus);
            if(stimuliValue > greatestValue)
            {
                greatestValue = stimuliValue;
                greatestIndex = i;
            }
        }

        return this.stimulate(this.connections[greatestIndex].output);
    }
}

class Entity
{
    constructor(x, y, neurons, connections, parent, entity1=false, entity2=false)
    {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.connections = connections;
        this.neurons = [];

        this.stimuli = ["edgeX-1", "edgeX1", "edgeY-1", "edgeY1", "entityX-1", "entityX1", "entityY-1", "entityY1", "spaceX-1", "spaceX1", "spaceY-1", "spaceY1"];
        this.output = ["moveX-1", "moveX1", "moveY-1", "moveY1", "moveRand", "swapX-1", "swapX1", "swapY-1", "swapY1", "swapRand", "stop"];

        for(var i = 0; i < neurons; i++)
        {
            !entity1 || !entity2 ? this.createNeuron(i) : this.inheritNeuron(i, entity1, entity2);
            this.output.push(i);
        }

        this.developColour();
    }

    developColour()
    {
        const colourValues = [0, 0, 0];
        const colourCount = [0, 0, 0];
        let index = 0;
        for(var i = 0; i < this.neurons.length; i++)
        {
            if(index > 2)
            {
                index = 0;
            }
            for(var j = 0; j < this.neurons[i].connections.length; j++)
            {
                const connection = this.neurons[i].connections[j];
                colourValues[index] += this.stimuli.indexOf(connection.stimulus)/(this.stimuli.length - 1);
                colourValues[index] += this.output.indexOf(connection.output)/(this.output.length - 1);
                colourCount[index] += 2;
                index++;
            }
        }
        colourCount[1] = Math.max(colourCount[1], 1);
        colourCount[2] = Math.max(colourCount[2], 1);
        let colour1 = 255 * colourValues[0]/colourCount[0];
        let colour2 = 255 * colourValues[1]/colourCount[1];
        let colour3 = 255 * colourValues[2]/colourCount[2];

        this.colour = [colour1, colour2, colour3];
    }

    createNeuron(neuronNumber)
    {
        const neuron = new Neuron(this, this.connections, neuronNumber);
        this.neurons.push(neuron);
    }

    inheritNeuron(neuronNumber, entity1, entity2)
    {
        const neuron = new Neuron(this, this.connections, neuronNumber, entity1, entity2);
        this.neurons.push(neuron);
    }

    checkAdjacent(direction, offset)
    {
        let entityAxis = 0;
        let axis = 0;
        let adjacent = false;
        let otherAxis = "";

        direction == "x" ? otherAxis = "y" : otherAxis = "x";
        axis = this[direction];
        entityAxis = this.parent[`${otherAxis}Entities`][this[otherAxis]];
        
        if(entityAxis == undefined)
        {
            return false;
        }

        for(var i = 0; i < entityAxis.length; i++)
        {
            if(entityAxis[i][direction] == axis + offset)
            {
                adjacent = entityAxis[i];
            }
        }

        return adjacent;
    }

    withinBounds(direction, offset)
    {
        const mapDir = `map${direction.toUpperCase()}`;
        const upperBound = this.parent[mapDir] - 2;

        if(offset > 0)
        {
            return this[direction] < upperBound ? true : false;
        } else if (offset < 0) {
            return this[direction] > 0 ? true : false;
        }
    }

    activateNeuron(i)
    {
        const neuron = this.neurons[i];
        const outcome = neuron.evaluate();
        outcome();
    }

    activateNeurons()
    {
        for(var i = 0; i < this.neurons.length; i++)
        {
            this.activateNeuron(i);
        }
    }
}

class Controller
{
    constructor(quantities, scale, neurons, connections, generationSteps, mutationRate, surviveCoords, surviveSize)
    {
        this.quantities = quantities;
        this.scale = scale;
        this.neurons = neurons;
        this.connections = connections;
        this.generationSteps = generationSteps;
        this.mutationRate = mutationRate;

        this.entities = [];
        this.running = false;
        this.gamespeed = 1;
        this.steps = 0;
        this.generation = 1;
        this.xEntities = {};
        this.yEntities = {};

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.mapX = this.width/this.scale;
        this.mapY = this.height/this.scale;
        this.surviveCoords = [0 + surviveCoords[0] * this.width, 0 + surviveCoords[1] * this.height];
        this.surviveSize = [surviveSize[0] * this.mapX, surviveSize[1] * this.mapY];

        this.canvas = document.getElementById("myCanvas");
        this.canvas.width = this.mapX * this.scale;
        this.canvas.height = this.mapY * this.scale;

        this.ctx = this.canvas.getContext("2d");
    }

    params()
    {
        const standardSurviveCoords = [this.surviveCoords[0]/this.width, this.surviveCoords[1]/this.height];
        const standardSurviveSize = [this.surviveSize[0]/this.mapX, this.surviveSize[1]/this.mapY];
        console.log(`Amount: ${this.quantities}\nScale: ${this.scale}\nConnections: ${this.connections}\nGenerationSteps: ${this.generationSteps}\nMutationRate: ${this.mutationRate}\nSurviveCoords: ${standardSurviveCoords}\nSurviveSize: ${standardSurviveSize}`);
    }

    scaleSurvive(newX, newY)
    {
        this.surviveSize = [newX * this.mapX, newY * this.mapY];
    }

    moveSurvive(newX, newY)
    {
        this.surviveCoords = [0 + newX * this.width, 0 + newY * this.height];
    }

    drawEntity(x, y, colour)
    {
        this.ctx.fillStyle = `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
        this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
    }

    clearScreen()
    {
        this.ctx.fillStyle = "rgb(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.mapX * this.scale, this.mapY * this.scale);
        this.ctx.fillStyle = "rgb(155, 155, 155)";
        this.ctx.fillRect(this.surviveCoords[0], this.surviveCoords[1], this.surviveSize[0] * this.scale, this.surviveSize[1] * this.scale);
    }

    render()
    {
        this.clearScreen()
        this.xEntities = {};
        this.yEntities = {};

        for(var i = 0; i < this.entities.length; i++)
        {
            const entity = this.entities[i];
            this.drawEntity(entity.x, entity.y, entity.colour);
            this.xEntities[entity.x] != undefined ? this.xEntities[entity.x].push(entity) : this.xEntities[entity.x] = [entity];
            this.yEntities[entity.y] != undefined ? this.yEntities[entity.y].push(entity) : this.yEntities[entity.y] = [entity];
        }
    }
    
    addEntity(x, y)
    {
        const entity = new Entity(x, y, this.neurons, this.connections, this);
        this.entities.push(entity);
    }

    entityInSpace(x, y)
    {
        if(this.xEntities[x] == undefined || this.yEntities[y] == undefined)
        {
            return false;
        }

        let entArr;
        this.xEntities[x].length > this.yEntities[y].length ? entArr = this.yEntities[y] : entArr = this.xEntities[x];

        for(var i = 0; i < entArr.length; i++)
        {
            if(entArr[i].x == x && entArr[i].y == y)
            {
                return true;
            }
        }
        return false;
    }

    detailEntityInSpace(xx, yy)
    {
        const x = Math.floor(xx/this.scale);
        const y = Math.floor(yy/this.scale);

        if(this.xEntities[x] == undefined || this.yEntities[y] == undefined)
        {
            return false;
        }

        let entArr;
        this.xEntities[x].length > this.yEntities[y].length ? entArr = this.yEntities[y] : entArr = this.xEntities[x];

        for(var i = 0; i < entArr.length; i++)
        {
            const entity = entArr[i];
            if(entity.x == x && entity.y == y)
            {
                console.log(i);
                return entity;
            }
        }
    }

    randEntityPlace()
    {
        var retryCount = 0;
        for(var i = 0; i < this.quantities; i++)
        {
            const randX = Math.max(randInt(this.mapX - 1), 0);
            const randY = Math.max(randInt(this.mapY - 1), 0);

            if(!this.entityInSpace(randX, randY))
            {
                this.addEntity(randX, randY);
            } else if(retryCount < this.quantities) {
                i--;
                retryCount++;
            }
        }
    }

    inheritIndex()
    {
        const mutation = this.mutationRate;

        const rand = Math.floor(Math.random() * 101);
        const parentRate = (100 - mutation)/2;
        if(rand <= mutation)
        {
            return 0;
        } else if (rand > mutation && rand <= mutation + parentRate)
        {
            return 1;
        } else {
            return 2;
        }
    }

    createOffspring(entity1, entity2)
    {
        const child = new Entity(0, 0, this.neurons, this.connections, this, entity1, entity2);

        return child;
    }

    placeSurvivors(array)
    {
        var retryCount = 0;
        for(var i = 0; i < array.length; i++)
        {
            const randX = Math.max(randInt(this.mapX - 1), 0);
            const randY = Math.max(randInt(this.mapY - 1), 0);

            if(!this.entityInSpace(randX, randY))
            {
                array[i].x = randX;
                array[i].y = randY;
            } else if(retryCount < array.length * 2) {
                i--;
                retryCount++;
            }
        }
    }

    displayTraits(entityArray)
    {
        const traits = {};
        for(var i = 0; i < entityArray.length; i++)
        {
            for(var j = 0; j < entityArray[i].neurons.length; j++)
            {
                for(var k = 0; k < entityArray[i].neurons[j].connections.length; k++)
                {
                    const tag = `${entityArray[i].neurons[j].connections[k].stimulus}_${entityArray[i].neurons[j].connections[k].output}`;
                    if(traits[tag] != undefined)
                    {
                        traits[tag] += 1;
                    } else {
                        traits[tag] = 1;
                    }
                }
            }
        }
        console.log(traits);
    }

    getSurvivors()
    {
        const survivors = [];
        for(var i = 0; i < this.entities.length; i++)
        {
            const entity = this.entities[i];
            const surviveCoordsX = this.surviveCoords[0]/this.scale;
            const surviveCoordsY = this.surviveCoords[1]/this.scale;
            const outerX = this.surviveSize[0] + surviveCoordsX;
            const outerY = this.surviveSize[1] + surviveCoordsY;
            if((entity.x >= surviveCoordsX && entity.x < outerX) && (entity.y >= surviveCoordsY && entity.y < outerY))
            {
                survivors.push(entity);
            }
        }

        if(survivors.length < 2)
        {
            location.reload();
        } else {
            return survivors;
        }
    }

    newGeneration()
    {
        const survivors = this.getSurvivors();
        this.displayTraits(survivors);

        this.entities = [];
        for(var i = 0; i < this.quantities; i++)
        {
            let j = i;
            if(i >= survivors.length)
            {
                j -= Math.floor(i/survivors.length) * survivors.length;
            }

            const entity1 = survivors[j];
            let entity2;
            if(j == survivors.length - 1)
            {
                entity2 = survivors[0];
            } else {
                entity2 = survivors[j + 1];
            }

            const child = this.createOffspring(entity1, entity2);
            this.entities.push(child);
        }
        this.placeSurvivors(this.entities);
    }

    process()
    {
        for(var i = 0; i < this.entities.length; i++)
        {
            this.entities[i].activateNeurons();
        }
        if(this.steps >= this.generationSteps)
        {
            this.newGeneration();
            this.steps = 0;
            this.generation += 1;
            console.log("GENERATION", this.generation);
        }
        this.render();
        this.steps += 1;
        console.log(this.steps);
    }

    play(time = 10)
    {
        this.running = true;
        this.interval = setInterval(controller.process.bind(controller), time);
    }

    pause()
    {
        this.running = false;
        if(this.interval != undefined)
        {
            clearInterval(this.interval);
        }
    }

    start()
    {
        this.clearScreen();
        this.randEntityPlace();
        this.render();
    }
}
//#endregion

// #region Running Code
// quantities, scale, neurons, connections, generationSteps, mutationRate, surviveCoords, surviveSize
const controller = new Controller(500, 10, 2, 4, 300, 10, [0.4, 0.4], [0.2, 0.2]);
controller.start();

window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return;
    }
  
    switch (event.code) {
        case "Space":
            if(!controller.running)
            {
                controller.process();
            } else {
                controller.pause();
            }
            break;
        case "ShiftLeft":
            if(controller.running)
            {
                controller.pause();
            } else {
                controller.play();
            }
            break;
        default:
            return;
    }

    event.preventDefault();
  }, true);

window.addEventListener('click', (event) => {
    if(event.button == 0)
    {
        const entity = controller.detailEntityInSpace(event.pageX, event.pageY);
        if(entity != undefined)
        {
            console.log(entity);
        }
    }
    
})
//#endregion