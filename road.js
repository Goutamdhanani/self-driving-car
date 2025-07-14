class Road {
    constructor(x, width, laneCount = 4) {
        this.x = x;
        this.width = width;
        this.laneCount = laneCount;

        this.left = x - width / 2;
        this.right = x + width / 2;

        const infinity = 1000000;
        this.top = -infinity;
        this.bottom = infinity;

        const topLeft = { x: this.left, y: this.top };
        const topRight = { x: this.right, y: this.top };
        const bottomLeft = { x: this.left, y: this.bottom };
        const bottomRight = { x: this.right, y: this.bottom };
        this.borders = [
            [topLeft, bottomLeft],
            [topRight, bottomRight]
        ];

        // Enhanced road features
        this.dashSegmentLength = 30;
        this.dashGapLength = 50;
        this.crosswalks = [];
        this.potholes = [];
        this.trafficLights = [];
        this.environment = "city"; // city, highway, rural
        
        // Generate road features
        this.generateRoadFeatures();
    }

    generateRoadFeatures() {
        // Generate crosswalks every 800 pixels
        for (let y = -5000; y <= 0; y += 800) {
            this.crosswalks.push(y);
        }

        // Generate potholes randomly
        for (let y = -5000; y <= 0; y += 200) {
            if (Math.random() < 0.1) {
                const lane = Math.floor(Math.random() * this.laneCount);
                const x = this.getLaneCenter(lane);
                const offset = (Math.random() - 0.5) * (this.width / this.laneCount) * 0.5;
                this.potholes.push({
                    x: x + offset,
                    y: y,
                    radius: 5 + Math.random() * 10,
                    depth: 0.2 + Math.random() * 0.3 // How much it affects car handling
                });
            }
        }
        
        // Generate traffic lights
        for (let y = -4800; y <= 0; y += 800) {
            // Add traffic light pair (one on each side)
            this.trafficLights.push({
                x: this.left - 20,
                y: y,
                state: Math.random() < 0.5 ? "red" : "green",
                timer: Math.floor(Math.random() * 200) + 100
            });
            
            this.trafficLights.push({
                x: this.right + 20,
                y: y,
                state: Math.random() < 0.5 ? "red" : "green", 
                timer: Math.floor(Math.random() * 200) + 100
            });
        }
    }

    getLaneCenter(laneIndex) {
        const laneWidth = this.width / this.laneCount;
        return this.left + laneWidth / 2 + Math.min(laneIndex, this.laneCount - 1) * laneWidth;
    }
    
    isPothole(x, y, carWidth) {
        for (const pothole of this.potholes) {
            const dx = pothole.x - x;
            const dy = pothole.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < pothole.radius + carWidth/3) {
                return pothole;
            }
        }
        return null;
    }
    
    updateTrafficLights() {
        for (const light of this.trafficLights) {
            light.timer--;
            if (light.timer <= 0) {
                // Change light state
                light.state = light.state === "red" ? "green" : "red";
                light.timer = light.state === "red" ? 200 : 300; // Red lights shorter than green
            }
        }
    }
    
    getNearestTrafficLight(x, y) {
        let minDist = Infinity;
        let nearest = null;
        
        for (const light of this.trafficLights) {
            const dy = light.y - y;
            if (dy < 0 && dy > -200) { // Only consider lights ahead within 200px
                const dx = light.x - x;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = light;
                }
            }
        }
        
        return nearest;
    }

    draw(ctx) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = "white";

        // Draw lane markers
        for (let i = 1; i <= this.laneCount - 1; i++) {
            const x = lerp(
                this.left,
                this.right,
                i / this.laneCount
            );

            // Draw dashed lines
            ctx.setLineDash([this.dashSegmentLength, this.dashGapLength]);
            ctx.beginPath();
            ctx.moveTo(x, this.top);
            ctx.lineTo(x, this.bottom);
            ctx.stroke();
        }

        // Draw solid border lines
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.left, this.bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.right, this.top);
        ctx.lineTo(this.right, this.bottom);
        ctx.stroke();

        // Draw edge stripes (yellow)
        ctx.strokeStyle = "#F7B731";
        ctx.lineWidth = 3;
        
        // Left edge stripe
        ctx.beginPath();
        ctx.moveTo(this.left + 8, this.top);
        ctx.lineTo(this.left + 8, this.bottom);
        ctx.stroke();
        
        // Right edge stripe
        ctx.beginPath();
        ctx.moveTo(this.right - 8, this.top);
        ctx.lineTo(this.right - 8, this.bottom);
        ctx.stroke();

        // Draw crosswalks
        ctx.fillStyle = "white";
        for (const y of this.crosswalks) {
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(
                    this.left + i * (this.width / 10),
                    y,
                    this.width / 20,
                    30
                );
            }
        }

        // Draw potholes with 3D effect
        for (const pothole of this.potholes) {
            const gradient = ctx.createRadialGradient(
                pothole.x, pothole.y, 0,
                pothole.x, pothole.y, pothole.radius
            );
            gradient.addColorStop(0, '#333333');
            gradient.addColorStop(0.7, '#555555');
            gradient.addColorStop(1, '#777777');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pothole.x, pothole.y, pothole.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add texture inside pothole
            ctx.fillStyle = "#222222";
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * pothole.radius * 0.7;
                const x = pothole.x + Math.cos(angle) * dist;
                const y = pothole.y + Math.sin(angle) * dist;
                const size = 1 + Math.random() * 3;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw traffic lights
        for (const light of this.trafficLights) {
            // Light pole
            ctx.fillStyle = "#333333";
            ctx.fillRect(light.x - 2, light.y - 50, 4, 50);
            
            // Light housing
            ctx.fillStyle = "#222222";
            ctx.fillRect(light.x - 8, light.y - 60, 16, 30);
            
            // Light color
            ctx.fillStyle = light.state === "red" ? "#FF0000" : 
                           (light.state === "yellow" ? "#FFFF00" : "#00FF00");
            ctx.beginPath();
            ctx.arc(light.x, light.y - 45, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw roadside details based on environment
        this.#drawEnvironmentDetails(ctx);
    }
    
    #drawEnvironmentDetails(ctx) {
        // Draw roadside details based on environment type
        const detail = 20; // Detail density
        
        if (this.environment === "city") {
            // Draw buildings on the sides
            for (let y = Math.floor(this.top / 500) * 500; y < this.bottom; y += 500) {
                // Left side buildings
                const buildingHeight = 100 + Math.random() * 150;
                const buildingWidth = 80 + Math.random() * 60;
                ctx.fillStyle = `rgb(${100 + Math.random() * 100}, ${100 + Math.random() * 100}, ${100 + Math.random() * 100})`;
                ctx.fillRect(this.left - buildingWidth - 20, y, buildingWidth, buildingHeight);
                
                // Add windows
                ctx.fillStyle = "rgba(255, 255, 200, 0.5)";
                const floors = Math.floor(buildingHeight / 20);
                const columns = Math.floor(buildingWidth / 15);
                for (let fl = 0; fl < floors; fl++) {
                    for (let col = 0; col < columns; col++) {
                        if (Math.random() > 0.3) {
                            ctx.fillRect(
                                this.left - buildingWidth - 20 + 5 + col * 15, 
                                y + 5 + fl * 20, 
                                10, 
                                15
                            );
                        }
                    }
                }
                
                // Right side buildings
                const rightBuildingHeight = 100 + Math.random() * 150;
                const rightBuildingWidth = 80 + Math.random() * 60;
                ctx.fillStyle = `rgb(${100 + Math.random() * 100}, ${100 + Math.random() * 100}, ${100 + Math.random() * 100})`;
                ctx.fillRect(this.right + 20, y, rightBuildingWidth, rightBuildingHeight);
                
                // Add windows
                ctx.fillStyle = "rgba(255, 255, 200, 0.5)";
                const rightFloors = Math.floor(rightBuildingHeight / 20);
                const rightColumns = Math.floor(rightBuildingWidth / 15);
                for (let fl = 0; fl < rightFloors; fl++) {
                    for (let col = 0; col < rightColumns; col++) {
                        if (Math.random() > 0.3) {
                            ctx.fillRect(
                                this.right + 20 + 5 + col * 15, 
                                y + 5 + fl * 20, 
                                10, 
                                15
                            );
                        }
                    }
                }
            }
        } else if (this.environment === "rural") {
            // Draw trees and grass
            for (let y = Math.floor(this.top / 100) * 100; y < this.bottom; y += 100) {
                if (Math.random() > 0.7) {
                    // Left side tree
                    const treeHeight = 30 + Math.random() * 30;
                    ctx.fillStyle = "#513A25"; // Tree trunk
                    ctx.fillRect(this.left - 30, y, 5, treeHeight);
                    
                    // Tree foliage
                    ctx.fillStyle = "#2D5F2D";
                    ctx.beginPath();
                    ctx.arc(this.left - 27.5, y - treeHeight/2, treeHeight*0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                if (Math.random() > 0.7) {
                    // Right side tree
                    const treeHeight = 30 + Math.random() * 30;
                    ctx.fillStyle = "#513A25"; // Tree trunk
                    ctx.fillRect(this.right + 25, y, 5, treeHeight);
                    
                    // Tree foliage
                    ctx.fillStyle = "#2D5F2D";
                    ctx.beginPath();
                    ctx.arc(this.right + 27.5, y - treeHeight/2, treeHeight*0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (this.environment === "highway") {
            // Draw guardrails
            ctx.strokeStyle = "#AAAAAA";
            ctx.lineWidth = 2;
            
            // Left guardrail
            ctx.beginPath();
            ctx.moveTo(this.left - 15, this.top);
            ctx.lineTo(this.left - 15, this.bottom);
            ctx.stroke();
            
            // Right guardrail
            ctx.beginPath();
            ctx.moveTo(this.right + 15, this.top);
            ctx.lineTo(this.right + 15, this.bottom);
            ctx.stroke();
            
            // Guardrail posts
            ctx.fillStyle = "#888888";
            for (let y = Math.floor(this.top / 50) * 50; y < this.bottom; y += 50) {
                // Left posts
                ctx.fillRect(this.left - 17, y, 4, 30);
                
                // Right posts
                ctx.fillRect(this.right + 13, y, 4, 30);
            }
        }
    }
}