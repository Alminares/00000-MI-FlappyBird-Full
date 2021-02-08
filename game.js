//DIVIDE Y VENCERÁS

// SELECCIONAR CANVAS 
const canvas = document.getElementById("lienzo");
const ctx = canvas.getContext("2d");//320*480

//CONTADOR INFINITO DE FOTOGRAMAS
let frames = 0;

//CONVERSIÓN DE GRADOS A RADIANES  180=3,1415
const DEGREE = Math.PI/180;

// CARGAR SPRITE IMAGE
const sprite = new Image();
sprite.src = "img/sprite.png";

// CARGAR SONIDOS
const SCORE_S = new Audio();
SCORE_S.src = "audio/sfx_point.wav";
const FLAP = new Audio();
FLAP.src = "audio/sfx_flap.wav";
const HIT = new Audio();
HIT.src = "audio/sfx_hit.wav";
const SWOOSHING = new Audio();
SWOOSHING.src = "audio/sfx_swooshing.wav";
const DIE = new Audio();
DIE.src = "audio/sfx_die.wav";

// COORDENADAS DEL BOTÓN DE INICIO  "START"
const startBtn = {
    x : 120,
    y : 263,
    w : 83,
    h : 29
}

// GAME STATE
const state = {
    current : 0, //  preparado 0  jugando 1   fin 2
    getReady : 0,//preparado antes de empezar
    game : 1,    //jugando
    over : 2     //fin
}

// BACKGROUND EDIFICIOS////////////////////////////////////////
const bg = {
    sX : 0,
    sY : 0,
    w : 275,
    h : 226,
    x : 0,
    y : canvas.height - 226,
    
    draw : function(){
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        //duplicar edificios por la derecha
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
    
}

// FOREGROUND SUELO///////////////////////////////////////////
const fg = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: canvas.height - 112,
    
    dx : 2,//velocidad desplazamiento izq
    
    draw : function(){
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        //repetir suelo por la derecha
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },
    //Desplazar suelo a la izq
    update: function(){
        if(state.current == state.game){
            this.x = (this.x - this.dx)%(this.w/2);
        }
    }
}


// CONTROLANDO EL JUEGO:CLICK DE RATÓN////////////////////////
canvas.addEventListener("click", function(evt){
    switch(state.current){
        case state.getReady:
            state.current = state.game;
            SWOOSHING.play();
            break;
        case state.game:
            if(bird.y - bird.radius <= 0) return;
            //Si bird.y está muy alto
            //return nos saca de aquí y 
            //no se ejecuta bird.flap() 
            //por lo que bird tiende a bajar
            bird.flap();
            FLAP.play();
            break;
        case state.over:
            /*EJEMPLO   .getBoundingClientRect()
            var elem = document.getElementById("name");
            var rect = elem.getBoundingClientRect();
            x = rect.left;
            y = rect.top;
            w = rect.width;
            h = rect.height;
            */
            //Necesario para convertir coordenadas del ratón
            //en pantalla a coordenadas dentro del canvas
            let rect = canvas.getBoundingClientRect();
            let clickX = evt.clientX - rect.left;
            let clickY = evt.clientY - rect.top;
            
            // VER SI HACEMOS CLICK EN START Y RESETEAR
            if(clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h){
                pipes.reset();//tubos
                bird.speedReset();//bird
                score.reset();//marcador
                state.current = state.getReady;//0 preparado
            }
            break;
    }
});


// BIRD//////////////////////////////////////////////////////////
const bird = {//alaArriba 0  alaMedia 1  alaAbajo 2  alaMedia 3
    animation : [//coordenadas en el SpriteSheet
        {sX: 276, sY : 112},
        {sX: 276, sY : 139},
        {sX: 276, sY : 164},
        {sX: 276, sY : 139}
    ],
    x : 50,//Bird ,coordenadas en canvas
    y : 150,
    w : 34,//Bird, ancho y alto en sprite y canvas
    h : 26,
    
    radius : 12,//círculo circunscrito
    
    frame : 0,//posición ala: 0 1 2 3 
    
    gravity : 0.2,//aceleración caida
    jump : 4,// subida en cada aleteo
    speed : 0,//velocidad actual
    rotation : 0,//rotación actual
    
    draw : function(){
        let bird = this.animation[this.frame];
        
        ctx.save();//Canvas salvar contexto
        //origen de coordenadas a x,y de bird
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h,- this.w/2, - this.h/2, this.w, this.h);
        
        ctx.restore();//Canvas restaurar contexto
    },

    //ALETEO
    flap : function(){//velocidad negativa hacia arriba
        this.speed = - this.jump;
    },
    
    update: function(){
        //ALETEO 
        //aleteolento 10 en GETREADY STATE
        //aleteo rápido 5 JUGANDO
        //ESTABLECER DURACIÓN DEL PERIODO
        this.period = state.current == state.getReady ? 10 : 5;
        //VELOCIDAD DE ALETEO 
        //incrementar frame+1 en cada periodo completado
        // osea cada 10 o cada 5 frames
        this.frame += frames%this.period == 0 ? 1 : 0;
        // frame debe ir de 0 a 3, y volver a 0
        // pues el aleteo es un ciclo de 4 imágenes
        this.frame = this.frame%this.animation.length;//4
        
        //CONTROL MOVIMIENTO VERTICAL
        if(state.current == state.getReady){//PREPARADO
            // RESET posición de BIRD después de GAME OVER
            this.y = 150; 
            this.rotation = 0 * DEGREE;
        }else{// caer si estamos jugando
            this.speed += this.gravity;
            this.y += this.speed;
            //SI TOCAMOS SUELO
            if(this.y + this.h/2 >= canvas.height - fg.h){
                this.y = canvas.height - fg.h - this.h/2;
                if(state.current == state.game){
                    state.current = state.over;
                    DIE.play();
                }
            }
            
            // SI SU VELOCIDAD ES MAYOR QUE JUMP
            // usada en bird.flap()  SIGNIFICA QUE ESTÁ CAYENDO
            if(this.speed >= 1.2 *this.jump){
                this.rotation = 90 * DEGREE;
                this.frame = 1;//ala media
            }else{//inclinado hacia arriba en cada aleteo
                this.rotation = -25 * DEGREE;
            }
        }
        
    },
    speedReset : function(){
        this.speed = 0;
    }
}

