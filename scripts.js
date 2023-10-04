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
const stimuli = ["passive", "edge", "entity"];
const type = ["I", "E"];
const action = ["moveL", "moveR", "moveU", "moveD", "moveRand", "swap", "useless"];

class Entity
{
    // Entities should make 1 move a turn per neuron, neuron should have multiple connections to each neuron
    // Neuron calculates inputs and outputs to make 1 action
    constructor(x, y, connections, parent, child=false)
    {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.connections = [];
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
        // NEEDS STIMULI CONDITIONING
        connection.current += connection.strength
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
    constructor(quantities, scale, connections, generationSteps, mutationRate, surviveCoords, surviveSize)
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

        this.mapX = window.innerWidth/this.scale;
        this.mapY = window.innerHeight/this.scale;
        this.surviveCoords = [0 + surviveCoords[0] * window.innerWidth, 0 + surviveCoords[1] * window.innerHeight];
        this.surviveSize = [surviveSize[0] * this.mapX, surviveSize[1] * this.mapY]

        this.canvas = document.getElementById("myCanvas");
        this.canvas.width = this.mapX * this.scale;
        this.canvas.height = this.mapY * this.scale;

        this.ctx = this.canvas.getContext("2d");
    }

    params()
    {
        console.log(`Amount: ${this.quantities}\nScale: ${this.scale}\nConnections: ${this.connections}\nGenerationSteps: ${this.generationSteps}\nMutationRate: ${this.mutationRate}\nSurviveCoords: ${this.surviveCoords}\nSurviveSize: ${this.surviveSize}`)
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

        const entity = new Entity(x, y, this.connections, this)
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
        const child = new Entity(0, 0, this.connections, this, true);
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
const controller = new Controller(500, 10, 10, 300, 20, [0, 0], [0.5, 1]);
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