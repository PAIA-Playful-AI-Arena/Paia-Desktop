import pygame
import pickle
import os

class MLPlay:
    def __init__(self, *args, **kwargs):
        self.other_cars_position = []
        self.player_car_position = []
        self.action = []
    def update(self, scene_info, keyboard=[], *args, **kwargs):
        if scene_info['status'] == "GAME_ALIVE":
            if pygame.K_RIGHT in keyboard:
                self.player_car_position.append([scene_info['x'], scene_info['y']])
                self.action.append(1)
                return ['SPEED']
            elif pygame.K_LEFT in keyboard:
                self.player_car_position.append([scene_info['x'], scene_info['y']])
                self.action.append(2)
                return ['BRAKE']
            elif pygame.K_UP in keyboard:
                self.player_car_position.append([scene_info['x'], scene_info['y']])
                self.action.append(3)
                return ['MOVE_LEFT']
            elif pygame.K_DOWN in keyboard:
                self.player_car_position.append([scene_info['x'], scene_info['y']])
                self.action.append(4)
                return ['MOVE_RIGHT']
        else:
            with open(os.path.join(os.path.dirname(__file__), 'feature.pickle'), 'wb') as f:
                pickle.dump(self.player_car_position, f)
            with open(os.path.join(os.path.dirname(__file__), 'target.pickle'), 'wb') as f:
                pickle.dump(self.action, f)
    def reset(self):
        pass