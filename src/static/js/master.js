

var wbcanvas = function(id, connector) {
    var cmds = [];
    var obj = $("#"+id);
    var drawing = false;
    var canvas = document.getElementById('whiteboard');
    var ctx = canvas.getContext('2d');
    var srcX = 0; //obj.position().left;
    var srcY = 0; //obj.position().top;
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    var color = "rgba(0, 0, 0, 1)";
    var size = 4;


    var lastpos = null;
    ctx.fillStyle= "rgba(255, 255, 255, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    function send(c) {
        evaluate(c);
        cmds.push(c);
        connector.send(JSON.stringify(c));
    }
    
    connector.on_message = function(data) {
        evaluate(data);
    }
    
    this.play = function() {
       clear();
       var CHUNK_INTERVAL = 25; // ms.
       var running = false, num_cmds = 0, processTimer;

        function run() {
            window.clearTimeout(processTimer);
            processTimer = null;
            if (!running) return;
            // Some work chunk.  Let's simulate it:
            evaluate(cmds[num_cmds]);
            num_cmds++;
            if (num_cmds < cmds.length) {
              processTimer = window.setTimeout(run, CHUNK_INTERVAL);
            } else {
              num_cmds = 0, running = false;
            }
        }
        running = true;
        processTimer = window.setTimeout(run, CHUNK_INTERVAL);
    }
    this.set_color = function(c) {
        color = c;
    }

    this.set_line_size = function(s) {
        size = s;
    }
    
    this.clear_screen = function() {
        send({c: 'clear'});
    }

    function line(p0, p1) {
            ctx.lineCap="round";
            ctx.lineWidth = size;
            ctx.strokeStyle=  color;
            ctx.beginPath();
            ctx.lineJoin="round";
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.stroke();
    }
    
    function clear() {
         ctx.fillStyle= "rgba(255, 255, 255, 1)";
         ctx.fillRect(0, 0, canvas.width, canvas.height);

    }
    this.applyEffect = function applyEffect() {
        // Get the CanvasPixelArray from the given coordinates and dimensions.
        var imgd =  ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pix = imgd.data;

        // Loop over each pixel and invert the color.
        for (var i = 0, n = pix.length; i < n; i += 4) {
            pix[i  ] = 255 - pix[i  ]; // red
            pix[i+1] = 255 - pix[i+1]; // green
            pix[i+2] = 255 - pix[i+2]; // blue
            // i+3 is alpha (the fourth element)
        }

        // Draw the ImageData at the given (x,y) coordinates.
        ctx.putImageData(imgd, 0, 0);
    }           



    function evaluate(cmd) {
        var old_color = color; 
        var old_size = size; 
        if (cmd.size){
            size = cmd.size;
        }
        if (cmd.color) {
            color = cmd.color;
        }
        switch (cmd.c) {
            case 'l': 
                var p0 = denormalize(cmd.p0);
                var p1 = denormalize(cmd.p1);
                line(p0, p1);
                break;
            case 'clear':
                clear();
               break; 
             case 'apply':
                 applyEffect();
                 break;
        }
        color = old_color;
        size = old_size;
    }
    
   
    obj.bind("touchstart",  function (event) {
            drawing = true;
        }
    );

    obj.bind("touchend", function (event) {
            drawing = false;
            lastpos = null;
        }
    );

    function touchMove(event) {
        if (!event.touches) return 
        var x = event.touches[0].pageX;
        var y = event.touches[0].pageY
          
           move({clientX:x, clientY:y});
    }
    obj.bind("touchmove", touchMove);

    function normalize(pos) {
        var p0 = pos[0]/canvas.width;
        var p1 = pos[1]/canvas.height;
        return [p0, p1];
    }
    function denormalize(pos) {
        var p0 = pos[0]*canvas.width;
        var p1 = pos[1]*canvas.height;
        return [p0, p1];
    }
    function move(e){
      var pos = [e.clientX - this.offsetLeft, e.clientY - this.offsetTop];
      if(drawing && lastpos) {
          //normalize pos
          send({c: 'l', p0: normalize(lastpos), p1: normalize(pos), color:color, size:size});
      }
      lastpos = pos;
    }

    obj.mousemove(move);

    obj.mouseup(function(e) {
        drawing = false;
        //todo send command
        //send("u");
    });

    obj.mousedown(function(e) {
        drawing = true;
        //todo send command
        //send("d");
    });
    return this;
}

var whiteboard = function() {
    var ws;

    this.on_message = function(data) {
        console.log(data);
    }
    this.init = function(board) {
        var url = "ws://" + window.location.host;
        if (location.port == "") {
            url += ":8000";
        }
        url += "/track/" + board;
        ws = new WebSocket(url);
        ws.onopen = function() {
        }
        ws.onmessage = function(event) {
            console.log(event.data);
            on_message(JSON.parse(event.data));

        }
        ws.onclose = function() {
        }
    }

    this.send = function(data) {
        ws.send(data);
    }
    return this;
}

function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}

var toolbar = function(id, cnvs) {
    var obj = $("#" + id);
    var canvas = cnvs;

    function sel(id) {
        $(".tool").removeClass('selected');
        $(id).addClass('selected');
        
    }
    obj.find("#red").click(function() {
        canvas.set_color("rgba(255, 0, 0, 1)");
        sel(this);
    });

    obj.find("#black").click(function() {
        canvas.set_color("rgba(0, 0, 0, 1)");
        sel(this);
    });

    obj.find("#white").click(function() {
        canvas.set_color("rgba(255, 255, 255, 1)");
        sel(this);
    });
    obj.find("#clear").click(function() {
        canvas.clear_screen();
    });
  
    $('#line_size').change(function() {
        canvas.set_line_size($(this).val());      
    });
    $('#effect').click(function() {
        canvas.applyEffect();
    });   

    $('#play').click(function() {
        canvas.play();
    });   
    
    $('#mail').click(function() {
        var name = prompt("Type the mail here");
        if (name != "" && name != undefined) {
            var url = location;
            location = "mailto:" + name + "?subject=whitebrd.me&body=<a href='"+ url +"'>draw with me</a>";
        }
        return false;
    });
}
