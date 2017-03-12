from RPi import GPIO
import time
GPIO.setwarnings(False)
alpha = 16
GPIO.setmode(GPIO.BOARD)
GPIO.setup(alpha, GPIO.OUT)
GPIO.output(alpha, GPIO.HIGH)
