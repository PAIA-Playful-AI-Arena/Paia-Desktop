import pickle
import os

class MLPlay:
    def __init__(self, *args, **kwargs):
        self.other_cars_position = []
        with open(os.path.join(os.path.dirname(__file__), 'model.pickle'), 'rb') as f:
            self.model = pickle.load(f)
    def update(self, scene_info, keyboard=[], *args, **kwargs):
        if scene_info['status'] == "GAME_ALIVE":
            self.action = self.model.predict([[scene_info['x'], scene_info['y']]])
            if self.action == 1:
                return ['SPEED']
            elif self.action == 2:
                return ['BRAKE']
            elif self.action == 3:
                return ['MOVE_LEFT']
            elif self.action == 4:
                return ['MOVE_RIGHT']
    def reset(self):
        pass