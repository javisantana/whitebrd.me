

var wbcanvas = function(id, connector) {

    var obj = $("#"+id);
    var drawing = false;
    var canvas = document.getElementById('whiteboard');
    var ctx = canvas.getContext('2d');
    var srcX = 0; //obj.position().left;
    var srcY = 0; //obj.position().top;
    canvas.width = 800;
    canvas.height = 800;
    var color = "rgba(0, 0, 0, 1)";
    var size = 4;

    var lastpos = [0,0];

    function send(c) {
        evaluate(c);
        connector.send(JSON.stringify(c));
    }
    
    connector.on_message = function(data) {
        evaluate(data);
    }
    
    this.set_color = function(c) {
        color = c;
    }

    this.set_line_size = function(s) {
        size = s;
    }
    
    this.clear = function() {
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

    function evaluate(cmd) {
        var old_color = color; 
        if (cmd.size){
            size = cmd.size;
        }
        if (cmd.color) {
            color = cmd.color;
        }
        switch (cmd.c) {
            case 'l': 
                line(cmd.p0, cmd.p1);
                break;
            case 'clear':
                 ctx.clearRect (0 ,0 , canvas.width , canvas.height );

               break; 
        }
        color = old_color;

    }
    
   
    obj.bind("touchstart",  function (event) {
            drawing = true;
        }
    );

    obj.bind("touchend", function (event) {
                drawing = false;
            lastpos =  [event.touches[0].pageX - this.offsetLeft,event.touches[0].pageY- this.offsetTop];
        }
    );

    function touchMove(event) {
        var x = event.touches[0].pageX;
        var y = event.touches[0].pageY
                        
       move({clientX:x, clientY:y});
    }
    obj.bind("touchmove", touchMove);

    function move(e){
      var pos = [e.clientX - this.offsetLeft, e.clientY - this.offsetTop];
      if(drawing) {
          send({c: 'l', p0: lastpos, p1: pos, color:color, size:size});
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
        canvas.clear();
    });
  
    $('#line_size').change(function() {
        canvas.set_line_size($(this).val());      
    });
        
}
