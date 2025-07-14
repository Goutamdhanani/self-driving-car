class Pedestrian {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.speed = 0.8 + Math.random() * 0.6;
        this.direction = Math.random() < 0.5 ? -1 : 1; // left or right
        this.crossingState = "waiting"; // waiting, crossing, or crossed
        this.crossingTimer = 0;
        this.maxCrossingTime = 150 + Math.random() * 100;
        this.waitingTime = 0;
        this.maxWaitingTime = 200 + Math.random() * 300;
        
        // Animation properties
        this.stepCycle = 0;
        this.stepSpeed = 0.1 + Math.random() * 0.05;
        this.armSwing = 0;
        
        // Visual variety
        this.colors = [
            "#f44336", "#e91e63", "#9c27b0", "#673ab7", 
            "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", 
            "#009688", "#4caf50", "#8bc34a", "#cddc39"
        ];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.hasHat = Math.random() > 0.7;
        this.hasBag = Math.random() > 0.5;
        
        this.polygon = this.#createPolygon();
    }
    
    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        
        points.push({
            x: this.x - Math.sin(-alpha) * rad,
            y: this.y - Math.cos(-alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(alpha) * rad,
            y: this.y - Math.cos(alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI - alpha) * rad,
            y: this.y - Math.cos(Math.PI - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + alpha) * rad,
            y: this.y - Math.cos(Math.PI + alpha) * rad
        });
        
        return points;
    }
    
    update(road) {
        if (this.crossingState === "waiting") {
            this.waitingTime++;
            if (this.waitingTime >= this.maxWaitingTime) {
                this.crossingState = "crossing";
                this.waitingTime = 0;
            }
        } else if (this.crossingState === "crossing") {
            this.x += this.speed * this.direction;
            this.stepCycle += this.stepSpeed;
            this.armSwing = Math.sin(this.stepCycle) * 15;
            this.crossingTimer++;
            
            if (this.x < road.left - this.width || this.x > road.right + this.width) {
                this.crossingState = "crossed";
            }
            
            if (this.crossingTimer >= this.maxCrossingTime) {
                this.crossingState = "crossed";
            }
        }
        
        this.polygon = this.#createPolygon();
    }
    
    draw(ctx) {
        if (this.crossingState === "crossed") return;
        
        // Calculate animation values
        const legSpread = Math.sin(this.stepCycle) * 5;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.direction < 0) {
            ctx.scale(-1, 1); // Flip horizontally if going left
        }
        
        // Draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(
            0, 
            0, 
            this.width/2, 
            this.height/2, 
            0, 
            0, 
            Math.PI*2
        );
        ctx.fill();
        
        // Draw head
        ctx.fillStyle = "#FFD7B4"; // Skin tone
        ctx.beginPath();
        ctx.arc(
            0, 
            -this.height/2 - 10, 
            10, 
            0, 
            Math.PI*2
        );
        ctx.fill();
        
        // Draw hat if present
        if (this.hasHat) {
            ctx.fillStyle = "#333333";
            ctx.beginPath();
            ctx.arc(
                0, 
                -this.height/2 - 12, 
                8, 
                0, 
                Math.PI*2
            );
            ctx.fill();
            
            ctx.fillStyle = "#555555";
            ctx.beginPath();
            ctx.ellipse(
                0,
                -this.height/2 - 8,
                12,
                3,
                0,
                0,
                Math.PI*2
            );
            ctx.fill();
        }
        
        // Draw legs with animation
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 3;
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(0, this.height/4);
        ctx.lineTo(-5 - legSpread, this.height/2 + 15);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(0, this.height/4);
        ctx.lineTo(5 - legSpread, this.height/2 + 15);
        ctx.stroke();
        
        // Draw arms with swing
        ctx.beginPath();
        ctx.moveTo(0, -this.height/6);
        ctx.lineTo(-this.armSwing, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -this.height/6);
        ctx.lineTo(this.armSwing, 0);
        ctx.stroke();
        
        // Draw bag if present
        if (this.hasBag) {
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(-5, -this.height/6, 15, 20);
            
            // Bag strap
            ctx.strokeStyle = "#8B4513";
            ctx.beginPath();
            ctx.moveTo(5, -this.height/6);
            ctx.lineTo(0, -this.height/3);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}