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

function developColour(entity)
{
    const colours = [];
    let repeat = 1
    let run = entity.connections.length
    if(entity.connections.length > 3)
    {
        run = 3;
    } else if (entity.connections.length < 3)
    {
        repeat = 4 - entity.connections.length
    }

    for(var j = 0; j < repeat; j++)
    {
        for(var i = 0; i < run; i++)
        {
            const connections = entity.connections[i];
            let val = 0;
            val += (entity.output.indexOf(connections.output))/entity.output.length * 64;
            val += (stimuli.indexOf(connections.stimulus))/stimuli.length * 64;
            val += connections.strength * 64;
            val += (type.indexOf(connections.type))/type.length * 64;
            if(val > 255)
            {
                val -= 1;
            }
            colours.push(val)
        }
    }
    
    return colours;
}
//#endregion

// #region Classes
const stimuli = ["edge", "entity", "space"];
// add stimuli per direction
const type = ["I", "E"];
// add swap per direction
const action = ["moveL", "moveR", "moveU", "moveD", "moveRand", "swap", "stop"];

// should have class Neuron, has connections, determines output based on connections, Neuron makes 1 action

// action method returns function (bool) => this.x etc etc can use parent
// stimulate with boolean as stimuli eg this.x < etc etc
class Neuron
{
    constructor(parent, connections, entity1 = false, entity2 = false)
    {
        this.stimuli = ["edgeL", "edgeR", "edgeU", "edgeD", "entityL", "entityR", "entityU", "entityD", "spaceL", "spaceR", "spaceU", "spaceD"];
        this.types = ["I", "E"];
        this.action = ["moveL", "moveR", "moveU", "moveD", "moveRand", "swapL", "swapR", "swapU", "swapD", "swapRand"];
        // this.action = this.parent.action (parent has other neurons as output, not other connections)
        this.connections = [];

        this.parent = parent;
    }

    createConnection(num)
    {
        const stimulus = choose(this.stimuli);
        const able = choose(type);
        const result = choose(this.output);

        const connection = {"stimulus": stimulus, "type": able, "output": result, "current": 0}
        this.action.push(num);
        this.connections.push(connection);

        return connection;
    }

    moveOutput(dir, num)
    {
        return () => {this[dir] += num}
    }

    swapOutput(dir)
    {
        return () => {
            const adj = this.checkAdjacent(dir)
            if(adj)
            {
                const target = adj[0]
                const targetCoords = [target.x, target.y];
                target.x = this.x;
                target.y = this.y;
                this.x = targetCoords[0];
                this.y = targetCoords[1];
            }
        }
    }

    neuronOutput(num)
    {
        return false;
        // return () => {this.connections[num].current += connection.strength};
    }

