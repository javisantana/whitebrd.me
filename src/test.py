

from publisher import Publisher

def test_subscribe():
    p = Publisher()
    result = []
    def callback(data):
        result.append(data)
    p.subscribe('test', callback)
    p.publish('test', 4)
    assert result[0] == 4
    p.publish('test', 4)
    assert result[1] == 4
    p.publish('test2', 4)
    assert len(result) == 2
    p.unsubscribe('test', callback)
    p.publish('test', 4)
    assert len(result) == 2
    
