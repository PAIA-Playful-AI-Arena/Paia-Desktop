import pickle
import os

class MLPlay:
    def __init__(self, player):
        self.player = player
        self.other_cars_position = []
        with open(os.path.join(os.path.dirname(__file__), 'model.pickle'), 'rb') as f:
            self.model = pickle.load(f)
    def update(self, scene_info):
        if scene_info['status'] == "RUNNING":
            if self.player == "player1":
                self.action = self.model.predict([scene_info['player_0_pos']])
                if self.action == 1:
                    return ['SPEED']
                elif self.action == 2:
                    return ['BRAKE']
                elif self.action == 3:
                    return ['MOVE_LEFT']
                elif self.action == 4:
                    return ['MOVE_RIGHT']
            elif self.player == "player2":
                self.player = scene_info['player_1_pos']
            elif self.player == "player3":
                self.player = scene_info['player_2_pos']
            elif self.player == "player4":
                self.player = scene_info['player_3_pos']
    def reset(self):
        pass