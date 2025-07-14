class Car {
    constructor(x, y, width, height, controlType, maxSpeed = 3, color = "blue") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;
        this.score = 0; // Track score based on distance
        this.fitness = 0; // For genetic algorithm
        this.useBrain = controlType == "AI";
        this.controls = new Controls(controlType);
        
        // Enhanced physics properties
        this.drift = 0;
        this.maxDrift = 0.05;
        this.driftRecovery = 0.002;
        this.engineSound = null;
        
        if (controlType != "DUMMY") {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 16, 8, 4]); // Enhanced neural network
        }

        this.img = new Image();
        this.img.src = "car.png";
        
        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;

        const maskCtx = this.mask.getContext("2d");
        this.img.onload = () => {
            maskCtx.fillStyle = color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        }
        
        // Backup rendering method in case image fails to load
        this.imgLoaded = false;
        this.img.onload = () => {
            this.imgLoaded = true;
            maskCtx.fillStyle = color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();
            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        }
        
        // Particle effects for visual enhancement
        this.particles = [];
        this.trails = [];
    }

    update(roadBorders, traffic, obstacles = []) {
        if (!this.damaged) {
            this.#move();
            this.score += this.speed; // Increase score based on speed
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, [...traffic, ...obstacles]);
        } else {
            this.speed = 0;
        }
        
        if (this.sensor) {
            this.sensor.update(roadBorders, [...traffic, ...obstacles]);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            if (this.useBrain) {
                this.controls.forward = outputs[0] > 0.5;
                this.controls.left = outputs[1] > 0.5;
                this.controls.right = outputs[2] > 0.5;
                this.controls.reverse = outputs[3] > 0.5;
            }
        }
        
        // Update particle effects
        this.#updateEffects();
    }

    #assessDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }
        for (let i = 0; i < traffic.length; i++) {
            if (traffic[i].polygon && polysIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move() {
        // Enhanced physics model with drift
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // Calculate drift when turning at high speeds
        if (this.speed > this.maxSpeed * 0.6) {
            if (this.controls.left) {
                this.drift -= 0.0025;
            }
            if (this.controls.right) {
                this.drift += 0.0025;
            }
        }
        
        // Limit drift and apply recovery
        this.drift = Math.max(-this.maxDrift, Math.min(this.maxDrift, this.drift));
        if (Math.abs(this.drift) > 0) {
            this.drift *= (1 - this.driftRecovery);
            
            // Create tire marks when drifting
            if (Math.abs(this.drift) > 0.02 && this.speed > 1) {
                this.#createTireMarks();
            }
        }

        if (this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;
            const steeringSensitivity = 0.03;
            
            if (this.controls.left) {
                this.angle += steeringSensitivity * flip;
            }
            if (this.controls.right) {
                this.angle -= steeringSensitivity * flip;
            }
        }

        // Apply drift to angle
        this.angle += this.drift * this.speed;
        
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }
    
    #createTireMarks() {
        if (Math.random() > 0.3) return;
        
        const backLeftWheel = {
            x: this.x - Math.sin(this.angle + Math.PI/2) * (this.width/3),
            y: this.y - Math.cos(this.angle + Math.PI/2) * (this.width/3)
        };
        
        const backRightWheel = {
            x: this.x - Math.sin(this.angle - Math.PI/2) * (this.width/3),
            y: this.y - Math.cos(this.angle - Math.PI/2) * (this.width/3)
        };
        
        this.trails.push({
            x: backLeftWheel.x,
            y: backLeftWheel.y,
            ttl: 100
        });
        
        this.trails.push({
            x: backRightWheel.x,
            y: backRightWheel.y,
            ttl: 100
        });
    }
    
    #updateEffects() {
        // Update tire marks
        for (let i = this.trails.length - 1; i >= 0; i--) {
            this.trails[i].ttl--;
            if (this.trails[i].ttl <= 0) {
                this.trails.splice(i, 1);
            }
        }
        
        // Create engine particles when accelerating
        if (this.controls.forward && this.speed > 0 && Math.random() > 0.7) {
            const backPos = {
                x: this.x + Math.sin(this.angle) * this.height/2,
                y: this.y + Math.cos(this.angle) * this.height/2
            };
            
            this.particles.push({
                x: backPos.x,
                y: backPos.y,
                size: 2 + Math.random() * 3,
                speed: 0.5 + Math.random(),
                angle: this.angle + Math.PI + (Math.random() - 0.5) * 0.5,
                ttl: 20 + Math.random() * 20
            });
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += Math.sin(p.angle) * p.speed;
            p.y += Math.cos(p.angle) * p.speed;
            p.ttl--;
            if (p.ttl <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, drawSensor = false) {
        // Draw tire marks
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        for (const trail of this.trails) {
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw exhaust particles
        ctx.fillStyle = "rgba(100,100,100,0.5)";
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        
        if (this.imgLoaded) {
            // If image loaded successfully, use it
            if (!this.damaged) {
                ctx.drawImage(this.mask,
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height);
                ctx.drawImage(this.img,
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height);
            } else {
                ctx.drawImage(this.mask,
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height);
            }
        } else {
            // Fallback rendering if image failed to load
            ctx.fillStyle = this.damaged ? "gray" : "blue";
            ctx.beginPath();
            ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
            ctx.fill();
            
            // Draw car details
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.rect(-this.width/2.5, -this.height/4, this.width/5, this.height/2);
            ctx.rect(this.width/2.5 - this.width/5, -this.height/4, this.width/5, this.height/2);
            ctx.fill();
        }
        
        // Draw headlights
        if (!this.damaged) {
            ctx.fillStyle = "rgba(255, 255, 200, 0.6)";
            ctx.beginPath();
            ctx.rect(-this.width/2.5, -this.height/2, this.width/10, this.height/10);
            ctx.rect(this.width/2.5 - this.width/10, -this.height/2, this.width/10, this.height/10);
            ctx.fill();
        }
        
        ctx.restore();
    }
}