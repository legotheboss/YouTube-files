from RPi import GPIO
import time
import sys
GPIO.setwarnings(False)
relayPin = int(sys.argv[1])
GPIO.setmode(GPIO.BOARD)
GPIO.setup(relayPin, GPIO.OUT)
GPIO.output(relayPin, GPIO.LOW)
