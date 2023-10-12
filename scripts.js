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

//TODO
// Clean up everything, try to remove for loops
// Add Inhibitory type neurons

class Neuron
{
    constructor(parent, connections, neuronNumber, entity1 = false, entity2 = false)
    {
        this.parent = parent;
        this.stimuli = copyArr(this.parent.stimuli);
        this.types = copyArr(this.parent.types);
        this.output = copyArr(this.parent.output);
        
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

    createConnection(stimulus, type, output)
    {
        const connection = {"stimulus": stimulus, "type": type, "output": output}
        this.connections.push(connection);
    }

    createRandConnection()
    {
        const stimulus = choose(this.stimuli);
        const able = choose(this.types);
        const result = choose(this.output);

        this.createConnection(stimulus, able, result)
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
            let stimulus = entity1.neurons[this.neuronNumber].connections[i].stimulus;
            let able = entity1.neurons[this.neuronNumber].connections[i].type;
            let result = entity1.neurons[this.neuronNumber].connections[i].output;

            this.createConnection(stimulus, able, result)
        } else {
            let stimulus = entity2.neurons[this.neuronNumber].connections[i].stimulus;
            let able = entity2.neurons[this.neuronNumber].connections[i].type;
            let result = entity2.neurons[this.neuronNumber].connections[i].output;

            this.createConnection(stimulus, able, result)
        }
    }

    moveOutput(dir, num)
    {
        let face
        if(dir == "x" && num == 1)
        {
            face = "right"
        } else if (dir == "x" && num == -1)
        {
            face = "left"
        } else if (dir == "y" && num == 1)
        {
            face = "down"
        }  else if (dir == "y" && num == -1)
        {
            face = "up"
        }
        return () => {
            if(!this.parent.checkAdjacent(face) && this.parent.withinBounds(face))
            {
                this.parent[dir] += num
            }
        }
    }

    swapOutput(dir)
    {
        return () => {
            const adj = this.parent.checkAdjacent(dir)
            if(adj)
            {
                const target = adj[0]
                const targetCoords = [target.x, target.y];
                target.x = this.parent.x;
                target.y = this.parent.y;
                this.parent.x = targetCoords[0];
                this.parent.y = targetCoords[1];
            }
        }
    }

    neuronOutput(num)
    {
        return () => {return false};
        // return () => {this.connections[num].current += connection.strength};
    }

    stimulate(connectionOutput)
    {
        let outputFunction;
        switch(connectionOutput)
        {
            case "moveL":
                outputFunction = this.moveOutput("x", -1);
                break;
            case "moveR":
                outputFunction = this.moveOutput("x", 1);
                break;
            case "moveU":
                outputFunction = this.moveOutput("y", -1);
                break;
            case "moveD":
                outputFunction = this.moveOutput("y", 1);
                break;
            case "moveRand":
                const moveDir = choose(["x", "y"]);
                const num = choose([1, -1]);
                outputFunction = this.moveOutput(moveDir, num);
                break;
            case "swapL":
                outputFunction = this.swapOutput("left");
                break;
            case "swapR":
                outputFunction = this.swapOutput("right");
                break;
            case "swapU":
                outputFunction = this.swapOutput("up");
                break;
            case "swapD":
                outputFunction = this.swapOutput("down");
                break;
            case "swapRand":
                const swapDir = choose(["left", "right", "up", "down"]);
                outputFunction = this.swapOutput(swapDir);
                break;
            default:
                if(typeof connectionOutput == "number")
                {
                    outputFunction = this.neuronOutput(connectionOutput)
                } else {
                    outputFunction = () => { return false; }
                }
                break;
        }
        return outputFunction
    }

    decCalc(num)
    {
        let calc = 0;
        if(num < 0.5)
        {
            calc = 4 * (num - 0.5) * (num - 0.5) + 0.1;
        } else {
            calc = 0;
        }
        if(calc > 1)
        {
            calc = 1;
        }
        return calc;
    }

