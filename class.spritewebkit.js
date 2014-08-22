//WebSpriteAnimationKit
function Sprite(op) {
    var o = op || {};
    
    //list object properties
    this.context = o.context || ctx; //pass specified context or else grab global context
    this.image = o.image || (new Image());
    this.width = o.width || 0; //output width of image
    this.height = o.height || 0; //output height of image
    this.cellWidth = o.cellWidth || this.width; //if a cellWidth is specified then the actual dimensions of each cell in the sprite, are different to the desired output size
    this.cellHeight = o.cellHeight || this.height;
    this.x = o.x || 0; //center x
    this.y = o.y || 0; //center y
    this.frame = (o.frame && (o.frame > 0)) ? o.frame : 0; //if o.frame exists and is greater than 0
    this.totalFrames = (o.totalFrames < 0) ? 0 : ((typeof o.totalFrames == "number") ? o.totalFrames : 'auto'); //value of 0 means 1 frame of animation, since index starts at 0; take only positive numbers including 0, else use 'auto'
    this.fps = o.fps || false; //if using an fps, use delta, else just incremement the frame everytime render is called.
    
    this.loop = (o.loop < 0) ? 0 : ((o.loop && (typeof o.loop == "number")) ? o.loop : ((!o.loop && (typeof o.loop != "undefined")) ? 1 : 0)); //if its negative, set to 0 else if a number set to the value, else if its false and not undefined, its probably a boolean false, therefore shouldnt loop, and set to play once loop:1. If its undefined or it evaluates to true, set it to 0, i.e. endless. (for values like loop: true or loop: "yes")
    this.finished = false; //not set by user but still needs to be accessible to check for deletion
    this.lastTime = 0; //used for delta and animation timing

    //private vars (that aren't actually private because using prototype is better anyway)
    this._cellCol = 0; //current cell row - stores the int of which cell in the sprite should be displayed
    this._cellRow = 0; //current cell column
    this._maxRows = 0; //WILL BE CALCULATED AT RUNTIME
    this._maxCols = 0; //WILL BE CALCULATED AT RUNTIME
    
    this._currentLoop = 0; //stores number of times animation has looped - used only for limited looped sprites
    
}
Sprite.prototype.render = function(ct) {
    var ctx = ct || this.context; //override this.context with any passed in context
    
    if (typeof(ctx) != "object") { //throw an error if there still is no context to use
        throw "Error: Canvas Context has not been defined.";
    }

    //calculate delta if needed
    if (this.fps) {
        var framesPassed = 0;
        var now = (new Date()).getTime();
        var localDeltaTime = now - this.lastTime;
        
        if (this.lastTime) { //if its not the first time
            framesPassed = localDeltaTime / ((1000 / this.fps));
        }
        this.frame += framesPassed;
        
        this.lastTime = now;
    }
    
    if ((this.totalFrames != "auto") && this.totalFrames && (this.frame >= this.totalFrames)) { //if totalFrames is not auto or 0, check it, else rely on sprite sheet ending to reset frame
        var loops = 0;
        while (this.frame >= this.totalFrames) {
            this.frame -= this.totalFrames; //don't just reset to zero, as the delta needs to carry over even when the page comes back
            loops++; //how many loops would have happened
        }
        
        this._cellRow = 0;
        this._cellCol = 0;
        
        if (this.loop) {
            this._currentLoop += loops;
        }
    }
    
    
    if (this.loop && (this._currentLoop >= this.loop)) {
        this.finished = true;
    } else {
        
        //render and cell picking logic
        var cframe = Math.floor(this.frame); //current frame as an integer (i.e. what frame should be playing)
        
        var cellPositionX = this._cellCol * this.cellWidth;
        var cellPositionY = this._cellRow * this.cellHeight;

        if (cframe === 0) {
            cellPositionX = 0;
            cellPositionY = 0;
            this._cellCol = 0;
            this._cellRow = 0;
        }
        
        if ((this._cellCol + (this._maxCols * this._cellRow)) != cframe) { //if the frame has changed, update cellCol position to the frame it should be at
            this._cellCol = cframe - (this._maxCols * this._cellRow);
            
            //only recalculate everything if the frame changed
            cellPositionX = this._cellCol * this.cellWidth;
            if (cellPositionX > (this.image.width - this.cellWidth)) { //if its out of bounds horizontally, move to the next row
                cellPositionX = 0;
                this._maxCols = this._cellCol; //set the _maxCols property
                this._cellCol = 0;
                this._cellRow++;
            }
        
            cellPositionY = this._cellRow * this.cellHeight;
            if (cellPositionY > (this.image.height - this.cellHeight)) { //if its reached the vertical end, the sprite has run out of images, so best not to show anything and wait for maxframes to reset
                cellPositionY = -1; //make the image invalid so its not visible

                //if totalFrames is auto, reset now, else show nothing until totalFrames is complete
                if (this.totalFrames == 'auto') {
                    this.totalFrames = cframe; //set the totalFrames property
                    
                    if (this.loop) {
                        this._currentLoop++;
                    }

                    this._cellCol = 0;
                    this._cellRow = 0;
                    cellPositionX = 0;

                    if ((this.loop === 0) || (this._currentLoop < this.loop)) {
                        cellPositionY = 0;
                    }
                    this.frame = 0;
                }
            }
        }
        
        ctx.save();
            if (cellPositionY !== -1) {
                ctx.translate(this.x, this.y);
                ctx.scale(this.width / this.cellWidth, this.height / this.cellHeight);
                ctx.drawImage(this.image, cellPositionX, cellPositionY, this.cellWidth, this.cellHeight, -this.cellWidth/2, -this.cellHeight/2, this.cellWidth, this.cellHeight);
                //ctx.drawImage(this.image, cellPositionX, cellPositionY, this.cellWidth, this.cellHeight, -this.width/2, -this.height/2, this.width, this.height); //use this to avoid using scale. however with this, you can't flip images using negative width and heights (which is what context.scale() CAN do).
            }
        ctx.restore();    
        
        if (!this.fps && this.totalFrames) { //if not using fps and delta, & more than 1 frame of animation, then just incremement
            this.frame++;
        }
    }
};