    stimulate(connectionOutput)
    {
        let outputFunction;
        switch(connectionOutput)
        {
            case "moveL":
                outputFunction = moveOutput("x", -1);
                break;
            case "moveR":
                outputFunction = moveOutput("x", 1);
                break;
            case "moveU":
                outputFunction = moveOutput("y", -1);
                break;
            case "moveD":
                outputFunction = moveOutput("y", 1);
                break;
            case "moveRand":
                const moveDir = choose(["x", "y"]);
                const num = choose([1, -1]);
                outputFunction = moveOutput(dir, num);
                break;
            case "swapL":
                outputFunction = swapOutput("left");
                break;
            case "swapR":
                outputFunction = swapOutput("right");
                break;
            case "swapU":
                outputFunction = swapOutput("up");
                break;
            case "swapD":
                outputFunction = swapOutput("down");
                break;
            case "swapRand":
                const swapDir = choose(["left", "right", "up", "down"]);
                outputFunction = swapOutput(swapDir);
                break;
            default:
                if(typeof connectionOutput == "number")
                {
                    outputFunction = neuronOutput(connectionOutput)
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

    detect(connectionStimulus)
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
                value = decCalc(elSum)
                break;
            case "edgeR":
                const erSum = (mapX - parentX)/mapX;
                value = decCalc(erSum)
                break;
            case "edgeU":
                const euSum = parentY/mapY;
                value = decCalc(euSum)
                break;
            case "edgeD":
                const edSum = (mapY - parentY)/mapY;
                value = decCalc(edSum)
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
                value = decCalc(elLowestDistance/parentX);
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
                value = decCalc(lowestDistance/mapX);
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
                value = decCalc(lowestDistance/parentY);
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
                value = decCalc(lowestDistance/mapY);
                break;
            case "spaceL":
                lowestDistance = mapX;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].y == parentY && entArray[i].x < parentX && (parentX - entArray[i].x) < lowestDistance)
                    {
                        lowestDistance = parentX - entArray[i].x;
                    }
                }
                value = decCalc((mapX - lowestDistance)/mapX);
                break;
            case "spaceR":
                lowestDistance = mapX;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].y == parentY && entArray[i].x > parentX && (entArray[i].x - parentX) < lowestDistance)
                    {
                        lowestDistance = entArray[i].x - parentX;
                    }
                }
                value = decCalc((mapX - lowestDistance)/mapX);
                break;
            case "spaceU":
                lowestDistance = mapY;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].x == parentX && entArray[i].y < parentY && (parentY - entArray[i].y) < lowestDistance)
                    {
                        lowestDistance = parentY - entArray[i].y;
                    }
                }
                value = decCalc((mapY - lowestDistance)/mapY);
                break;
            case "spaceD":
                lowestDistance = mapY;
                for(var i = 0; i < entArray.length; i++)
                {
                    if(entArray[i].x == parentX && entArray[i].y > parentY && (entArray[i].y - parentY) < lowestDistance)
                    {
                        lowestDistance = entArray[i].y - parentY;
                    }
                }
                value = decCalc((mapY - lowestDistance)/mapY);
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
            const stimuliValue = this.detect(connection.stimulus)
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
    constructor(x, y, neurons, connections, parent, child=false)
    {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.connections = []; // TO REMOVE
        this.neurons = [];
        this.output = copyArr(action)

        if(!child)
        {
            for(var i = 0; i < connections; i++)
            {
                this.createConnection(i);
            }
            this.colour = developColour(this);
        }
    }

    createConnection(num)
    {
        const threshold = 2;
        const strength = (Math.round(Math.random() * 100) + 1)/100;

        const stimulus = choose(stimuli);
        const able = choose(type);
        const result = choose(this.output);

        const connection = {"stimulus": stimulus, "threshold": threshold, "type": able, "output": result, "strength": strength, "current": 0}
        this.output.push(num);
        this.connections.push(connection);

        return connection;
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

    detect(connection)
    {
        switch(connection.stimulus)
        {
            case "edge":
                const xPercent = this.parent.mapX/10;
                const yPercent = this.parent.mapY/10;
                if(this.x < xPercent || this.x > xPercent * 9 || this.y < yPercent || this.y > yPercent * 9)
                {
                    connection.current += connection.strength;
                }
                break;
            case "entity":
                const adj = this.checkAdjacent("all");
                if(adj)
                {
                    connection.current += connection.strength;
                }
                break;
            case "space":
                const adjacent = this.checkAdjacent("all");
                if(!adjacent)
                {
                    connection.current += connection.strength;
                }
                break;
            default:
                connection.current += connection.strength;
                break;
        }
    }

    stimulate(connection)
    {
        // NEEDS HEAVY CLEAN UP
        if(["moveL", "moveR", "moveU", "moveD", "moveRand"].includes(connection.output))
        {
            let movement = ""
            switch(connection.output)
            {
                case "moveL":
                    movement = "left"
                    break;
                case "moveR":
                    movement = "right"
                    break;
                case "moveU":
                    movement = "up"
                    break;
                case "moveD":
                    movement = "down"
                    break;
                case "moveRand":
                    movement = choose(["left", "right", "up", "down"])
                    break;
            }
            if(!this.checkAdjacent(movement) && this.withinBounds(movement))
            {
                switch(movement)
                {
                    case "left":
                        this.x -= 1
                        break;
                    case "right":
                        this.x += 1
                        break;
                    case "up":
                        this.y -= 1
                        break;
                    case "down":
                        this.y += 1
                        break;
                }
            }
        } else if (typeof connection.output == "number")
        {
            // -= for inhibitory
            this.connections[connection.output].current += connection.strength;
        } else if (connection.output == "swap")
        {
            const adj = this.checkAdjacent("all");
            if(adj)
            {
                const target = choose(adj);
                const targetCoords = [target.x, target.y];
                target.x = this.x;
                target.y = this.y;
                this.x = targetCoords[0];
                this.y = targetCoords[1];
            }
        }
        connection.current = 0;
    }

    execute()
    {
        for(var i = 0; i < this.connections.length; i++)
        {
            const connection = this.connections[i];

            this.detect(connection)
            if(connection.current >= connection.threshold)
            {
                this.stimulate(connection)
            }
        }
    }
}

class Controller
{
    constructor(quantities, scale, neurons, connections, generationSteps, mutationRate, surviveCoords, surviveSize)
    {
        this.scale = scale;
        this.quantities = quantities;
        this.connections = connections;
        this.generationSteps = generationSteps;
        this.mutationRate = mutationRate/100;

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
    
    addEntity(x, y, colour = [])
    {
        if(colour.length == 0)
        {
            colour.push(randInt(256))
            colour.push(randInt(256))
            colour.push(randInt(256))
        }

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
                return entity;
            }
        }
    }

    randEntityPlace()
    {
        var retryCount = 0;
        for(var i = 0; i < this.quantities; i++)
        {
            const randX = randInt(this.mapX) - 1;
            const randY = randInt(this.mapY) - 1;

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

    inheritConnection(child, entity1, entity2, i)
    {
        // NEEDS HEAVY CLEAN UP
        child.output = copyArr(action)
        for(var j = 0; j < i; j++)
        {
            child.output.push(j);
        }

        const output = [choose(child.output), entity1.connections[i].output, entity2.connections[i].output];
        const stimulus = [choose(stimuli), entity1.connections[i].stimulus, entity2.connections[i].stimulus];
        const strength = [(Math.round(Math.random() * 100) + 1)/100, entity1.connections[i].strength, entity2.connections[i].strength];
        const types = [choose(type), entity1.connections[i].type, entity2.connections[i].type];

        const connection = {current: 0, output: output[this.inheritIndex()], stimulus: stimulus[this.inheritIndex()], strength: strength[this.inheritIndex()], threshold: 2, type: types[this.inheritIndex()]};

        child.connections.push(connection)
    }

    createOffspring(entity1, entity2)
    {
        // NEEDS HEAVY CLEAN UP
        const child = new Entity(0, 0, this.neurons, this.connections, this, true);
        for(var i = 0; i < this.connections; i++)
        {
            this.inheritConnection(child, entity1, entity2, i);
        }
        child.colour = developColour(child);

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
            for(var j = 0; j < entityArray[i].connections.length; j++)
            {
                const tag = `${entityArray[i].connections[j].stimulus}_${entityArray[i].connections[j].output}`
                if(traits[tag] != undefined)
                {
                    traits[tag] += 1;
                } else {
                    traits[tag] = 1;
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
            this.entities[i].execute();
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
// quantities, scale, connections, generationSteps, mutationRate, surviveCoords, surviveSize
const controller = new Controller(500, 10, 1, 3, 50, 30, [0, 0], [0.5, 1]);
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