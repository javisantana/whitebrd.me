# -*- encoding: utf-8 -*-
import uuid
import logging
import os
import brukva
import tornado.httpserver
import tornado.web
import tornado.websocket
import tornado.ioloop
from models import Channel
from tornado.options import define, options

redis = brukva.Client()
redis.connect()

class WhiteboardHandler(tornado.web.RequestHandler):
    def get(self, channel):
        self.render("template.html",channel=channel, title="Websocket test")

class CreateWhitebrdHandler(tornado.web.RequestHandler):
    
    def get(self):
        channel = Channel() 
        return self.write(tornado.escape.json_encode(channel.name))


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html", title="Whiteboard.me")

class MessagesCatcher(tornado.websocket.WebSocketHandler):

    def __init__(self, *args, **kwargs):
        super(MessagesCatcher, self).__init__(*args, **kwargs)
        self.client = brukva.Client()
        self.client.connect()

    def open(self, channel):
        #logging.info("opened connection")
        self.board_name = 'board:' + channel
        self.client.subscribe(self.board_name)
        self.client.listen(self.on_new_board_message)
        self.channel = Channel(self.board_name)
        # when client connects send all commands written
        for cmd in iter(self.channel.get_commands()):
           self.write_message(cmd)

    def on_new_board_message(self, result):
        """ called when other client draws """
        # publish in the channel
        (error, data) = result
        if not error:
            try:
                self.write_message(data.body)   
            except IOError as e:
                # when client closes the page websocket is not closed
                # but connection do, so unsuscribe from channel
                self.close()

    def on_message(self, result):
        """ client message with draw command """
            # publish to other clients
        redis.publish(self.board_name, result)
        self.channel.add_command(result)

    def close(self):
        self.client.unsubscribe(self.board_name)
        self.client.disconnect()
        del self.client
        try:
            super(MessagesCatcher, self).close()
        except IOError:
            pass # java rocks


define("port", default=8000, help="run on the given port", type=int)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/', MainHandler),
            (r'/board/(.+)', WhiteboardHandler),
            (r'/track/(.+)', MessagesCatcher),
            (r'/new_board/', CreateWhitebrdHandler),
        ]
        settings = dict(
            cookie_secret="43oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=True,
            debug=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)

application = Application()

if __name__ == '__main__':
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8000)
    tornado.ioloop.IOLoop.instance().start()
