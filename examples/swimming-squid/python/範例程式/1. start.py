import random


class MLPlay:
    def __init__(self, *args, **kwargs):
        print("Initial ml script")

    def update(self, scene_info, keyboard=[], *args, **kwargs):
        """
        Generate the command according to the received scene information
        """
        # print("AI received data from game :", scene_info)

        actions = ["UP", "DOWN", "LEFT", "RIGHT", "NONE"]

        return random.sample(actions, 1)

    def reset(self):
        """
        Reset the status
        """
        print("reset ml script")
        pass
