import pickle
import os
import pygame

class MLPlay:
    def __init__(self, ai_name, *args, **kwargs):
        self.ball_served = False
        self.side = ai_name
        self.action = []
        self.ball_position = []
    def update(self, scene_info, keyboard=[], *args, **kwargs):
        if self.side == '1P':
            if scene_info['status'] != "GAME_ALIVE":
                with open(os.path.join(os.path.dirname(__file__), 'feature.pickle'), 'wb') as f:
                    pickle.dump(self.ball_position, f)
                with open(os.path.join(os.path.dirname(__file__), 'target.pickle'), 'wb') as f:
                    pickle.dump(self.action, f)
                return "RESET"
            if not self.ball_served:
                self.ball_served = True
                return "SERVE_TO_LEFT"
            else:
                if pygame.K_LEFT in keyboard:
                    self.ball_position.append([scene_info['ball_speed'][0], scene_info['ball_speed'][1]])
                    self.action.append(1)
                    return "MOVE_LEFT"
                elif pygame.K_RIGHT in keyboard:
                    self.ball_position.append([scene_info['ball_speed'][0], scene_info['ball_speed'][1]])
                    self.action.append(0)
                    return "MOVE_RIGHT"
        else:
            if scene_info['status'] != "GAME_ALIVE":
                return "RESET"
            if not self.ball_served:
                self.ball_served = True
                return "SERVE_TO_LEFT"
            else:
                if (pygame.K_a in keyboard):
                    return "MOVE_LEFT"
                elif (pygame.K_d in keyboard):
                    return "MOVE_RIGHT"
    def reset(self):
        self.ball_served = False