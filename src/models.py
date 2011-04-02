from redis import Redis
import uuid

CHANNELS = "channels"
r = Redis()

class Channel(object):
    
    def __init__(self):
        self.name = str(uuid.uuid1())
        r.rpush(CHANNELS, self.name)
        


