import { Tool } from "@/components/Canvas";
import { getExistingShapes, deleteShape } from "./http";

type Shapes = {
    id: string;
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    id: string;
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    id: string;
    type: "pencil";
    points: { x: number; y: number }[];
} | {
    id:string;
    type:"text";
    x:number;
    y:number;
    fontSize:number;
    fontFamily:string;
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shapes[];
    private roomId: string;
    private clicked: boolean;
    private startX: number;
    private startY: number;
    socket: WebSocket;
    private selectedTool: Tool = "circle"
    private currentPencilPoints: { x: number, y: number }[] = [];

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId
        this.socket = socket;
        this.clicked = false
        this.startX = 0;
        this.startY = 0;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandlers)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandlers)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandlers)
    }

    setTool(tool: "circle" | "rect" | "pencil" | "eraser") {
        this.selectedTool = tool

        if (tool === "eraser") {
            this.canvas.style.cursor = "crosshair";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId)
        this.clearCanves()
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const messgae = JSON.parse(event.data)

            if (messgae.type === "chat") {
                const parsedShape = JSON.parse(messgae.message);
                this.existingShapes.push(parsedShape.shape)
                this.clearCanves()
            } else if (messgae.type === "shape_deleted") {
                // Remove the shape from local array
                this.existingShapes = this.existingShapes.filter(shape => shape.id !== messgae.shapeId);
                this.clearCanves();
            }
        }
    }

    clearCanves() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.existingShapes.map((shape) => {
            this.ctx.strokeStyle = "rgba(255, 255, 255)"
            this.ctx.lineWidth = 2;

            if (shape.type === "rect") {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
            } else if (shape.type === "circle") {
                this.ctx.beginPath()
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke()
                this.ctx.closePath()
            } else if (shape.type === "pencil") {
                if (shape.points.length > 1) {
                    this.ctx.beginPath()
                    this.ctx.moveTo(shape.points[0].x, shape.points[0].y)
                    for (let i = 1; i < shape.points.length; i++) {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y)
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            }
        })
    }

    private getMousePos(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    // Check if a point is inside a rectangle
    private isPointInRect(x: number, y: number, rect: { x: number, y: number, width: number, height: number }) {
        return x >= rect.x && x <= rect.x + rect.width && 
               y >= rect.y && y <= rect.y + rect.height;
    }

    // Check if a point is inside a circle
    private isPointInCircle(x: number, y: number, circle: { centerX: number, centerY: number, radius: number }) {
        const distance = Math.sqrt(Math.pow(x - circle.centerX, 2) + Math.pow(y - circle.centerY, 2));
        return distance <= circle.radius;
    }

    // Check if a point is near a pencil stroke (within tolerance)
    private isPointNearPencilStroke(x: number, y: number, points: { x: number, y: number }[], tolerance: number = 10) {
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            // Calculate distance from point to line segment
            const A = x - p1.x;
            const B = y - p1.y;
            const C = p2.x - p1.x;
            const D = p2.y - p1.y;
            
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) {
                param = dot / lenSq;
            }
            
            let xx, yy;
            if (param < 0) {
                xx = p1.x;
                yy = p1.y;
            } else if (param > 1) {
                xx = p2.x;
                yy = p2.y;
            } else {
                xx = p1.x + param * C;
                yy = p1.y + param * D;
            }
            
            const dx = x - xx;
            const dy = y - yy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= tolerance) {
                return true;
            }
        }
        return false;
    }

    // Find shape at given coordinates
    private findShapeAtPoint(x: number, y: number): Shapes | null {
        // Check shapes in reverse order (top to bottom)
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];
            
            if (shape.type === "rect" && this.isPointInRect(x, y, shape)) {
                return shape;
            } else if (shape.type === "circle" && this.isPointInCircle(x, y, shape)) {
                return shape;
            } else if (shape.type === "pencil" && this.isPointNearPencilStroke(x, y, shape.points)) {
                return shape;
            }
        }
        return null;
    }

    mouseDownHandlers = (e: MouseEvent) => {
        const pos = this.getMousePos(e);
        
        if (this.selectedTool === "eraser") {
            // Handle eraser click
            const shapeToDelete = this.findShapeAtPoint(pos.x, pos.y);
            if (shapeToDelete) {
                this.deleteShape(shapeToDelete);
            }
            return;
        }

        this.clicked = true
        this.startX = pos.x;
        this.startY = pos.y;

        if (this.selectedTool === "pencil") {
            this.currentPencilPoints = [{ x: pos.x, y: pos.y }];
        }
    }

    mouseUpHandlers = (e: MouseEvent) => {
        if (this.selectedTool === "eraser") {
            return; // Eraser doesn't need mouseup handling
        }

        this.clicked = false
        const pos = this.getMousePos(e);
        const width = pos.x - this.startX;
        const height = pos.y - this.startY;

        const selectedTool = this.selectedTool;
        let shape: Shapes | null = null;
        if (selectedTool === "rect") {
            shape = {
                id: this.generateId(),
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width
            }

        } else if (selectedTool == "circle") {
            const radius = Math.sqrt(width * width + height * height) / 2;
            shape = {
                id: this.generateId(),
                type: "circle",
                radius: radius,
                centerX: this.startX + radius / 2,
                centerY: this.startY + radius / 2
            }
        } else if (selectedTool === "pencil" && this.currentPencilPoints.length > 1) {
            shape = {
                id: this.generateId(),
                type: "pencil",
                points: [...this.currentPencilPoints]
            }
        }
        if (!shape) return;
        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId
        }))

        // Reset pencil points
        this.currentPencilPoints = [];
    }

    mouseMoveHandlers = (e: MouseEvent) => {
        if (this.selectedTool === "eraser") {
            return; // Eraser doesn't need mousemove handling
        }

        if (this.clicked) {
            const pos = this.getMousePos(e);
            if (this.selectedTool === "pencil") {

                // Add current point to pencil path
                this.currentPencilPoints.push({ x: pos.x, y: pos.y });

                // Redraw everything including current pencil stroke
                this.clearCanves();
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.lineWidth = 2;

                if (this.currentPencilPoints.length > 1) {
                    this.ctx.beginPath()
                    this.ctx.moveTo(this.currentPencilPoints[0].x, this.currentPencilPoints[0].y)
                    for (let i = 1; i < this.currentPencilPoints.length; i++) {
                        this.ctx.lineTo(this.currentPencilPoints[i].x, this.currentPencilPoints[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }

            } else {
                const width = pos.x - this.startX;
                const height = pos.y - this.startY;
                this.clearCanves()
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.lineWidth = 2

                if (this.selectedTool === "rect") {
                    this.ctx.strokeRect(this.startX, this.startY, width, height)
                } else if(this.selectedTool === "circle"){
                    const radius = Math.sqrt(width * width + height * height) / 2;
                    const centerX = this.startX + width / 2;
                    const centerY = this.startY + height / 2;

                    this.ctx.beginPath()
                    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    this.ctx.stroke()
                    this.ctx.closePath()
                }

            }
        }
    }

    // Generate unique ID for shapes
    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36);
    }

    // Delete a shape
    private async deleteShape(shape: Shapes) {
        try {
            // Remove from local array immediately for responsive UI
            this.existingShapes = this.existingShapes.filter(s => s.id !== shape.id);
            this.clearCanves();

            // Use the HTTP API to delete from backend
            await deleteShape(this.roomId, shape.id);

            // Send notification via WebSocket to other users
            this.socket.send(JSON.stringify({
                type: "shape_deleted",
                shapeId: shape.id,
                roomId: this.roomId
            }));

        } catch (error) {
            console.error('Error deleting shape:', error);
            // Re-add the shape if deletion failed
            this.existingShapes.push(shape);
            this.clearCanves();
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandlers)
        this.canvas.addEventListener("mouseup", this.mouseUpHandlers)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandlers)
    }
}