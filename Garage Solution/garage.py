import RPi.GPIO as GPIO
from time import sleep
#this is the pin variable, change it if your relay is on a different pin
relay=26;
GPIO.setmode(GPIO.BOARD)
GPIO.setup(relay, GPIO.OUT)
GPIO.output(relay, GPIO.HIGH)
GPIO.output(relay, GPIO.LOW)
sleep(1)
GPIO.output(relay, GPIO.HIGH)
GPIO.cleanup()
