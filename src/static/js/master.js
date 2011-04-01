

var wbcanvas = function(id, connector) {

    var obj = $("#"+id);
    var drawing = false;
    var canvas = document.getElementById('whiteboard');
    var ctx = canvas.getContext('2d');
    var srcX = obj.position().left;
    var srcY = obj.position().top;
    canvas.width = 800;
    canvas.height = 800;

    var lastpos = [0,0];

    function send(c) {
        console.log(c);
        evaluate(c);
        connector.send(JSON.stringify(c));
    }
    
    function line(p0, p1) {
            ctx.lineWidth = 4;
            ctx.strokeStyle= "rgba(0, 0, 0, 1)";
            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.stroke();
    }

    function evaluate(cmd) {
        if (cmd.c == 'l') {
            line(cmd.p0, cmd.p1);
        }
    }


    obj.mousemove(function(e){
      var pos = [e.clientX - srcX, e.clientY - srcY];
      if(drawing) {
          send({c: 'l', p0: lastpos, p1: pos});
      }
      lastpos = pos;
    });

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
}

var whiteboard = function() {
    this.init = function() {
        var ws = new WebSocket("ws://127.0.0.1:8888/track");
        ws.onopen = function() {
        }
        ws.onmessage = function(event) {
        }
        ws.onclose = function() {
        }
    }
    return this;
}

