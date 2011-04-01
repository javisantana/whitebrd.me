# -*- encoding: utf-8 -*-

import os
import brukva
import tornado.httpserver
import tornado.web
import tornado.websocket
import tornado.ioloop

from tornado.options import define, options


c = brukva.Client()
c.connect()


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template.html", title="Websocket test")


class NewMessage(tornado.web.RequestHandler):
    def post(self):
        message = self.get_argument('message')
        c.publish('test_channel', message)
        self.set_header('Content-Type', 'text/plain')
        self.write('sent: %s' % (message,))


class MessagesCatcher(tornado.websocket.WebSocketHandler):
    def __init__(self, *args, **kwargs):
        super(MessagesCatcher, self).__init__(*args, **kwargs)
        self.client = brukva.Client()
        self.client.connect()
        self.client.subscribe('test_channel')

    def open(self):
        self.client.listen(self.on_message)

    def on_message(self, result):
        (error, data) = result
        if not error:
            self.write_message(str(data.body))

    def close(self):
        self.client.unsubscribe('test_channel')
        self.client.disconnect()


define("port", default=8888, help="run on the given port", type=int)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/', MainHandler),
            (r'/msg', NewMessage),
            (r'/track', MessagesCatcher),
        ]
        settings = dict(
            cookie_secret="43oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)

application = Application()

if __name__ == '__main__':
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()
