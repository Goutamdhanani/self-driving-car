const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 300; // Wider canvas for more lanes
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

// UI elements
const statsDiv = document.createElement("div");
statsDiv.id = "stats";
statsDiv.style.position = "absolute";
statsDiv.style.top = "10px";
statsDiv.style.left = "10px";
statsDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
statsDiv.style.color = "white";
statsDiv.style.padding = "10px";
statsDiv.style.borderRadius = "5px";
statsDiv.style.fontFamily = "monospace";
document.body.appendChild(statsDiv);

// Add UI controls
const controlDiv = document.createElement("div");
controlDiv.id = "controls";
controlDiv.style.position = "absolute";
controlDiv.style.top = "10px";
controlDiv.style.right = "10px";
controlDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
controlDiv.style.padding = "10px";
controlDiv.style.borderRadius = "5px";
document.body.appendChild(controlDiv);

// Environment selector
const envSelect = document.createElement("select");
envSelect.innerHTML = `
    <option value="city">City</option>
    <option value="highway">Highway</option>
    <option value="rural">Rural</option>
`;
envSelect.style.marginBottom = "10px";
envSelect.style.padding = "5px";
envSelect.addEventListener("change", () => {
    road.environment = envSelect.value;
});
controlDiv.appendChild(envSelect);
controlDiv.appendChild(document.createElement("br"));

// Lanes selector
const laneSelect = document.createElement("select");
laneSelect.innerHTML = `
    <option value="3">3 Lanes</option>
    <option value="4" selected>4 Lanes</option>
    <option value="5">5 Lanes</option>
    <option value="6">6 Lanes</option>
`;
laneSelect.style.marginBottom = "10px";
laneSelect.style.padding = "5px";
laneSelect.addEventListener("change", () => {
    initializeSimulation(parseInt(laneSelect.value));
});
controlDiv.appendChild(laneSelect);
controlDiv.appendChild(document.createElement("br"));

// Difficulty selector
const difficultySelect = document.createElement("select");
difficultySelect.innerHTML = `
    <option value="easy">Easy</option>
    <option value="medium" selected>Medium</option>
    <option value="hard">Hard</option>
`;
difficultySelect.style.marginBottom = "10px";
difficultySelect.style.padding = "5px";
difficultySelect.addEventListener("change", () => {
    setDifficulty(difficultySelect.value);
});
controlDiv.appendChild(difficultySelect);
controlDiv.appendChild(document.createElement("br"));

// View mode toggle
const viewToggle = document.createElement("button");
viewToggle.innerText = "Toggle Camera View";
viewToggle.style.padding = "5px";
viewToggle.style.marginBottom = "10px";
viewToggle.addEventListener("click", () => {
    cameraView = cameraView === "follow" ? "top" : "follow";
});
controlDiv.appendChild(viewToggle);
controlDiv.appendChild(document.createElement("br"));

// Set default values
let cameraView = "follow";
let difficulty = "medium";
let trafficCount = 15;
let obstacleCount = 10;
let pedestrianCount = 5;
let frameRate = 60;
let showSensors = true;

// Initialize simulation
let road, cars, traffic, obstacles, pedestrians, bestCar;
initializeSimulation(4); // Start with 4 lanes

// Game state variables
let gameRunning = true;
let lastTimestamp = 0;
let fpsInterval = 1000 / frameRate;
let generation = 1;
let highScore = 0;

function setDifficulty(level) {
    difficulty = level;
    switch(level) {
        case "easy":
            trafficCount = 10;
            obstacleCount = 5;
            pedestrianCount = 3;
            break;
        case "medium":
            trafficCount = 15;
            obstacleCount = 10;
            pedestrianCount = 5;
            break;
        case "hard":
            trafficCount = 25;
            obstacleCount = 15;
            pedestrianCount = 8;
            break;
    }
    
    // Regenerate entities based on new difficulty
    traffic = generateTraffic(trafficCount);
    obstacles = generateObstacles(obstacleCount);
    pedestrians = generatePedestrians(pedestrianCount);
}

function initializeSimulation(laneCount) {
    road = new Road(carCanvas.width/2, carCanvas.width * 0.9, laneCount);
    road.environment = envSelect.value;
    
    // Initialize AI cars
    const N = 30;
    cars = generateCars(N);
    bestCar = cars[0];
    
    // Load saved brain if available
    if (localStorage.getItem("bestBrain")) {
        for (let i = 0; i < cars.length; i++) {
            cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
            if (i != 0) {
                NeuralNetwork.mutate(cars[i].brain, 0.05);
            }
        }
    }
    
    // Generate traffic, obstacles and pedestrians
    traffic = generateTraffic(trafficCount);
    obstacles = generateObstacles(obstacleCount);
    pedestrians = generatePedestrians(pedestrianCount);
}

function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
    alert("Brain saved!");
}

function discard() {
    localStorage.removeItem("bestBrain");
    alert("Brain discarded!");
}

