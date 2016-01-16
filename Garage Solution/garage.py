import RPi.GPIO as GPIO
from time import sleep
GPIO.setmode(GPIO.BOARD)
GPIO.setup(26, GPIO.OUT)
GPIO.output(26, GPIO.HIGH)
GPIO.output(26, GPIO.LOW)
sleep(1)
GPIO.output(26, GPIO.HIGH)
GPIO.cleanup()
