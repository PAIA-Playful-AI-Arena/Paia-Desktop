import pickle
import os
import pygame

class MLPlay:
    def __init__(self, *args, **kwargs):
        self.ball_served = False
        self.actions = []
        self.positions = []
    def update(self, scene_info, keyboard, *args, **kwargs):
        if scene_info['status'] == "GAME_PASS" or scene_info['status'] == "GAME_OVER":
            with open(os.path.join(os.path.dirname(__file__), 'target.pickle'), 'wb') as f:
                pickle.dump(self.actions, f)
            with open(os.path.join(os.path.dirname(__file__), 'feature.pickle'), 'wb') as f:
                pickle.dump(self.positions, f)
            return "RESET"
        if not self.ball_served:
            if (pygame.K_a in keyboard):
                self.ball_served = True
                return "SERVE_TO_LEFT"
            elif (pygame.K_d in keyboard):
                self.ball_served = True
                return "SERVE_TO_RIGHT"
        else:
            if pygame.K_LEFT in keyboard:
                self.ball_served = True
                self.positions.append([scene_info['ball'][0], scene_info['ball'][1]])
                self.actions.append(1)
                return "MOVE_LEFT"
            elif pygame.K_RIGHT in keyboard:
                self.ball_served = True
                self.positions.append([scene_info['ball'][0], scene_info['ball'][1]])
                self.actions.append(0)
                return "MOVE_RIGHT"
    def reset(self):
        self.ball_served = False