function generateCars(N) {
    const cars = [];
    for (let i = 1; i <= N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
    }
    return cars;
}

function generateTraffic(count) {
    const traffic = [];
    const minSpeed = difficulty === "easy" ? 4.0 : (difficulty === "medium" ? 1.5 : 2.0);
    const maxSpeed = difficulty === "easy" ? 5.0 : (difficulty === "medium" ? 2.5 : 3.0);
    
    // Starting position for traffic
    let yPosition = -300;
    
    for (let i = 0; i < count; i++) {
        const lane = Math.floor(Math.random() * road.laneCount);
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const color = getRandomColor();
        
        // Add some randomness to y-positions to avoid traffic clumps
        yPosition -= 150 + Math.random() * 250;
        
        const trafficCar = new Car(
            road.getLaneCenter(lane),
            yPosition,
            30,
            50,
            "DUMMY",
            speed,
            color
        );
        
        // Add some traffic behavior variations
        trafficCar.changeLaneProbability = Math.random() * 0.01;
        trafficCar.slowDownProbability = Math.random() * 0.005;
        
        traffic.push(trafficCar);
    }
    return traffic;
}

function generateObstacles(count) {
    const obstacles = [];
    
    for (let i = 0; i < count; i++) {
        const y = -500 * i - Math.random() * 500;
        
        // Decide obstacle placement
        const placement = Math.random();
        let x;
        
        if (placement < 0.7) {
            // Place on side of road
            const side = Math.random() < 0.5 ? -1 : 1;
            x = road.getLaneCenter(side < 0 ? 0 : road.laneCount - 1) + 
                side * (road.width / road.laneCount) * 0.6;
        } else {
            // Place in a random lane
            const lane = Math.floor(Math.random() * road.laneCount);
            x = road.getLaneCenter(lane);
        }
        
        // Randomize obstacle type
        const types = ["cone", "barrel", "barrier"];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Size based on type
        let width, height;
        if (type === "cone") {
            width = 20;
            height = 30;
        } else if (type === "barrel") {
            width = 30;
            height = 40;
        } else { // barrier
            width = 80;
            height = 20;
        }
        
        obstacles.push(new Obstacle(x, y, width, height, type));
    }
    
    return obstacles;
}

function generatePedestrians(count) {
    const pedestrians = [];
    
    for (let i = 0; i < count; i++) {
        // Place pedestrians near crosswalks or randomly
        let y;
        if (Math.random() < 0.7 && road.crosswalks.length > 0) {
            // Near a crosswalk
            const crosswalkIndex = Math.floor(Math.random() * road.crosswalks.length);
            y = road.crosswalks[crosswalkIndex] + (Math.random() - 0.5) * 50;
        } else {
            // Random position
            y = -1000 * i - Math.random() * 1000;
        }
        
        // Start from outside the road
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = road.x + side * (road.width/2 + 20 + Math.random() * 50);
        
        pedestrians.push(new Pedestrian(x, y, 20, 40));
    }
    
    return pedestrians;
}

