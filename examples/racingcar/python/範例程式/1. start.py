class MLPlay:
    def __init__(self, *args, **kwargs):
        self.all_cars_position = []
        self.coins_pos = []
        print("Initial ml script")

    def update(self, scene_info, keyboard=[], *args, **kwargs):
        """
        Generate the command according to the received scene information
        """
        if scene_info["status"] == "GAME_ALIVE":
            self.car_pos = (scene_info["x"], scene_info["y"])

        self.all_cars_position = scene_info["all_cars_pos"]
        if scene_info.__contains__("coin"):
            self.coin_pos = scene_info["coin"]

        return ["SPEED"]

    def reset(self):
        """
        Reset the status
        """
        print("reset ml script")
        pass
