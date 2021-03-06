from redis import Redis
import uuid

CHANNELS = "channels"
r = Redis()

class Channel(object):
    
    def __init__(self, name=None):
        if name:
            self.name = name
        else:
            self.name = str(uuid.uuid1())
            r.rpush(CHANNELS, self.name)

    @staticmethod
    def all():
        return r.lrange(CHANNELS, 0, -1)

    def add_command(self, cmd):
        """ add command to channel command list """
        r.rpush(self.name + ":commands", cmd)

    def get_commands(self):
        return r.lrange(self.name + ":commands", 0, -1)

        
        