function animate(timestamp) {
    // Throttle frame rate
    if (timestamp - lastTimestamp < fpsInterval) {
        requestAnimationFrame(animate);
        return;
    }
    lastTimestamp = timestamp;
    
    // Update traffic with more complex behavior
    for (let i = 0; i < traffic.length; i++) {
        // Add lane-changing behavior
        if (Math.random() < traffic[i].changeLaneProbability) {
            const currentLane = Math.floor((traffic[i].x - road.left) / (road.width / road.laneCount));
            const newLane = currentLane + (Math.random() < 0.5 ? 1 : -1);
            
            if (newLane >= 0 && newLane < road.laneCount) {
                traffic[i].targetX = road.getLaneCenter(newLane);
            }
        }
        
        // Move toward target lane if needed
        if (traffic[i].targetX) {
            if (Math.abs(traffic[i].x - traffic[i].targetX) > 5) {
                traffic[i].x += (traffic[i].targetX > traffic[i].x ? 1 : -1) * 0.5;
            } else {
                traffic[i].targetX = null;
            }
        }
        
        // Random slowdown
        if (Math.random() < traffic[i].slowDownProbability) {
            traffic[i].speed *= 0.95;
        } else if (traffic[i].speed < traffic[i].maxSpeed) {
            traffic[i].speed += 0.01;
        }
        
        traffic[i].update(road.borders, []);
    }
    
    // Update pedestrians
    for (let i = 0; i < pedestrians.length; i++) {
        pedestrians[i].update(road);
    }
    
    // Update obstacles (some might move slightly)
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].movable) {
            obstacles[i].update();
        }
    }
    
    // Update traffic lights
    road.updateTrafficLights();
    
    // Update AI cars
    for (let i = 0; i < cars.length; i++) {
        // Check for pothole effects
        const pothole = road.isPothole(cars[i].x, cars[i].y, cars[i].width);
        if (pothole) {
            cars[i].angle += (Math.random() - 0.5) * 0.05 * pothole.depth;
            cars[i].speed *= (1 - pothole.depth/10);
        }
        
        // Check nearby traffic lights
        const nearbyLight = road.getNearestTrafficLight(cars[i].x, cars[i].y);
        if (nearbyLight && nearbyLight.state === "red") {
            // Add slight penalty for running red lights
            cars[i].score -= 0.1;
        }
        
        cars[i].update(road.borders, [...traffic, ...obstacles, ...pedestrians]);
    }
    
    // Find best performing car
    bestCar = cars.find(c => c.y === Math.min(...cars.map(c => c.y)));
    
    // Update high score
    if (bestCar.score > highScore) {
        highScore = bestCar.score;
    }
    
    // Reset simulation if all cars are damaged
    if (cars.every(c => c.damaged)) {
        generation++;
        evolvePopulation();
        initializeSimulation(road.laneCount);
    }
    
    // Set canvas dimensions
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    
    // Draw everything based on camera view
    carCtx.save();
    
    if (cameraView === "follow") {
        carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);
    } else {
        // Top-down view - show more of the road
        carCtx.translate(0, -bestCar.y + carCanvas.height * 0.9);
        carCtx.scale(0.7, 0.7); // Zoom out
        carCtx.translate(carCanvas.width * 0.2, 0); // Center the view
    }
    
    // Apply visual effects
    applyVisualEffects(carCtx);
    
    // Draw road and environment
    road.draw(carCtx);
    
    // Draw obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].draw(carCtx);
    }
    
    // Draw pedestrians
    for (let i = 0; i < pedestrians.length; i++) {
        pedestrians[i].draw(carCtx);
    }
    
    // Draw traffic
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx);
    }
    
    // Draw AI cars with transparency
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx);
    }
    
    // Draw best car with full opacity
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx, showSensors);
    
    carCtx.restore();
    
    // Draw neural network visualization
    networkCtx.lineDashOffset = -timestamp / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    
    // Update stats display
    updateStats();
    
    // Continue animation
    requestAnimationFrame(animate);
}

function evolvePopulation() {
    // Sort cars by fitness (distance traveled)
    const sortedCars = [...cars].sort((a, b) => b.score - a.score);
    
    // Take the top 30% as parents
    const eliteCount = Math.floor(cars.length * 0.3);
    const elites = sortedCars.slice(0, eliteCount);
    
    // Create next generation
    for (let i = 0; i < cars.length; i++) {
        if (i < eliteCount) {
            // Keep the best performers unchanged
            cars[i].brain = JSON.parse(JSON.stringify(elites[i].brain));
        } else {
            // Select a random elite parent
            const parentIndex = Math.floor(Math.random() * eliteCount);
            cars[i].brain = JSON.parse(JSON.stringify(elites[parentIndex].brain));
            
            // Apply mutation
            const mutationRate = 0.1 - (generation * 0.005); // Reduce mutation over time
            NeuralNetwork.mutate(cars[i].brain, Math.max(0.01, mutationRate));
        }
    }
}

function applyVisualEffects(ctx) {
    // Day/night cycle effect
    const time = Date.now() % 60000; // 1 minute cycle
    const dayNightCycle = time / 60000; // 0 to 1
    
    if (dayNightCycle > 0.7 || dayNightCycle < 0.3) {
        // Night time - add overlay
        const darkness = dayNightCycle > 0.7 ? 
            (dayNightCycle - 0.7) / 0.3 : 
            (0.3 - dayNightCycle) / 0.3;
        
        ctx.fillStyle = `rgba(0, 0, 40, ${darkness * 0.5})`;
        ctx.fillRect(0, -1000000, carCanvas.width * 2, 2000000);
        
        // Add car headlight effect during night
        if (bestCar && !bestCar.damaged) {
            const gradient = ctx.createRadialGradient(
                bestCar.x, bestCar.y, 0,
                bestCar.x, bestCar.y, 200
            );
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bestCar.x, bestCar.y, 200, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function updateStats() {
    statsDiv.innerHTML = `
        <h3>Simulation Stats</h3>
        <p>Generation: ${generation}</p>
        <p>Cars Alive: ${cars.filter(c => !c.damaged).length}/${cars.length}</p>
        <p>Current Score: ${Math.floor(bestCar.score)}</p>
        <p>High Score: ${Math.floor(highScore)}</p>
        <p>Current Speed: ${bestCar.speed.toFixed(2)}</p>
        <p>Environment: ${road.environment}</p>
        <p>Difficulty: ${difficulty}</p>
    `;
}

// Start the animation
animate();

// Add keyboard controls for save/discard
document.addEventListener("keydown", (event) => {
    if (event.key === "s") {
        save();
    }
    if (event.key === "d") {
        discard();
    }
    if (event.key === "v") {
        showSensors = !showSensors;
    }
    if (event.key === "c") {
        cameraView = cameraView === "follow" ? "top" : "follow";
    }
});

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 60%)`;
}