    detect(connectionStimulus, connectionType)
    {
        // this.stimuli = ["edgeL", "edgeR", "edgeU", "edgeD", "entityL", "entityR", "entityU", "entityD", "spaceL", "spaceR", "spaceU", "spaceD"];
        let value = 0;
        const parentX = this.parent.x;
        const parentY = this.parent.y;
        const mapX = this.parent.parent.mapX;
        const mapY = this.parent.parent.mapY;
        const entArray = this.parent.parent.entities;
        let lowestDistance = 0;
        switch(connectionStimulus)
        {
            case "edgeL":
                const elSum = parentX/mapX;
                value = this.decCalc(elSum)
                break;
            case "edgeR":
                const erSum = (mapX - parentX)/mapX;
                value = this.decCalc(erSum)
                break;
            case "edgeU":
                const euSum = parentY/mapY;
                value = this.decCalc(euSum)
                break;
            case "edgeD":
                const edSum = (mapY - parentY)/mapY;
                value = this.decCalc(edSum)
                break;
            case "entityL":
                lowestDistance = mapX;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].y == parentY && entArray[i].x < parentX && (parentX - entArray[i].x) < lowestDistance)
                    {
                        lowestDistance = parentX - entArray[i].x;
                    }
                }
                value = this.decCalc(lowestDistance/parentX);
                break;
            case "entityR":
                lowestDistance = mapX;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].y == parentY && entArray[i].x > parentX && (entArray[i].x - parentX) < lowestDistance)
                    {
                        lowestDistance = entArray[i].x - parentX;
                    }
                }
                value = this.decCalc(lowestDistance/mapX);
                break;
            case "entityU":
                lowestDistance = mapY;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].x == parentX && entArray[i].y < parentY && (parentY - entArray[i].y) < lowestDistance)
                    {
                        lowestDistance = parentY - entArray[i].y;
                    }
                }
                value = this.decCalc(lowestDistance/parentY);
                break;
            case "entityD":
                lowestDistance = mapY;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].x == parentX && entArray[i].y > parentY && (entArray[i].y - parentY) < lowestDistance)
                    {
                        lowestDistance = entArray[i].y - parentY;
                    }
                }
                value = this.decCalc(lowestDistance/mapY);
                break;
            case "spaceL":
                lowestDistance = parentX;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].y == parentY && entArray[i].x < parentX && (parentX - entArray[i].x) < lowestDistance)
                    {
                        lowestDistance = parentX - entArray[i].x;
                    }
                }
                value = this.decCalc((mapX - lowestDistance)/mapX);
                break;
            case "spaceR":
                lowestDistance = mapX - parentX;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].y == parentY && entArray[i].x > parentX && (entArray[i].x - parentX) < lowestDistance)
                    {
                        lowestDistance = entArray[i].x - parentX;
                    }
                }
                value = this.decCalc((mapX - lowestDistance)/mapX);
                break;
            case "spaceU":
                lowestDistance = parentY;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].x == parentX && entArray[i].y < parentY && (parentY - entArray[i].y) < lowestDistance)
                    {
                        lowestDistance = parentY - entArray[i].y;
                    }
                }
                value = this.decCalc((mapY - lowestDistance)/mapY);
                break;
            case "spaceD":
                lowestDistance = mapY - parentY;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].x == parentX && entArray[i].y > parentY && (entArray[i].y - parentY) < lowestDistance)
                    {
                        lowestDistance = entArray[i].y - parentY;
                    }
                }
                value = this.decCalc((mapY - lowestDistance)/mapY);
                break;
        }
        // if(connectionType == "I")
        // {
        //     value = 1 - value;
        // }
        return value;
    }

    evaluate()
    {
        let greatestValue = -1;
        let greatestIndex = -1;
        for(var i = 0; i < this.connections.length; i++)
        {
            const connection = this.connections[i];
            const stimuliValue = this.detect(connection.stimulus, connection.type)
            if(stimuliValue > greatestValue)
            {
                greatestValue = stimuliValue;
                greatestIndex = i;
            }
        }

        return this.stimulate(this.connections[greatestIndex].output)
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

        this.stimuli = ["edgeL", "edgeR", "edgeU", "edgeD", "entityL", "entityR", "entityU", "entityD", "spaceL", "spaceR", "spaceU", "spaceD"];
        this.types = ["I", "E"];
        this.output = ["moveL", "moveR", "moveU", "moveD", "moveRand", "swapL", "swapR", "swapU", "swapD", "swapRand", "stop"];

        if(!entity1 || !entity2)
        {
            for(var i = 0; i < neurons; i++)
            {
                this.createNeuron(i);
                this.output.push(i);
            }
        } else {
            for(var i = 0; i < neurons; i++)
            {
                this.inheritNeuron(i, entity1, entity2);
                this.output.push(i);
            }
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
                colourValues[index] += this.stimuli.indexOf(connection.stimulus)/(this.stimuli.length - 1)
                colourValues[index] += this.types.indexOf(connection.type)/(this.types.length - 1)
                colourValues[index] += this.output.indexOf(connection.output)/(this.output.length - 1)
                colourCount[index] += 3
                index++;
            }
        }
        if(colourCount[1] == 0)
        {
            colourCount[1] = 1;
        }
        if(colourCount[2] == 0)
        {
            colourCount[2] = 1;
        }
        let colour1 = 255 * colourValues[0]/colourCount[0];
        let colour2 = 255 * colourValues[1]/colourCount[1];
        let colour3 = 255 * colourValues[2]/colourCount[2];
        this.colour = [colour1, colour2, colour3]
    }

    createNeuron(neuronNumber)
    {
        const neuron = new Neuron(this, this.connections, neuronNumber);
        this.neurons.push(neuron)
    }

    inheritNeuron(neuronNumber, entity1, entity2)
    {
        const neuron = new Neuron(this, this.connections, neuronNumber, entity1, entity2);
        this.neurons.push(neuron)
    }

    checkAdjacent(direction)
    {
        const x = this.x;
        const y = this.y;
        const array = this.parent.entities;
        const left = [x - 1, y];
        const right = [x + 1, y];
        const up = [x, y - 1];
        const down = [x, y + 1];
        const adjacent = []

        // NEEDS HEAVY CLEAN UP
        for(var i = 0; i < array.length; i++)
        {
            const entity = array[i];
            if((direction == "left" || direction == "all") && entity.x == left[0] && entity.y == left[1])
            {
                adjacent.push(entity);
            }
            if((direction == "right" || direction == "all") && entity.x == right[0] && entity.y == right[1])
            {
                adjacent.push(entity);
            }
            if((direction == "up" || direction == "all") && entity.x == up[0] && entity.y == up[1])
            {
                adjacent.push(entity);
            }
            if((direction == "down" || direction == "all") && entity.x == down[0] && entity.y == down[1])
            {
                adjacent.push(entity);
            }
        }
        if(adjacent.length == 0)
        {
            return false;
        } else {
            return adjacent;
        }
    }

    withinBounds(direction)
    {
        switch(direction)
        {
            case "left":
                return this.x > 0 ? true : false;
                break;
            case "right":
                return this.x < (this.parent.mapX - 2) ? true : false;
                break;
            case "up":
                return this.y > 0 ? true : false;
                break;
            case "down":
                return this.y < (this.parent.mapY - 2) ? true : false;
                break;
        }
    }

    activateNeurons()
    {
        for(var i = 0; i < this.neurons.length; i++)
        {
            const neuron = this.neurons[i];
            const outcome = neuron.evaluate();
            outcome();
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

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.mapX = this.width/this.scale;
        this.mapY = this.height/this.scale;
        this.surviveCoords = [0 + surviveCoords[0] * this.width, 0 + surviveCoords[1] * this.height];
        this.surviveSize = [surviveSize[0] * this.mapX, surviveSize[1] * this.mapY]

        this.canvas = document.getElementById("myCanvas");
        this.canvas.width = this.mapX * this.scale;
        this.canvas.height = this.mapY * this.scale;

        this.ctx = this.canvas.getContext("2d");
    }

    params()
    {
        const standardSurviveCoords = [this.surviveCoords[0]/this.width, this.surviveCoords[1]/this.height];
        const standardSurviveSize = [this.surviveSize[0]/this.mapX, this.surviveSize[1]/this.mapY];
        console.log(`Amount: ${this.quantities}\nScale: ${this.scale}\nConnections: ${this.connections}\nGenerationSteps: ${this.generationSteps}\nMutationRate: ${this.mutationRate}\nSurviveCoords: ${standardSurviveCoords}\nSurviveSize: ${standardSurviveSize}`)
    }

    scaleSurvive(newX, newY)
    {
        this.surviveSize = [newX * this.mapX, newY * this.mapY]
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
        for(var i = 0; i < this.entities.length; i++)
        {
            this.drawEntity(this.entities[i].x, this.entities[i].y, this.entities[i].colour)
        }
    }
    
    addEntity(x, y)
    {
        const entity = new Entity(x, y, this.neurons, this.connections, this)
        this.entities.push(entity)
    }

    entityInSpace(x, y)
    {
        const array = this.entities
        for(var i = 0; i < array.length; i++)
        {
            const entity = array[i]
            if(entity.x == x && entity.y == y)
            {
                return true;
            }
        }
        return false;
    }

    detailEntityInSpace(xx, yy)
    {
        const array = this.entities
        const x = Math.floor(xx/this.scale)
        const y = Math.floor(yy/this.scale)

        for(var i = 0; i < array.length; i++)
        {
            const entity = array[i]
            if(entity.x == x && entity.y == y)
            {
                console.log(i)
                return entity;
            }
        }
    }

    randEntityPlace()
    {
        var retryCount = 0;
        for(var i = 0; i < this.quantities; i++)
        {
            const randX = randInt(this.mapX - 1);
            const randY = randInt(this.mapY - 1);

            if(!this.entityInSpace(randX, randY))
            {
                this.addEntity(randX, randY)
            } else if(retryCount < this.quantities/10) {
                i--
                retryCount++
            }
        }
    }

    inheritIndex()
    {
        // NEEDS HEAVY CLEAN UP
        const mutation = this.mutationRate

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
            const randX = randInt(this.mapX) - 1;
            const randY = randInt(this.mapY) - 1;

            if(!this.entityInSpace(randX, randY))
            {
                array[i].x = randX;
                array[i].y = randY;
            } else if(retryCount < array.length * 2) {
                i--
                retryCount++
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
                    // const tag = `${entityArray[i].neurons[j].connections[k].type}_${entityArray[i].neurons[j].connections[k].stimulus}_${entityArray[i].neurons[j].connections[k].output}`
                    const tag = `${entityArray[i].neurons[j].connections[k].stimulus}_${entityArray[i].neurons[j].connections[k].output}`
                    if(traits[tag] != undefined)
                    {
                        traits[tag] += 1;
                    } else {
                        traits[tag] = 1;
                    }
                }
            }
        }
        console.log(traits)
    }

    newGeneration()
    {
        // NEEDS HEAVY CLEAN UP
        const survivors = []
        for(var i = 0; i < this.entities.length; i++)
        {
            const entity = this.entities[i];
            const outerX = this.surviveSize[0] + this.surviveCoords[0]/this.scale;
            const outerY = this.surviveSize[1] + this.surviveCoords[1]/this.scale;
            if((entity.x >= this.surviveCoords[0]/this.scale && entity.x < outerX) && (entity.y >= this.surviveCoords[1]/this.scale && entity.y < outerY))
            {
                survivors.push(entity);
            }
        }

        if(survivors.length < 2)
        {
            location.reload()
            return;
        }

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

            this.entities.push(this.createOffspring(entity1, entity2))
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
            console.log("GENERATION", this.generation)
        }
        this.render();
        this.steps += 1;
        console.log(this.steps)
    }

    play(time = 10)
    {
        this.running = true;
        this.interval = setInterval(controller.process.bind(controller), time)
    }

    pause()
    {
        this.running = false;
        if(this.interval != undefined)
        {
            clearInterval(this.interval)
        }
    }

    start()
    {
        this.clearScreen()
        this.randEntityPlace()
        this.render()
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
        const entity = controller.detailEntityInSpace(event.pageX, event.pageY)
        if(entity != undefined)
        {
            console.log(entity)
        }
    }
    
})
//#endregion