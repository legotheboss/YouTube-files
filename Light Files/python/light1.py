import RPi.GPIO as GPIO
from time import sleep
alpha = 16
GPIO.setmode(GPIO.BOARD)
GPIO.setup(alpha, GPIO.OUT)
GPIO.write(alpha, 0)
GPIO.cleanup()