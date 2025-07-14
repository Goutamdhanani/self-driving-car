class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // "cone", "barrel", "barrier"
        
        this.color = this.getColor();
        this.polygon = this.#createPolygon();
    }
    
    getColor() {
        switch(this.type) {
            case "cone":
                return "#FF6600";
            case "barrel":
                return "#AA4400";
            case "barrier":
                return "#FFDD00";
            default:
                return "#FF0000";
        }
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
    
    draw(ctx) {
        if (this.type === "cone") {
            // Draw traffic cone
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.height/2);
            ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
            ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Base of the cone
            ctx.fillStyle = "#DDDDDD";
            ctx.fillRect(
                this.x - this.width/1.5, 
                this.y + this.height/2 - 5, 
                this.width*1.3, 
                5
            );
            
            // Reflective bands
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(
                this.x - this.width/4, 
                this.y, 
                this.width/2, 
                5
            );
        } 
        else if (this.type === "barrel") {
            // Draw barrel
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI*2);
            ctx.fill();
            
            // Barrel details - rings
            ctx.strokeStyle = "#DDDDDD";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2 - 3, 0, Math.PI*2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2 - 8, 0, Math.PI*2);
            ctx.stroke();
        }
        else if (this.type === "barrier") {
            // Draw barrier
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x - this.width/2, 
                this.y - this.height/2, 
                this.width, 
                this.height
            );
            
            // Stripes
            ctx.fillStyle = "#FF0000";
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    this.x - this.width/2 + i*this.width/3, 
                    this.y - this.height/2, 
                    this.width/6, 
                    this.height
                );
            }
        }
        
        // Debug: draw polygon outline
        /*
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        */
    }
}