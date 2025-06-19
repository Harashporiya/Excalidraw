import { Tool } from "@/components/Canvas";
import { getExistingShapes, deleteShape } from "./http";

type Shapes = {
    id: string;
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    color:string;
} | {
    id: string;
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    color:string;
} | {
    id: string;
    type: "pencil";
    color:string;
    points: { x: number; y: number }[];
} | {
    id:string;
    type:"text";
    x:number;
    y:number;
    fontSize:number;
    fontFamily:string;
    color:string;
} | {
    id: string;
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
} | {
    id: string;
    type: "arrowRight";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
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
    private currentColor: string = "#ffffff";

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

    setColor(color: string) {
        this.currentColor = color;
    }

    setTool(tool: Tool) {
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
                this.existingShapes = this.existingShapes.filter(shape => shape.id !== messgae.shapeId);
                this.clearCanves();
            }
        }
    }

    clearCanves() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.map((shape) => {
            this.ctx.strokeStyle = (shape as any).color || "rgba(255, 255, 255)";
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = (shape as any).color || "rgba(255, 255, 255)";

            if (shape.type === "rect") {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "pencil") {
                if (shape.points.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    for (let i = 1; i < shape.points.length; i++) {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            } else if (shape.type === "line") {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.x1, shape.y1);
                this.ctx.lineTo(shape.x2, shape.y2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "arrowRight") {
                this.drawArrow(shape.x1, shape.y1, shape.x2, shape.y2);
            }
        });
    }

    private drawArrow(x1: number, y1: number, x2: number, y2: number) {
        // Draw the line
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        // Calculate the angle of the line direction
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Draw the arrowhead
        const arrowSize = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle - Math.PI / 6),
            y2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle + Math.PI / 6),
            y2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    private getMousePos(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    private isPointInRect(x: number, y: number, rect: { x: number, y: number, width: number, height: number }) {
        return x >= rect.x && x <= rect.x + rect.width && 
               y >= rect.y && y <= rect.y + rect.height;
    }

    private isPointInCircle(x: number, y: number, circle: { centerX: number, centerY: number, radius: number }) {
        const distance = Math.sqrt(Math.pow(x - circle.centerX, 2) + Math.pow(y - circle.centerY, 2));
        return distance <= circle.radius;
    }

    private isPointNearLine(x: number, y: number, line: { x1: number, y1: number, x2: number, y2: number }, tolerance: number = 5) {
        const { x1, y1, x2, y2 } = line;
        
        // Calculate distance from point to line segment
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= tolerance;
    }

    private isPointNearPencilStroke(x: number, y: number, points: { x: number, y: number }[], tolerance: number = 10) {
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
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

    private findShapeAtPoint(x: number, y: number): Shapes | null {
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];
            
            if (shape.type === "rect" && this.isPointInRect(x, y, shape)) {
                return shape;
            } else if (shape.type === "circle" && this.isPointInCircle(x, y, shape)) {
                return shape;
            } else if (shape.type === "pencil" && this.isPointNearPencilStroke(x, y, shape.points)) {
                return shape;
            } else if ((shape.type === "line" || shape.type === "arrowRight") && 
                      this.isPointNearLine(x, y, { x1: shape.x1, y1: shape.y1, x2: shape.x2, y2: shape.y2 })) {
                return shape;
            }
        }
        return null;
    }

    mouseDownHandlers = (e: MouseEvent) => {
        const pos = this.getMousePos(e);
        
        if (this.selectedTool === "eraser") {
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
            return;
        }

        this.clicked = false
        const pos = this.getMousePos(e);
        const endX = pos.x;
        const endY = pos.y;

        let shape: Shapes | null = null;
        
        if (this.selectedTool === "rect") {
            shape = {
                id: this.generateId(),
                type: "rect",
                x: this.startX,
                y: this.startY,
                height: endY - this.startY,
                width: endX - this.startX,
                color: this.currentColor
            };
        } else if (this.selectedTool === "circle") {
            const radius = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2)) / 2;
            shape = {
                id: this.generateId(),
                type: "circle",
                radius: radius,
                centerX: this.startX + (endX - this.startX) / 2,
                centerY: this.startY + (endY - this.startY) / 2,
                color: this.currentColor
            };
        } else if (this.selectedTool === "pencil" && this.currentPencilPoints.length > 1) {
            shape = {
                id: this.generateId(),
                type: "pencil",
                points: [...this.currentPencilPoints],
                color: this.currentColor
            };
        } else if (this.selectedTool === "line") {
            shape = {
                id: this.generateId(),
                type: "line",
                x1: this.startX,
                y1: this.startY,
                x2: endX,
                y2: endY,
                color: this.currentColor
            };
        } else if (this.selectedTool === "arrowRight") {
            shape = {
                id: this.generateId(),
                type: "arrowRight",
                x1: this.startX,
                y1: this.startY,
                x2: endX,
                y2: endY,
                color: this.currentColor
            };
        }

        if (!shape) return;
        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId
        }));

        this.currentPencilPoints = [];
    }

    mouseMoveHandlers = (e: MouseEvent) => {
        if (this.selectedTool === "eraser") {
            return;
        }

        if (this.clicked) {
            const pos = this.getMousePos(e);
            if (this.selectedTool === "pencil") {
                this.currentPencilPoints.push({ x: pos.x, y: pos.y });
                this.clearCanves();
                this.ctx.strokeStyle = this.currentColor;
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
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = 2;
                this.ctx.fillStyle = this.currentColor;

                if (this.selectedTool === "rect") {
                    this.ctx.strokeRect(this.startX, this.startY, width, height)
                } else if (this.selectedTool === "circle") {
                    const radius = Math.sqrt(width * width + height * height) / 2;
                    const centerX = this.startX + width / 2;
                    const centerY = this.startY + height / 2;

                    this.ctx.beginPath()
                    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    this.ctx.stroke()
                    this.ctx.closePath()
                } else if (this.selectedTool === "line") {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(pos.x, pos.y);
                    this.ctx.stroke();
                    this.ctx.closePath();
                } else if (this.selectedTool === "arrowRight") {
                    this.drawArrow(this.startX, this.startY, pos.x, pos.y);
                }
            }
        }
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36);
    }

    private async deleteShape(shape: Shapes) {
        try {
            this.existingShapes = this.existingShapes.filter(s => s.id !== shape.id);
            this.clearCanves();

            await deleteShape(this.roomId, shape.id);

            this.socket.send(JSON.stringify({
                type: "shape_deleted",
                shapeId: shape.id,
                roomId: this.roomId
            }));

        } catch (error) {
            console.error('Error deleting shape:', error);
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