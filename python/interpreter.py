import multiprocessing
import sys
import os
import io

if __name__ == '__main__':
    multiprocessing.freeze_support()
    sys.argv.pop(0)
    if sys.argv[0] == "-m":
        script = os.path.join(os.path.dirname(__file__), sys.argv[1], "__main__.py")
        sys.argv.pop(0)
    else:
        script = sys.argv[0]
    sys.path.append(os.path.dirname(script))
    sys.stdout = io.TextIOWrapper(open(sys.stdout.fileno(), 'wb', 0), encoding='utf-8', write_through=True)
    os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = "1"
    __file__ = ""
    exec(open(script, "r", encoding='utf-8').read(), globals(), locals())