// FRASE  GET READY MESSAGE//////////////////////////////////
const getReady = {//coordenadas en el SpriteSheet
    sX : 0,
    sY : 228,
    w : 173,
    h : 152,
    x : canvas.width/2 - 173/2,//centrar en canvas
    y : 80,
    
    draw: function(){
        if(state.current == state.getReady){
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
    
}

// FRASE  GAME OVER MESSAGE/////////////////////////////////
const gameOver = {//coordenadas en el SpriteSheet
    sX : 175,
    sY : 228,
    w : 225,
    h : 202,
    x : canvas.width/2 - 225/2,//centrar en canvas
    y : 90,
    
    draw: function(){
        if(state.current == state.over){
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);   
        }
    }
    
}

// OBSTÁCULOS-TUBOS-PIPES///////////////////////////////
const pipes = {
    position : [],//array que contendrá todos los tubos
                  //que hay en pantalla
                  //{x,y}por cada tubo  [{x,y} , {x,y} , .....]
                  //position.push() añadir por la derecha
                  //position.shift() sacar por la izquierda
    
    top : {//Tubo superior coordenadas en SpriteSheet
        sX : 553,
        sY : 0
    },
    bottom:{//Tubo inferior coordenadas en SpriteSheet
        sX : 502,
        sY : 0
    },
    
    w : 53,//tamaño en SpriteSheet y Canvas
    h : 400,

    gap : 90,//distancia entre tubo superior-inferior
    //la altura de cada tubo es de 400
    //el origen del tubo superior estará fuera de pantalla
    //por la parte superior , coord Y negativa <0
    //alturaDisponible= altura canvas - suelo - gap
    alturaDisponible : canvas.height-fg.h-90,
    dx : 2,//velocidad tubo hacia izq
    distanciaX : 100,//fotogramas entre tubos

    
    //DIBUJAR todos los tubos que hay en el array position[]
    //Top y Bottom dejando GAP vertical entre ellos
    draw : function(){
        for(let i  = 0; i < this.position.length; i++){
            let p = this.position[i];            
            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;            
            // top pipe
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);       
            // bottom pipe
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);  
        }
    },
    

    update: function(){
        //si no estamos jugando NO HAY TUBOS,return SALIMOS
        if(state.current !== state.game) return;
        
        //si estamos jugando
        //generamos tubos de forma aleatoria
        if(frames % this.distanciaX == 0){
            this.position.push({//guardar
                x : canvas.width,//vienen por la derecha
                y : (this.alturaDisponible * Math.random())-this.h //Random  menos altura tubo              //x,y de cada tubo superior  
            });
        }
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            //coord Y de los tubos inferiores            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // DETECTAR COLISIONES
            // TUBO SUPERIOR
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h){
                state.current = state.over;
                HIT.play();
            }
            // TUBO INFERIOR
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h){
                state.current = state.over;
                HIT.play();
            }
            
            // MOVER TUBOS HACIA LA IZQUIERDA
            p.x -= this.dx;
            
            // ELIMINAR DEL array position[] los tubos que
            // salen de pantalla por la izquierda
            // y subir marcador
            if(p.x + this.w <= 0){
                this.position.shift();//eliminar por izq
                score.value += 1;//subir marcador
                SCORE_S.play();
                score.best = Math.max(score.value, score.best);
                //guardar en el NAVEGADOR
                //score.best con API  localStorage en "best"
                localStorage.setItem("best", score.best);
            }
        }
    },
    
    reset : function(){
        this.position = [];//vaciar array de tubos
    }
    
}

// MARCADOR  SCORE
const score= {
    //leer del localStorage NAVEGADOR
    best : parseInt(localStorage.getItem("best")) || 0,
    value : 0,//CONTEO DE TUBOS PASADOS
    
    draw : function(){
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        if(state.current == state.game){//JUGANDO
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, canvas.width/2, 50);
            ctx.strokeText(this.value, canvas.width/2, 50);
            
        }else if(state.current == state.over){//FIN JUEGO
            // SCORE VALUE
            ctx.font = "25px Teko";
            ctx.fillText(this.value, 225, 186);
            ctx.strokeText(this.value, 225, 186);
            // BEST SCORE
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },
    
    reset : function(){
        this.value = 0;//BORRAR MARCADOR
    }
}

// DIBUJAR DRAW
function draw(){
    ctx.fillStyle = "#70c5ce";//COLOR CIELO
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    bg.draw();//fondo
    pipes.draw();//tubos
    fg.draw();//suelo
    bird.draw();//bird
    getReady.draw();
    gameOver.draw();
    score.draw();//marcador
}

// ACTUALIZAR UPDATE
function update(){
    bird.update();
    fg.update();
    pipes.update();
}

// LOOP infinito
function loop(){
    update();
    draw();
    frames++;//contador infinito de fotogramas
    
    requestAnimationFrame(loop);//bucle
}

//Esperar a que se cargue todo y comenzar loop()
window.addEventListener('load',loop());
