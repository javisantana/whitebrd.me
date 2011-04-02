
class Publisher(object):
    """ pub/sub basic class"""

    def __init__(self):
        self.boards = {}

    def subscribe(self, board_name, callback):
        if board_name not in self.boards:
            self.boards[board_name] = []
        self.boards[board_name].append(callback)

    def publish(self, board_name, data):
        if board_name in self.boards:
            callbacks = self.boards[board_name]
            for x in callbacks:
                x(data)

    def unsubscribe(self, board_name, callback):
        if board_name in self.boards:
            try:
                callbacks = self.boards[board_name]
                idx = callbacks.index(callback)
                del callbacks[idx]
            except ValueError:
                pass
